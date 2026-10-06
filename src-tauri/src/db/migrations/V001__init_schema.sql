-- ============================================================
-- LEXORA — Master Database Schema
-- Версия: 1.0 | Применяется через refinery migrations
-- Правила: snake_case, soft delete, нормализованный текст,
--          транзакции для всех мутаций, индексы для JOIN/WHERE
-- ============================================================
-- PRAGMA-блок намеренно отсутствует: pragmas применяются
-- per-connection в db::create_pool.

-- ── Language ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS language (
    id              INTEGER PRIMARY KEY,
    code            TEXT    NOT NULL UNIQUE,   -- 'en', 'ru', 'de'
    name            TEXT    NOT NULL,           -- 'English'
    native_name     TEXT    NOT NULL,           -- 'English'
    writing_system  TEXT    NOT NULL DEFAULT 'latin',
    has_tts         INTEGER NOT NULL DEFAULT 0, -- 0/1
    has_asr         INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT (unixepoch())
);

-- ── Lexeme (canonical word/phrase) ───────────────────────

CREATE TABLE IF NOT EXISTS lexeme (
    id              INTEGER PRIMARY KEY,
    language_id     INTEGER NOT NULL REFERENCES language(id),
    text            TEXT    NOT NULL,
    normalized_text TEXT    NOT NULL,          -- LOWER(TRIM(text))
    part_of_speech  TEXT,                      -- 'noun'|'verb'|'adj'|...
    phonetic        TEXT,                      -- IPA transcription
    frequency_rank  INTEGER,                   -- Global frequency rank
    is_system       INTEGER NOT NULL DEFAULT 1, -- System vs user-created
    created_at      DATETIME DEFAULT (unixepoch()),
    updated_at      DATETIME DEFAULT (unixepoch()),
    deleted_at      DATETIME,                  -- Soft delete
    UNIQUE(language_id, normalized_text)       -- Deduplication
);

CREATE INDEX IF NOT EXISTS idx_lexeme_language_text
    ON lexeme(language_id, normalized_text);

CREATE INDEX IF NOT EXISTS idx_lexeme_frequency
    ON lexeme(language_id, frequency_rank);

