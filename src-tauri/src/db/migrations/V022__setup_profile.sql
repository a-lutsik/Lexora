-- ============================================================
-- LEXORA — V022: Guided setup profile + TTS engine selection
-- setup_profile: NULL (пользователь ещё не выбирал сценарий) |
--                'zero' | 'free-cloudflare' | 'paid-openai' |
--                'paid-gemini' | 'advanced'
-- tts_engine:    'system' (macOS say, по умолчанию) |
--                'openai' (нейро-голоса через OpenAI TTS)
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN setup_profile TEXT;

ALTER TABLE user_settings
    ADD COLUMN tts_engine TEXT NOT NULL DEFAULT 'system';
