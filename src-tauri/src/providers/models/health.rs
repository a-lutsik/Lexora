// ============================================================
// LEXORA — Model health: sticky failover between AI calls
// A model that stopped working (removed, out of quota, hanging)
// is moved to the end of its chain for a cooldown, so the next
// calls start with a working model instead of waiting on it.
// After the cooldown the model is tried first again.
// ============================================================

use super::packages::RouteTarget;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};

/// The provider no longer serves the model (404, decommissioned).
pub const GONE_COOLDOWN: Duration = Duration::from_secs(30 * 60);
/// Quota / 429: the limit window usually resets within minutes.
pub const RATE_LIMIT_COOLDOWN: Duration = Duration::from_secs(2 * 60);
/// Timeouts and server errors: skip after a streak, then probe again.
pub const FLAKY_COOLDOWN: Duration = Duration::from_secs(5 * 60);
/// Consecutive transient failures before a model is skipped.
pub const FLAKY_FAILURE_STREAK: u32 = 2;

/// Why a model attempt failed, as far as its health is concerned.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HealthFailure {
    Gone,
    RateLimit,
    Transient,
}

#[derive(Debug, Default)]
struct Entry {
    failure_streak: u32,
    cooldown_until: Option<Instant>,
}

/// Process-wide health of `provider:model` pairs.
#[derive(Debug, Default)]
pub struct ModelHealth {
    entries: Mutex<HashMap<String, Entry>>,
}

pub fn health_key(target: &RouteTarget) -> String {
    format!("{}:{}", target.provider, target.model)
}

impl ModelHealth {
    /// Shared by every chain: registries are rebuilt per call, health must outlive them.
    pub fn global() -> Arc<ModelHealth> {
        static GLOBAL: OnceLock<Arc<ModelHealth>> = OnceLock::new();
        GLOBAL.get_or_init(|| Arc::new(ModelHealth::default())).clone()
    }

    fn with_entries<T>(&self, f: impl FnOnce(&mut HashMap<String, Entry>) -> T) -> T {
        // A poisoned map only holds counters; keep using it.
        let mut guard = self.entries.lock().unwrap_or_else(|e| e.into_inner());
        f(&mut guard)
    }

    pub fn is_cooling(&self, key: &str, now: Instant) -> bool {
        self.with_entries(|entries| {
            entries
                .get(key)
                .and_then(|e| e.cooldown_until)
                .is_some_and(|until| now < until)
        })
    }

    pub fn record_success(&self, key: &str) {
        self.with_entries(|entries| {
            entries.remove(key);
        });
    }

    pub fn record_failure(&self, key: &str, failure: HealthFailure, now: Instant) {
        self.with_entries(|entries| {
            let entry = entries.entry(key.to_string()).or_default();
            entry.failure_streak = entry.failure_streak.saturating_add(1);
            let cooldown = match failure {
                HealthFailure::Gone => Some(GONE_COOLDOWN),
                HealthFailure::RateLimit => Some(RATE_LIMIT_COOLDOWN),
                HealthFailure::Transient if entry.failure_streak >= FLAKY_FAILURE_STREAK => {
                    Some(FLAKY_COOLDOWN)
                }
                HealthFailure::Transient => None,
            };
            if let Some(cooldown) = cooldown {
                entry.cooldown_until = Some(now + cooldown);
                log::warn!(
                    "AI model {key} is skipped for {}s after {failure:?} failure",
                    cooldown.as_secs()
                );
            }
        });
    }

    /// Chain indices to try: healthy models in route order, cooling ones last.
    /// Cooling models stay as a last resort so a fully degraded chain still answers.
    pub fn attempt_order(&self, keys: &[String], now: Instant) -> Vec<usize> {
        let (healthy, cooling): (Vec<usize>, Vec<usize>) =
            (0..keys.len()).partition(|&i| !self.is_cooling(&keys[i], now));
        healthy.into_iter().chain(cooling).collect()
    }
}

/// Health tracking of a provider chain: `keys` are parallel to the chain entries.
#[derive(Clone)]
pub struct ChainHealth {
    pub tracker: Arc<ModelHealth>,
    pub keys: Vec<String>,
}

impl ChainHealth {
    pub fn for_targets(targets: &[RouteTarget]) -> Self {
        Self {
            tracker: ModelHealth::global(),
            keys: targets.iter().map(health_key).collect(),
        }
    }

    /// Attempt order for a chain of `len` entries (identity when keys do not match).
    pub fn attempt_order(&self, len: usize) -> Vec<usize> {
        if self.keys.len() != len {
            return (0..len).collect();
        }
        self.tracker.attempt_order(&self.keys, Instant::now())
    }

    pub fn record(&self, index: usize, failure: Option<HealthFailure>) {
        let Some(key) = self.keys.get(index) else {
            return;
        };
        match failure {
            None => self.tracker.record_success(key),
            Some(failure) => self.tracker.record_failure(key, failure, Instant::now()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn keys(names: &[&str]) -> Vec<String> {
        names.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn gone_model_moves_to_the_end_until_cooldown_expires() {
        let health = ModelHealth::default();
        let chain = keys(&["a", "b", "c"]);
        let t0 = Instant::now();
        health.record_failure("a", HealthFailure::Gone, t0);

        assert_eq!(health.attempt_order(&chain, t0), vec![1, 2, 0]);
        assert_eq!(
            health.attempt_order(&chain, t0 + GONE_COOLDOWN - Duration::from_secs(1)),
            vec![1, 2, 0]
        );
        assert_eq!(health.attempt_order(&chain, t0 + GONE_COOLDOWN), vec![0, 1, 2]);
    }

    #[test]
    fn rate_limit_skips_only_for_a_short_window() {
        let health = ModelHealth::default();
        let t0 = Instant::now();
        health.record_failure("a", HealthFailure::RateLimit, t0);
        assert!(health.is_cooling("a", t0 + RATE_LIMIT_COOLDOWN - Duration::from_secs(1)));
        assert!(!health.is_cooling("a", t0 + RATE_LIMIT_COOLDOWN));
    }

    #[test]
    fn a_single_transient_failure_does_not_skip_the_model() {
        let health = ModelHealth::default();
        let t0 = Instant::now();
        health.record_failure("a", HealthFailure::Transient, t0);
        assert!(!health.is_cooling("a", t0));

        health.record_failure("a", HealthFailure::Transient, t0);
        assert!(health.is_cooling("a", t0));
        assert!(!health.is_cooling("a", t0 + FLAKY_COOLDOWN));
    }

    #[test]
    fn success_resets_the_failure_streak() {
        let health = ModelHealth::default();
        let t0 = Instant::now();
        health.record_failure("a", HealthFailure::Transient, t0);
        health.record_success("a");
        health.record_failure("a", HealthFailure::Transient, t0);
        assert!(!health.is_cooling("a", t0));
    }

    #[test]
    fn fully_cooling_chain_keeps_route_order() {
        let health = ModelHealth::default();
        let t0 = Instant::now();
        health.record_failure("b", HealthFailure::Gone, t0);
        health.record_failure("a", HealthFailure::Gone, t0);
        assert_eq!(health.attempt_order(&keys(&["a", "b"]), t0), vec![0, 1]);
    }

    #[test]
    fn mismatched_keys_fall_back_to_identity_order() {
        let health = ChainHealth {
            tracker: Arc::new(ModelHealth::default()),
            keys: keys(&["a"]),
        };
        assert_eq!(health.attempt_order(3), vec![0, 1, 2]);
    }
}