-- ── Translation ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS translation (
    id                  INTEGER PRIMARY KEY,
    lexeme_id           INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    target_language_id  INTEGER NOT NULL REFERENCES language(id),
    translated_text     TEXT    NOT NULL,
    sense               TEXT,       -- Usage context/hint
    source              TEXT,       -- 'openai'|'gemini'|'manual'
    confidence          REAL,       -- 0.0–1.0
    created_at          DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_translation_lexeme
    ON translation(lexeme_id, target_language_id);

CREATE INDEX IF NOT EXISTS idx_translation_target_text
    ON translation(target_language_id, translated_text);

-- ── Example ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS example (
    id          INTEGER PRIMARY KEY,
    lexeme_id   INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    sentence    TEXT    NOT NULL,
    translation TEXT,
    source      TEXT,
    difficulty  INTEGER,    -- 1–5
    created_at  DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_example_lexeme ON example(lexeme_id);

-- ── Media ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media (
    id          INTEGER PRIMARY KEY,
    lexeme_id   INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    media_type  TEXT    NOT NULL,   -- 'image'|'gif'|'audio'
    local_path  TEXT    NOT NULL,   -- App data relative path
    source_url  TEXT,
    provider    TEXT,
    content_hash TEXT,              -- SHA-256 for cache dedup
    created_at  DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_media_lexeme ON media(lexeme_id, media_type);

-- ── Collection ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collection (
    id              INTEGER PRIMARY KEY,
    name            TEXT    NOT NULL,
    description     TEXT,
    collection_type TEXT    NOT NULL DEFAULT 'system', -- 'system'|'user'
    language_id     INTEGER NOT NULL REFERENCES language(id),
    is_active       INTEGER NOT NULL DEFAULT 0,  -- Included in SRS queue
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS collection_item (
    id              INTEGER PRIMARY KEY,
    collection_id   INTEGER NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
    lexeme_id       INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(collection_id, lexeme_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_item_collection
    ON collection_item(collection_id, sort_order);

-- ── User Vocabulary ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_vocabulary (
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL DEFAULT 1,  -- Single-user app
    lexeme_id   INTEGER NOT NULL REFERENCES lexeme(id),
    added_at    DATETIME DEFAULT (unixepoch()),
    is_favorite INTEGER NOT NULL DEFAULT 0,
    notes       TEXT,
    source      TEXT,    -- 'popup'|'manual'|'import'
    deleted_at  DATETIME, -- Soft delete
    UNIQUE(user_id, lexeme_id)
);

CREATE INDEX IF NOT EXISTS idx_uv_user_lexeme
    ON user_vocabulary(user_id, lexeme_id);

CREATE INDEX IF NOT EXISTS idx_uv_user_added
    ON user_vocabulary(user_id, added_at DESC);

-- ── Review State (SRS) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_state (
    id                  INTEGER PRIMARY KEY,
    user_vocabulary_id  INTEGER NOT NULL UNIQUE
        REFERENCES user_vocabulary(id) ON DELETE CASCADE,
    status              TEXT    NOT NULL DEFAULT 'new',
        -- 'new'|'learning'|'review'|'mature'|'suspended'
    ease                REAL    NOT NULL DEFAULT 2.5,   -- SM-2 ease factor
    interval            INTEGER NOT NULL DEFAULT 0,     -- Days
    due_at              DATETIME NOT NULL DEFAULT (unixepoch()),
    lapses              INTEGER NOT NULL DEFAULT 0,
    repetitions         INTEGER NOT NULL DEFAULT 0,
    updated_at          DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_review_due
    ON review_state(due_at, status)
    WHERE status != 'suspended';

-- ── Review Event (History) ────────────────────────────────

CREATE TABLE IF NOT EXISTS review_event (
    id                  INTEGER PRIMARY KEY,
    review_state_id     INTEGER NOT NULL REFERENCES review_state(id),
    mode                TEXT    NOT NULL,  -- StudyMode
    grade               INTEGER NOT NULL,  -- 0–4
    user_response       TEXT,
    latency_ms          INTEGER,
    error_type          TEXT,
    timestamp           DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_review_event_state
    ON review_event(review_state_id, timestamp DESC);

-- ── User Settings ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
    id                      INTEGER PRIMARY KEY DEFAULT 1,
    primary_language        TEXT    NOT NULL DEFAULT 'en',
    interface_language      TEXT    NOT NULL DEFAULT 'en',
    ai_provider             TEXT    NOT NULL DEFAULT 'openai',
    ai_model                TEXT    NOT NULL DEFAULT 'gpt-4o-mini',
    custom_base_url         TEXT,
    cloudflare_account_id   TEXT,
    tts_voice               TEXT    NOT NULL DEFAULT 'default',
    sticker_count           INTEGER NOT NULL DEFAULT 2,
    sticker_opacity         REAL    NOT NULL DEFAULT 0.9,
    quiet_hours_start       TEXT,   -- 'HH:MM'
    quiet_hours_end         TEXT,
    offline_mode            INTEGER NOT NULL DEFAULT 0,
    updated_at              DATETIME DEFAULT (unixepoch())
);

-- ── FTS5 for full-text search ─────────────────────────────

CREATE VIRTUAL TABLE IF NOT EXISTS lexeme_fts USING fts5(
    text,
    normalized_text,
    content='lexeme',
    content_rowid='id'
);

-- ── Seed data: languages ──────────────────────────────────

INSERT OR IGNORE INTO language (code, name, native_name, writing_system, has_tts, has_asr)
VALUES
    ('en', 'English',    'English',    'latin',    1, 1),
    ('ru', 'Russian',    'Русский',    'cyrillic', 1, 0),
    ('de', 'German',     'Deutsch',    'latin',    1, 0),
    ('fr', 'French',     'Français',   'latin',    1, 0),
    ('es', 'Spanish',    'Español',    'latin',    1, 0),
    ('it', 'Italian',    'Italiano',   'latin',    1, 0),
    ('ja', 'Japanese',   '日本語',     'cjk',      1, 0),
    ('zh', 'Chinese',    '中文',       'cjk',      1, 0);

-- ── Seed data: default settings ───────────────────────────

INSERT OR IGNORE INTO user_settings (id) VALUES (1);

-- ── Seed data: system collections ─────────────────────────

INSERT OR IGNORE INTO collection (name, description, collection_type, language_id, sort_order)
VALUES
    ('Top 5000 Words', 'Most frequent English words', 'system', 1, 1),
    ('Phrasal Verbs',  'Common English phrasal verbs', 'system', 1, 2),
    ('Irregular Verbs', 'English irregular verbs', 'system', 1, 3),
    ('Business English', 'Business vocabulary', 'system', 1, 4);
