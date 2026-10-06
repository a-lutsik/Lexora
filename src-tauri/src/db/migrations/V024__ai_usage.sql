-- ============================================================
-- LEXORA — V024: AI usage counters (Settings → «Расходы AI»)
-- One row per day × role × model: requests, failures, seconds of
-- live audio, generated images. Local only — never sent anywhere.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_usage (
    id          INTEGER PRIMARY KEY,
    day         TEXT    NOT NULL,           -- YYYY-MM-DD (UTC)
    role        TEXT    NOT NULL,           -- model_route.role
    provider    TEXT    NOT NULL,
    model       TEXT    NOT NULL,
    requests    INTEGER NOT NULL DEFAULT 0,
    failures    INTEGER NOT NULL DEFAULT 0,
    seconds     REAL    NOT NULL DEFAULT 0, -- live voice session time
    units       INTEGER NOT NULL DEFAULT 0, -- generated images
    updated_at  DATETIME DEFAULT (unixepoch()),
    UNIQUE(day, role, provider, model)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_day ON ai_usage(day);
