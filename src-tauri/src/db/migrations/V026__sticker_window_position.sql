-- ============================================================
-- LEXORA — V026: sticker window positions
-- Куда пользователь перетащил окно стикера, чтобы после
-- перезапуска оно вернулось туда же. Внешний прямоугольник окна
-- в физических пикселях; slot — индекс окна `sticker-N`.
-- ============================================================

CREATE TABLE IF NOT EXISTS sticker_window_position (
    slot       INTEGER PRIMARY KEY,
    x          INTEGER NOT NULL,
    y          INTEGER NOT NULL,
    width      INTEGER NOT NULL,
    height     INTEGER NOT NULL,
    updated_at DATETIME DEFAULT (unixepoch())
);
