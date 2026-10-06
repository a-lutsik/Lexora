-- ============================================================
-- LEXORA — V019: Configurable image generation model + fallback
-- Independent from translation AI provider/model.
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN image_model TEXT NOT NULL DEFAULT 'cloudflare:@cf/black-forest-labs/flux-1-schnell';

ALTER TABLE user_settings
    ADD COLUMN fallback_image_model TEXT NOT NULL DEFAULT 'gemini:gemini-3.1-flash-image';
