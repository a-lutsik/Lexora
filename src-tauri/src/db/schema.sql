-- ============================================================
-- LEXORA — Master Database Schema (reference only)
-- Версия: 1.0 | Применяется через refinery migrations
-- ВНИМАНИЕ: этот файл не исполняется напрямую. Актуальная
-- миграция — db/migrations/V001__init_schema.sql; держать
-- содержимое (кроме PRAGMA-блока ниже) синхронным с ней.
-- PRAGMA применяются per-connection в db::create_pool.
-- Правила: snake_case, soft delete, нормализованный текст,
--          транзакции для всех мутаций, индексы для JOIN/WHERE
-- ============================================================

PRAGMA journal_mode = WAL;          -- Concurrent reads
PRAGMA synchronous = NORMAL;        -- Balance safety/perf
PRAGMA foreign_keys = ON;           -- Enforce referential integrity
PRAGMA busy_timeout = 5000;         -- Wait 5s on lock

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
    enriched_at     DATETIME,                  -- Example/media cached (V006)
    visual_sense         TEXT,                 -- Mnemonic sense gloss (V011)
    visual_association   TEXT,                 -- Chosen visual association (V011)
    visual_memory_hook   TEXT,                 -- Short memory hook (V011)
    visual_image_prompt  TEXT,                 -- Image-gen prompt (V011)
    visual_photo_query   TEXT,                 -- Stock photo search fallback (V011)
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
    lexical_domain      TEXT    NOT NULL DEFAULT 'general',
    created_at          DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_translation_lexeme
    ON translation(lexeme_id, target_language_id);

CREATE INDEX IF NOT EXISTS idx_translation_target_text
    ON translation(target_language_id, translated_text);

CREATE INDEX IF NOT EXISTS idx_translation_lexeme_domain
    ON translation(lexeme_id, target_language_id, lexical_domain);

-- ── Lexeme synonym (source + target language) ─────────────

CREATE TABLE IF NOT EXISTS lexeme_synonym (
    id              INTEGER PRIMARY KEY,
    lexeme_id       INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    language_id     INTEGER NOT NULL REFERENCES language(id),
    text            TEXT    NOT NULL,
    normalized_text TEXT    NOT NULL,
    source          TEXT,
    created_at      DATETIME DEFAULT (unixepoch()),
    UNIQUE(lexeme_id, language_id, normalized_text)
);

CREATE INDEX IF NOT EXISTS idx_lexeme_synonym_lexeme
    ON lexeme_synonym(lexeme_id, language_id);

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
    pack_key        TEXT,                        -- system pack id (V018)
    load_status     TEXT    NOT NULL DEFAULT 'empty', -- empty|loading|ready|error
    loaded_at       DATETIME,
    created_at      DATETIME DEFAULT (unixepoch()),
    UNIQUE(language_id, name)
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

CREATE INDEX IF NOT EXISTS idx_review_event_timestamp
    ON review_event(timestamp, review_state_id);

-- ── User Settings ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
    id                      INTEGER PRIMARY KEY DEFAULT 1,
    primary_language        TEXT    NOT NULL DEFAULT 'en',
    interface_language      TEXT    NOT NULL DEFAULT 'en',
    ai_provider             TEXT    NOT NULL DEFAULT 'openrouter',
    ai_model                TEXT    NOT NULL DEFAULT 'minimax/minimax-m3:free',
    custom_base_url         TEXT,
    cloudflare_account_id   TEXT,
    tts_voice               TEXT    NOT NULL DEFAULT 'default',
    sticker_count           INTEGER NOT NULL DEFAULT 2,
    sticker_opacity         REAL    NOT NULL DEFAULT 0.9,
    quiet_hours_start       TEXT,   -- 'HH:MM'
    quiet_hours_end         TEXT,
    offline_mode            INTEGER NOT NULL DEFAULT 0,
    -- V004__hotkeys.sql: настраиваемые глобальные хоткеи
    hotkey_translate        TEXT    NOT NULL DEFAULT 'CmdOrCtrl+Shift+L',
    hotkey_stickers         TEXT    NOT NULL DEFAULT 'CmdOrCtrl+Shift+S',
    -- V005__fallback_provider.sql: автоматический резервный AI провайдер
    fallback_ai_provider    TEXT    DEFAULT 'openrouter',
    fallback_ai_model       TEXT    DEFAULT 'minimax/minimax-m2.7:free',
    fallback_enabled        INTEGER NOT NULL DEFAULT 1,
    -- V008__writing_privacy_mode.sql: не сохранять текст writing-проверок в БД
    writing_privacy_mode    INTEGER NOT NULL DEFAULT 0,
    -- V014__writing_auto_check.sql: автопроверка после паузы ввода (opt-in)
    writing_auto_check      INTEGER NOT NULL DEFAULT 0,
    -- V015__sticker_sources.sql: какие слова показывать на стикерах
    sticker_sources         TEXT    NOT NULL DEFAULT '["all"]',
    -- V019__image_models.sql: модель генерации картинок и её fallback
    image_model             TEXT    NOT NULL DEFAULT 'cloudflare:@cf/black-forest-labs/flux-1-schnell',
    fallback_image_model    TEXT    NOT NULL DEFAULT 'gemini:gemini-3.1-flash-image',
    -- V022__setup_profile.sql: выбранный сценарий быстрой настройки + движок TTS
    setup_profile           TEXT,
    tts_engine              TEXT    NOT NULL DEFAULT 'system',
    updated_at              DATETIME DEFAULT (unixepoch())
);

