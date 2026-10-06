-- ============================================================
-- LEXORA — V023: Per-role AI model routes + Gemini default package
-- Each AI role (text, vision, speech, live voice, interpreter, TTS,
-- illustrations) has an ordered chain: position 0 = primary,
-- 1.. = fallbacks. Legacy ai_provider/ai_model/fallback_*/
-- image_model/tts_engine columns stay as mirrors of the routes.
-- ============================================================

CREATE TABLE IF NOT EXISTS model_route (
    id          INTEGER PRIMARY KEY,
    role        TEXT    NOT NULL,           -- text_fast|text_quality|vision|speech_to_text|realtime_voice|live_interpreter|tts|image_gen
    position    INTEGER NOT NULL DEFAULT 0, -- 0 = primary, 1.. = fallbacks
    provider    TEXT    NOT NULL,
    model       TEXT    NOT NULL,
    enabled     INTEGER NOT NULL DEFAULT 1, -- 0/1
    updated_at  DATETIME DEFAULT (unixepoch()),
    UNIQUE(role, position)
);

CREATE INDEX IF NOT EXISTS idx_model_route_role
    ON model_route(role, position);

-- 'gemini' | 'openai' | 'local' | 'offline' | 'cloudflare' | 'custom' | NULL (legacy, seeded from settings)
ALTER TABLE user_settings ADD COLUMN model_package TEXT;

-- The V020 free OpenRouter defaults no longer have serving providers
-- (0 endpoints on 2026-10-03). Only users still on those untouched
-- defaults move to the Gemini package; customized settings stay as-is.
UPDATE user_settings
SET ai_provider          = 'gemini',
    ai_model             = 'gemini-3.8-flash',
    fallback_ai_provider = 'gemini',
    fallback_ai_model    = 'gemini-3.5-flash-lite',
    fallback_enabled     = 1,
    model_package        = 'gemini',
    updated_at           = unixepoch()
WHERE id = 1
  AND ai_provider = 'openrouter'
  AND ai_model = 'minimax/minimax-m3:free';
