// ============================================================
// LEXORA — Sticker window positions repository (V026)
// Позиции окон стикеров переживают перезапуск приложения.
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection};

/// Внешний прямоугольник окна `sticker-{slot}` в физических пикселях.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StickerWindowRect {
    pub slot: i64,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

pub struct StickerWindowRepo;

impl StickerWindowRepo {
    /// Все сохранённые позиции, по возрастанию слота.
    pub fn list(conn: &Connection) -> Result<Vec<StickerWindowRect>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT slot, x, y, width, height
             FROM sticker_window_position
             ORDER BY slot",
        )?;
        let rects = stmt
            .query_map([], |row| {
                Ok(StickerWindowRect {
                    slot: row.get(0)?,
                    x: row.get(1)?,
                    y: row.get(2)?,
                    width: row.get(3)?,
                    height: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rects)
    }

    /// Записать позиции нескольких окон одной транзакцией (upsert по слоту).
    pub fn save_all(conn: &Connection, rects: &[StickerWindowRect]) -> Result<(), AppError> {
        let tx = conn.unchecked_transaction()?;
        for rect in rects {
            tx.execute(
                "INSERT INTO sticker_window_position (slot, x, y, width, height)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 ON CONFLICT(slot) DO UPDATE SET
                    x          = excluded.x,
                    y          = excluded.y,
                    width      = excluded.width,
                    height     = excluded.height,
                    updated_at = unixepoch()",
                params![rect.slot, rect.x, rect.y, rect.width, rect.height],
            )?;
        }
        tx.commit()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rect(slot: i64, x: i32, y: i32) -> StickerWindowRect {
        StickerWindowRect {
            slot,
            x,
            y,
            width: 760,
            height: 300,
        }
    }

    #[test]
    fn saves_and_lists_rects_per_slot() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let conn = pool.get()?;

        assert!(StickerWindowRepo::list(&conn)?.is_empty());
        StickerWindowRepo::save_all(&conn, &[rect(1, 3000, 200), rect(0, -1200, 40)])?;

        assert_eq!(
            StickerWindowRepo::list(&conn)?,
            vec![rect(0, -1200, 40), rect(1, 3000, 200)]
        );
        Ok(())
    }

    #[test]
    fn saving_a_slot_again_replaces_its_rect() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let conn = pool.get()?;

        StickerWindowRepo::save_all(&conn, &[rect(0, 10, 20), rect(2, 30, 40)])?;
        StickerWindowRepo::save_all(&conn, &[rect(0, 500, 600)])?;

        assert_eq!(
            StickerWindowRepo::list(&conn)?,
            vec![rect(0, 500, 600), rect(2, 30, 40)]
        );
        Ok(())
    }
}
