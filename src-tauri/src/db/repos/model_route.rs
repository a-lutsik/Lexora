// ============================================================
// LEXORA — Model route repository (V023)
// Ordered model chain per AI role: position 0 = primary.
// ============================================================

use crate::error::AppError;
use crate::providers::models::packages::RouteTarget;
use crate::providers::models::roles::ModelRole;
use rusqlite::{params, Connection};
use std::collections::HashMap;

pub type RoleRoutes = HashMap<ModelRole, Vec<RouteTarget>>;

pub struct ModelRouteRepo;

impl ModelRouteRepo {
    /// Enabled routes per role, in chain order. Unknown role names are ignored.
    pub fn load(conn: &Connection) -> Result<RoleRoutes, AppError> {
        let mut stmt = conn.prepare(
            "SELECT role, provider, model FROM model_route
             WHERE enabled = 1
             ORDER BY role ASC, position ASC",
        )?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let mut routes: RoleRoutes = HashMap::new();
        for (role, provider, model) in rows {
            if let Some(role) = ModelRole::parse(&role) {
                routes
                    .entry(role)
                    .or_default()
                    .push(RouteTarget { provider, model });
            }
        }
        Ok(routes)
    }

    pub fn is_empty(conn: &Connection) -> Result<bool, AppError> {
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM model_route", [], |r| r.get(0))?;
        Ok(count == 0)
    }

    /// Replace the chain of one role (single transaction).
    pub fn replace_role(
        conn: &mut Connection,
        role: ModelRole,
        targets: &[RouteTarget],
    ) -> Result<(), AppError> {
        let tx = conn.transaction()?;
        Self::write_role(&tx, role, targets)?;
        tx.commit()?;
        Ok(())
    }

    /// Replace every given role chain atomically.
    pub fn replace_all(
        conn: &mut Connection,
        routes: &[(ModelRole, Vec<RouteTarget>)],
    ) -> Result<(), AppError> {
        let tx = conn.transaction()?;
        for (role, targets) in routes {
            Self::write_role(&tx, *role, targets)?;
        }
        tx.commit()?;
        Ok(())
    }

    /// Write several role chains inside the caller's transaction.
    pub fn write_all(
        conn: &Connection,
        routes: &[(ModelRole, Vec<RouteTarget>)],
    ) -> Result<(), AppError> {
        for (role, targets) in routes {
            Self::write_role(conn, *role, targets)?;
        }
        Ok(())
    }

    /// Write one role chain inside the caller's transaction.
    pub fn write_role(
        conn: &Connection,
        role: ModelRole,
        targets: &[RouteTarget],
    ) -> Result<(), AppError> {
        conn.execute(
            "DELETE FROM model_route WHERE role = ?1",
            params![role.as_str()],
        )?;
        for (position, target) in targets.iter().enumerate() {
            let provider = target.provider.trim();
            let model = target.model.trim();
            if provider.is_empty() || model.is_empty() {
                return Err(AppError::Validation(format!(
                    "Empty provider or model in route for {}",
                    role.as_str()
                )));
            }
            conn.execute(
                "INSERT INTO model_route (role, position, provider, model, enabled)
                 VALUES (?1, ?2, ?3, ?4, 1)",
                params![role.as_str(), position as i64, provider, model],
            )?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations};

    fn conn() -> r2d2::PooledConnection<r2d2_sqlite::SqliteConnectionManager> {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        pool.get().expect("conn")
    }

    #[test]
    fn replace_all_round_trips_in_chain_order() {
        let mut conn = conn();
        assert!(ModelRouteRepo::is_empty(&conn).expect("empty"));

        ModelRouteRepo::replace_all(
            &mut conn,
            &[
                (
                    ModelRole::Vision,
                    vec![
                        RouteTarget::new("gemini", "gemini-3.8-flash"),
                        RouteTarget::new("openai", "gpt-6-luna"),
                    ],
                ),
                (ModelRole::ImageGen, vec![]),
            ],
        )
        .expect("write");

        let routes = ModelRouteRepo::load(&conn).expect("load");
        assert_eq!(
            routes.get(&ModelRole::Vision).cloned(),
            Some(vec![
                RouteTarget::new("gemini", "gemini-3.8-flash"),
                RouteTarget::new("openai", "gpt-6-luna"),
            ])
        );
        assert!(!routes.contains_key(&ModelRole::ImageGen), "empty chain stores nothing");
    }

    #[test]
    fn replace_role_only_touches_that_role() {
        let mut conn = conn();
        ModelRouteRepo::replace_all(
            &mut conn,
            &[
                (ModelRole::TextFast, vec![RouteTarget::new("gemini", "gemini-3.5-flash-lite")]),
                (ModelRole::Tts, vec![RouteTarget::new("system", "say")]),
            ],
        )
        .expect("seed");

        ModelRouteRepo::replace_role(
            &mut conn,
            ModelRole::TextFast,
            &[RouteTarget::new("openai", "gpt-6-luna")],
        )
        .expect("replace");

        let routes = ModelRouteRepo::load(&conn).expect("load");
        assert_eq!(
            routes[&ModelRole::TextFast],
            vec![RouteTarget::new("openai", "gpt-6-luna")]
        );
        assert_eq!(routes[&ModelRole::Tts], vec![RouteTarget::new("system", "say")]);
    }

    #[test]
    fn empty_model_is_rejected_and_rolled_back() {
        let mut conn = conn();
        ModelRouteRepo::replace_all(
            &mut conn,
            &[(ModelRole::Vision, vec![RouteTarget::new("gemini", "gemini-3.8-flash")])],
        )
        .expect("seed");

        let err = ModelRouteRepo::replace_all(
            &mut conn,
            &[(ModelRole::Vision, vec![RouteTarget::new("gemini", "  ")])],
        );
        assert!(matches!(err, Err(AppError::Validation(_))));

        let routes = ModelRouteRepo::load(&conn).expect("load");
        assert_eq!(
            routes[&ModelRole::Vision],
            vec![RouteTarget::new("gemini", "gemini-3.8-flash")],
            "failed write must not wipe the previous chain"
        );
    }
}
