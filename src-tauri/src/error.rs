// ============================================================
// LEXORA — AppError
// Единственный тип ошибки в приложении. Все команды возвращают
// Result<T, AppError>. .unwrap() и .expect() запрещены.
// ============================================================

use serde::ser::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("AI provider error: {0}")]
    Provider(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid input: {0}")]
    Validation(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("HTTP error: {0}")]
    Http(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Permission denied: {0}")]
    Permission(String),
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

// ── From impls for automatic conversion ─────────────────────

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Database(e.to_string())
    }
}

impl From<r2d2::Error> for AppError {
    fn from(e: r2d2::Error) -> Self {
        AppError::Database(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Serialization(e.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        AppError::Http(e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl AppError {
    /// Feature cannot run because no live AI model is connected.
    pub fn ai_not_connected(feature: &str) -> Self {
        AppError::Validation(format!(
            "{feature} needs an AI model. Open Settings, choose a provider, and add an API key."
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_as_human_readable_string() {
        let json = serde_json::to_string(&AppError::Provider("boom".into())).expect("serialize");
        assert_eq!(json, "\"AI provider error: boom\"");
    }

    #[test]
    fn ai_not_connected_tells_the_user_to_open_settings() {
        let msg = AppError::ai_not_connected("Translation").to_string();
        assert!(msg.contains("Open Settings"));
        assert!(msg.contains("API key"));
    }
}
