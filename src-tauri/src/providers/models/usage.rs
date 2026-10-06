// ============================================================
// LEXORA — Usage sink: count AI calls per role and model
// Recording never fails the AI call — errors are only logged.
// ============================================================

use super::packages::RouteTarget;
use super::roles::ModelRole;
use crate::db::repos::ai_usage::{AiUsageRepo, UsageEvent};
use crate::db::DbPool;
use crate::error::AppError;

#[derive(Clone)]
pub struct UsageSink {
    pool: DbPool,
    role: ModelRole,
}

impl UsageSink {
    pub fn new(pool: DbPool, role: ModelRole) -> Self {
        Self { pool, role }
    }

    pub fn record(&self, target: &RouteTarget, ok: bool) {
        self.record_amount(target, ok, 0.0, 0);
    }

    pub fn record_amount(&self, target: &RouteTarget, ok: bool, seconds: f64, units: i64) {
        let event = UsageEvent {
            role: self.role.as_str(),
            provider: &target.provider,
            model: &target.model,
            ok,
            seconds,
            units,
        };
        let saved = self
            .pool
            .get()
            .map_err(AppError::from)
            .and_then(|conn| AiUsageRepo::record(&conn, &event));
        if let Err(e) = saved {
            log::warn!("AI usage not recorded for {}: {e}", self.role.as_str());
        }
    }
}

/// Usage of a provider chain: targets are parallel to the chain entries.
#[derive(Clone)]
pub struct ChainUsage {
    pub sink: UsageSink,
    pub targets: Vec<RouteTarget>,
}

impl ChainUsage {
    pub fn record_attempt(&self, index: usize, ok: bool) {
        if let Some(target) = self.targets.get(index) {
            self.sink.record(target, ok);
        }
    }
}
