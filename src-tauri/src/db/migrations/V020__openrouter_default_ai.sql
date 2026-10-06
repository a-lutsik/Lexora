-- ============================================================
-- LEXORA — V020: OpenRouter as default primary + fallback
-- Models match InvestorAssistent OpenRouter cheap/fast profile.
-- Same provider is allowed; failover uses a different model.
-- ============================================================

UPDATE user_settings
SET
    ai_provider = 'openrouter',
    ai_model = 'minimax/minimax-m3:free',
    fallback_ai_provider = 'openrouter',
    fallback_ai_model = 'minimax/minimax-m2.7:free',
    fallback_enabled = 1,
    updated_at = unixepoch()
WHERE id = 1;