-- ── FTS5 for full-text search ─────────────────────────────

CREATE VIRTUAL TABLE IF NOT EXISTS lexeme_fts USING fts5(
    text,
    normalized_text,
    content='lexeme',
    content_rowid='id'
);

-- ── Writing Assistant (V007__writing_assistant.sql, Stage 2) ──

-- Одна сессия проверки = один вставленный текст
CREATE TABLE IF NOT EXISTS writing_check (
    id              INTEGER PRIMARY KEY,
    original_text   TEXT    NOT NULL,
    corrected_text  TEXT,               -- Финальный текст после принятия правок
    language        TEXT    NOT NULL DEFAULT 'en',
    issue_count     INTEGER NOT NULL DEFAULT 0,
    accepted_count  INTEGER NOT NULL DEFAULT 0,
    rejected_count  INTEGER NOT NULL DEFAULT 0,
    overall_score   INTEGER NOT NULL DEFAULT 100, -- 0–100 quality score
    summary         TEXT,               -- AI overall assessment
    rewrite_mode    TEXT,               -- NULL | 'clearer' | 'shorter' | 'formal' | ...
    created_at      DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_writing_check_language_date
    ON writing_check(language, created_at DESC);

-- Каждая найденная проблема в тексте
CREATE TABLE IF NOT EXISTS writing_issue (
    id                INTEGER PRIMARY KEY,
    writing_check_id  INTEGER NOT NULL REFERENCES writing_check(id) ON DELETE CASCADE,
    category          TEXT    NOT NULL,   -- 'spelling'|'grammar'|'punctuation'|'word_choice'|'clarity'|'style'|'tone'|'unnatural'
    severity          TEXT    NOT NULL DEFAULT 'warning', -- 'error'|'warning'|'suggestion'
    original_fragment TEXT    NOT NULL,   -- Исходный фрагмент с ошибкой
    suggested_fix     TEXT    NOT NULL,   -- Предложенная замена
    explanation       TEXT    NOT NULL,   -- Короткое объяснение
    rule_hint         TEXT,               -- Краткое правило (tooltip)
    offset_start      INTEGER NOT NULL,   -- Позиция начала в оригинальном тексте
    offset_end        INTEGER NOT NULL,   -- Позиция конца
    status            TEXT    NOT NULL DEFAULT 'pending', -- 'pending'|'accepted'|'rejected'
    created_at        DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_writing_issue_check
    ON writing_issue(writing_check_id);

CREATE INDEX IF NOT EXISTS idx_writing_issue_category
    ON writing_issue(category);

-- Агрегированные персональные паттерны ошибок пользователя
CREATE TABLE IF NOT EXISTS writing_error_pattern (
    id                INTEGER PRIMARY KEY,
    category          TEXT    NOT NULL,     -- Категория ошибки
    language          TEXT    NOT NULL DEFAULT 'en',
    occurrence_count  INTEGER NOT NULL DEFAULT 1,
    last_seen_at      DATETIME DEFAULT (unixepoch()),
    sample_original   TEXT,                 -- Пример ошибки
    sample_fix        TEXT,                 -- Пример исправления
    UNIQUE(category, language)
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
-- (создаются пустыми; контент — частотная лексика V002 + V013,
--  phrasal/irregular — V002; Business / Academic / Travel — V012)

INSERT OR IGNORE INTO collection (name, description, collection_type, language_id, sort_order)
VALUES
    ('Top 5000 Words', 'Most frequent English words', 'system', 1, 1),
    ('Phrasal Verbs',  'Common English phrasal verbs', 'system', 1, 2),
    ('Irregular Verbs', 'English irregular verbs', 'system', 1, 3),
    ('Business English', 'Business vocabulary', 'system', 1, 4),
    ('Academic English', 'University and exam vocabulary', 'system', 1, 5),
    ('Travel English', 'Travel and hospitality vocabulary', 'system', 1, 6);

-- ── Pronunciation Coach (V009) ────────────────────────────
-- Seed of 100+ English minimal pairs lives in V009__pronunciation.sql

CREATE TABLE IF NOT EXISTS pronunciation_attempt (
    id                INTEGER PRIMARY KEY,
    lexeme_id         INTEGER REFERENCES lexeme(id) ON DELETE SET NULL,
    audio_path        TEXT    NOT NULL,
    overall_score     INTEGER NOT NULL DEFAULT 0,
    recognized_text   TEXT,
    target_text       TEXT    NOT NULL,
    target_ipa        TEXT,
    recognized_ipa    TEXT,
    stress_feedback   TEXT,
    summary           TEXT,
    language          TEXT    NOT NULL DEFAULT 'en',
    created_at        DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_pronunciation_attempt_lexeme_date
    ON pronunciation_attempt(lexeme_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pronunciation_attempt_created
    ON pronunciation_attempt(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pronunciation_attempt_language
    ON pronunciation_attempt(language, created_at DESC);

CREATE TABLE IF NOT EXISTS phoneme_score (
    id                  INTEGER PRIMARY KEY,
    attempt_id          INTEGER NOT NULL REFERENCES pronunciation_attempt(id) ON DELETE CASCADE,
    target_phoneme      TEXT    NOT NULL,
    recognized_phoneme  TEXT,
    accuracy            INTEGER NOT NULL DEFAULT 0,
    status              TEXT    NOT NULL DEFAULT 'ok',
    position            INTEGER NOT NULL DEFAULT 0,
    created_at          DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_phoneme_score_attempt
    ON phoneme_score(attempt_id);

CREATE INDEX IF NOT EXISTS idx_phoneme_score_phoneme
    ON phoneme_score(target_phoneme);

CREATE TABLE IF NOT EXISTS phoneme_pattern (
    id                INTEGER PRIMARY KEY,
    phoneme           TEXT    NOT NULL,
    language          TEXT    NOT NULL DEFAULT 'en',
    occurrence_count  INTEGER NOT NULL DEFAULT 1,
    last_seen_at      DATETIME DEFAULT (unixepoch()),
    sample_target     TEXT,
    sample_recognized TEXT,
    UNIQUE(phoneme, language)
);

CREATE INDEX IF NOT EXISTS idx_phoneme_pattern_language_count
    ON phoneme_pattern(language, occurrence_count DESC);

CREATE TABLE IF NOT EXISTS minimal_pair (
    id                   INTEGER PRIMARY KEY,
    word_a               TEXT    NOT NULL,
    word_b               TEXT    NOT NULL,
    ipa_a                TEXT    NOT NULL,
    ipa_b                TEXT    NOT NULL,
    contrast_phoneme_a   TEXT    NOT NULL,
    contrast_phoneme_b   TEXT    NOT NULL,
    contrast_type        TEXT    NOT NULL,
    language             TEXT    NOT NULL DEFAULT 'en',
    created_at           DATETIME DEFAULT (unixepoch()),
    UNIQUE(language, word_a, word_b)
);

CREATE INDEX IF NOT EXISTS idx_minimal_pair_language_type
    ON minimal_pair(language, contrast_type);

CREATE INDEX IF NOT EXISTS idx_minimal_pair_contrast
    ON minimal_pair(language, contrast_phoneme_a, contrast_phoneme_b);


-- ── V025__grammar_watch.sql: system-wide writing check (opt-in) ──
CREATE TABLE IF NOT EXISTS grammar_watch_settings (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    enabled        INTEGER NOT NULL DEFAULT 0,
    excluded_apps  TEXT    NOT NULL DEFAULT '[]',   -- JSON: bundle ids, «prefix*»
    updated_at     DATETIME DEFAULT (unixepoch())
);

-- ── Sticker window positions (V026) ──────────────────────
-- Внешний прямоугольник окна `sticker-N` в физических пикселях.

CREATE TABLE IF NOT EXISTS sticker_window_position (
    slot       INTEGER PRIMARY KEY,
    x          INTEGER NOT NULL,
    y          INTEGER NOT NULL,
    width      INTEGER NOT NULL,
    height     INTEGER NOT NULL,
    updated_at DATETIME DEFAULT (unixepoch())
);
