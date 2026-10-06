-- ============================================================
-- V007: Writing Assistant tables
-- Stage 2: AI Writing Coach — проверка текста, правки, паттерны ошибок
-- ============================================================

-- ── Writing Check Session ────────────────────────────────
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

-- ── Writing Issue ────────────────────────────────────────
-- Каждая найденная проблема в тексте

CREATE TABLE IF NOT EXISTS writing_issue (
    id                INTEGER PRIMARY KEY,
    writing_check_id  INTEGER NOT NULL REFERENCES writing_check(id) ON DELETE CASCADE,
    category          TEXT    NOT NULL,   -- 'spelling'|'grammar'|'punctuation'|'word_choice'|'clarity'|'style'|'tone'|'unnatural'
    severity          TEXT    NOT NULL DEFAULT 'warning', -- 'error'|'warning'|'suggestion'
    original_fragment TEXT    NOT NULL,   -- Исходный фрагмент с ошибкой
    suggested_fix     TEXT    NOT NULL,   -- Предложенная замена
    explanation       TEXT    NOT NULL,   -- Короткое объяснение
    rule_hint         TEXT,              -- Краткое правило (tooltip)
    offset_start      INTEGER NOT NULL,  -- Позиция начала в оригинальном тексте
    offset_end        INTEGER NOT NULL,  -- Позиция конца
    status            TEXT    NOT NULL DEFAULT 'pending', -- 'pending'|'accepted'|'rejected'
    created_at        DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_writing_issue_check
    ON writing_issue(writing_check_id);

CREATE INDEX IF NOT EXISTS idx_writing_issue_category
    ON writing_issue(category);

-- ── Writing Error Pattern ────────────────────────────────
-- Агрегированные персональные паттерны ошибок пользователя

CREATE TABLE IF NOT EXISTS writing_error_pattern (
    id                INTEGER PRIMARY KEY,
    category          TEXT    NOT NULL,     -- Категория ошибки
    language          TEXT    NOT NULL DEFAULT 'en',
    occurrence_count  INTEGER NOT NULL DEFAULT 1,
    last_seen_at      DATETIME DEFAULT (unixepoch()),
    sample_original   TEXT,                -- Пример ошибки
    sample_fix        TEXT,                -- Пример исправления
    UNIQUE(category, language)
);
