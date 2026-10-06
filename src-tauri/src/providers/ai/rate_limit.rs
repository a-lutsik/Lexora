// ============================================================
// LEXORA — AI HTTP rate-limit fuse (429 Too Many Requests)
// Detect, backoff/retry once, then surface a clear user message.
// ============================================================

use crate::error::AppError;
use reqwest::{header::HeaderMap, StatusCode};
use std::time::Duration;

/// Max automatic retries after a 429 (total attempts = 1 + this).
pub const RATE_LIMIT_MAX_RETRIES: u32 = 1;

/// Default wait when Retry-After is missing or unusable.
pub const RATE_LIMIT_DEFAULT_BACKOFF: Duration = Duration::from_secs(2);

/// Cap Retry-After so a misbehaving server cannot block the UI forever.
pub const RATE_LIMIT_MAX_BACKOFF: Duration = Duration::from_secs(30);

/// True when HTTP status is 429 or the body clearly reports rate limiting.
pub fn is_rate_limit_status(status: StatusCode) -> bool {
    status == StatusCode::TOO_MANY_REQUESTS
}

pub fn body_looks_rate_limited(body: &str) -> bool {
    let lower = body.to_ascii_lowercase();
    lower.contains("rate limit")
        || lower.contains("rate_limit")
        || lower.contains("too many requests")
        || lower.contains("quota exceeded")
        || lower.contains("resource_exhausted")
}

/// Parse Retry-After (seconds or HTTP-date ignored → default).
pub fn retry_after_delay(headers: &HeaderMap) -> Duration {
    let Some(value) = headers.get(reqwest::header::RETRY_AFTER) else {
        return RATE_LIMIT_DEFAULT_BACKOFF;
    };
    let Ok(raw) = value.to_str() else {
        return RATE_LIMIT_DEFAULT_BACKOFF;
    };
    let trimmed = raw.trim();
    if let Ok(secs) = trimmed.parse::<u64>() {
        let capped = secs.min(RATE_LIMIT_MAX_BACKOFF.as_secs());
        return Duration::from_secs(capped.max(1));
    }
    RATE_LIMIT_DEFAULT_BACKOFF
}

/// User-facing error after retries are exhausted (or for non-retriable display).
pub fn rate_limit_error(provider: &str) -> AppError {
    let lower = provider.to_ascii_lowercase();
    let tip = if lower.contains("image") {
        "Wait about 90 seconds, or add an OpenAI API key in Settings to generate the next picture without waiting."
    } else {
        "Wait a few seconds, then try again. \
         Tip: switch modes less rapidly or enable a fallback AI provider in Settings."
    };
    AppError::Provider(format!("{provider}: Too many requests (429). {tip}"))
}

pub fn is_rate_limited(err: &AppError) -> bool {
    let msg = err.to_string().to_ascii_lowercase();
    msg.contains("429") || msg.contains("too many requests") || msg.contains("rate limit")
}

pub fn http_provider_error(provider: &str, status: StatusCode, body: &str) -> AppError {
    if is_rate_limit_status(status) || body_looks_rate_limited(body) {
        return rate_limit_error(provider);
    }
    let snippet: String = body.chars().take(280).collect();
    if snippet.trim().is_empty() {
        AppError::Provider(format!("{provider} API error {status}"))
    } else {
        AppError::Provider(format!("{provider} API error {status}: {snippet}"))
    }
}

/// Sleep for Retry-After / default backoff (used between 429 retries).
pub async fn wait_for_retry_after(headers: &HeaderMap) {
    let delay = retry_after_delay(headers);
    tokio::time::sleep(delay).await;
}

/// Classify a finished Response: Ok(resp) to continue, or Err(rate_limit / other).
/// When rate-limited and `attempt < RATE_LIMIT_MAX_RETRIES`, waits and returns `Retry`.
pub enum RateLimitOutcome {
    Ok(reqwest::Response),
    Retry,
    Err(AppError),
}

pub async fn check_response_rate_limit(
    provider: &str,
    resp: reqwest::Response,
    attempt: u32,
) -> RateLimitOutcome {
    let status = resp.status();
    if status.is_success() {
        return RateLimitOutcome::Ok(resp);
    }

    let headers = resp.headers().clone();
    let body = resp.text().await.unwrap_or_default();
    let rate_limited = is_rate_limit_status(status) || body_looks_rate_limited(&body);

    if rate_limited && attempt < RATE_LIMIT_MAX_RETRIES {
        log::warn!(
            "{provider} rate limited (attempt {}/{}), backing off {:?}",
            attempt + 1,
            RATE_LIMIT_MAX_RETRIES + 1,
            retry_after_delay(&headers)
        );
        wait_for_retry_after(&headers).await;
        return RateLimitOutcome::Retry;
    }

    RateLimitOutcome::Err(http_provider_error(provider, status, &body))
}

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::header::{HeaderMap, HeaderValue, RETRY_AFTER};

    #[test]
    fn detects_429_status() {
        assert!(is_rate_limit_status(StatusCode::TOO_MANY_REQUESTS));
        assert!(!is_rate_limit_status(StatusCode::BAD_REQUEST));
    }

    #[test]
    fn detects_rate_limit_body() {
        assert!(body_looks_rate_limited(
            r#"{"error":{"message":"Rate limit exceeded"}}"#
        ));
        assert!(body_looks_rate_limited("RESOURCE_EXHAUSTED"));
        assert!(!body_looks_rate_limited("invalid api key"));
    }

    #[test]
    fn retry_after_seconds_capped() {
        let mut headers = HeaderMap::new();
        headers.insert(RETRY_AFTER, HeaderValue::from_static("5"));
        assert_eq!(retry_after_delay(&headers), Duration::from_secs(5));

        headers.insert(RETRY_AFTER, HeaderValue::from_static("999"));
        assert_eq!(retry_after_delay(&headers), RATE_LIMIT_MAX_BACKOFF);
    }

    #[test]
    fn retry_after_missing_uses_default() {
        let headers = HeaderMap::new();
        assert_eq!(retry_after_delay(&headers), RATE_LIMIT_DEFAULT_BACKOFF);
    }

    #[test]
    fn rate_limit_error_is_user_friendly() {
        let err = rate_limit_error("OpenAI");
        let msg = err.to_string();
        assert!(msg.contains("429") || msg.contains("Too many"));
        assert!(msg.contains("try again"));
    }

    #[test]
    fn http_provider_error_maps_429() {
        let err = http_provider_error("Gemini", StatusCode::TOO_MANY_REQUESTS, "nope");
        assert!(err.to_string().contains("Too many"));
    }

    #[test]
    fn image_rate_limit_asks_to_wait_then_refresh_once() {
        let err = rate_limit_error("Gemini Image");
        let msg = err.to_string();
        assert!(msg.contains("429"));
        assert!(msg.contains("OpenAI"));
        assert!(!msg.contains("switch modes"));
        assert!(is_rate_limited(&err));
    }
}
