// ============================================================
// LEXORA — AI usage counters repository (V024)
// Daily aggregates per role and model for the Settings panel.
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection};
use serde::Serialize;

/// One AI call (or a finished live session) to count.
#[derive(Debug, Clone, PartialEq)]
pub struct UsageEvent<'a> {
    pub role: &'a str,
    pub provider: &'a str,
    pub model: &'a str,
    pub ok: bool,
    /// Live voice session length.
    pub seconds: f64,
    /// Generated images.
    pub units: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiUsageRow {
    pub role: String,
    pub provider: String,
    pub model: String,
    pub requests: i64,
    pub failures: i64,
    pub seconds: f64,
    pub units: i64,
}

pub struct AiUsageRepo;

impl AiUsageRepo {
    /// Add one event to today's row (single atomic upsert).
    pub fn record(conn: &Connection, event: &UsageEvent<'_>) -> Result<(), AppError> {
        let tx = conn.unchecked_transaction()?;
        tx.execute(
            "INSERT INTO ai_usage (day, role, provider, model, requests, failures, seconds, units)
             VALUES (date('now'), ?1, ?2, ?3, 1, ?4, ?5, ?6)
             ON CONFLICT(day, role, provider, model) DO UPDATE SET
                requests   = requests + 1,
                failures   = failures + excluded.failures,
                seconds    = seconds + excluded.seconds,
                units      = units + excluded.units,
                updated_at = unixepoch()",
            params![
                event.role,
                event.provider,
                event.model,
                i64::from(!event.ok),
                event.seconds,
                event.units
            ],
        )?;
        tx.commit()?;
        Ok(())
    }

    /// Totals per role and model for the last `days` days (today included).
    pub fn summary(conn: &Connection, days: u32) -> Result<Vec<AiUsageRow>, AppError> {
        let since = format!("-{} days", days.max(1) - 1);
        let mut stmt = conn.prepare(
            "SELECT role, provider, model, SUM(requests), SUM(failures), SUM(seconds), SUM(units)
             FROM ai_usage
             WHERE day >= date('now', ?1)
             GROUP BY role, provider, model
             ORDER BY SUM(requests) DESC, role ASC",
        )?;
        let rows = stmt
            .query_map(params![since], |row| {
                Ok(AiUsageRow {
                    role: row.get(0)?,
                    provider: row.get(1)?,
                    model: row.get(2)?,
                    requests: row.get(3)?,
                    failures: row.get(4)?,
                    seconds: row.get(5)?,
                    units: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event<'a>(role: &'a str, model: &'a str, ok: bool) -> UsageEvent<'a> {
        UsageEvent {
            role,
            provider: "gemini",
            model,
            ok,
            seconds: 0.0,
            units: 0,
        }
    }

    #[test]
    fn counts_requests_failures_seconds_and_images_per_model() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let conn = pool.get()?;

        AiUsageRepo::record(&conn, &event("text_fast", "gemini-3.5-flash-lite", true))?;
        AiUsageRepo::record(&conn, &event("text_fast", "gemini-3.5-flash-lite", false))?;
        AiUsageRepo::record(&conn, &event("text_fast", "gemini-3.8-flash", true))?;
        AiUsageRepo::record(
            &conn,
            &UsageEvent { seconds: 90.0, ..event("realtime_voice", "gemini-3.8-live", true) },
        )?;
        AiUsageRepo::record(
            &conn,
            &UsageEvent { units: 1, ..event("image_gen", "gemini-3.1-flash-lite-image", true) },
        )?;

        let rows = AiUsageRepo::summary(&conn, 30)?;
        let lite = rows
            .iter()
            .find(|r| r.model == "gemini-3.5-flash-lite")
            .ok_or_else(|| AppError::NotFound("lite row".into()))?;
        assert_eq!((lite.requests, lite.failures), (2, 1));
        assert_eq!(rows[0].model, "gemini-3.5-flash-lite", "busiest model first");
        let live = rows
            .iter()
            .find(|r| r.role == "realtime_voice")
            .ok_or_else(|| AppError::NotFound("live row".into()))?;
        assert!((live.seconds - 90.0).abs() < f64::EPSILON);
        let images = rows
            .iter()
            .find(|r| r.role == "image_gen")
            .ok_or_else(|| AppError::NotFound("image row".into()))?;
        assert_eq!(images.units, 1);
        Ok(())
    }

    #[test]
    fn summary_skips_days_outside_the_period() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let conn = pool.get()?;
        conn.execute(
            "INSERT INTO ai_usage (day, role, provider, model, requests)
             VALUES (date('now', '-40 days'), 'vision', 'gemini', 'gemini-3.8-flash', 7)",
            [],
        )?;
        AiUsageRepo::record(&conn, &event("vision", "gemini-3.8-flash", true))?;

        let rows = AiUsageRepo::summary(&conn, 30)?;
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].requests, 1);
        assert_eq!(AiUsageRepo::summary(&conn, 60)?[0].requests, 8);
        Ok(())
    }
}
