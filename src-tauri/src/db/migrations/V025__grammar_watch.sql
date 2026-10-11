-- ============================================================
-- LEXORA — V025: System-wide writing check («Grammarly mode»)
-- Lexora watches the focused text field in other apps and offers
-- fixes next to it. Opt-in: default OFF — typed text goes to the
-- AI provider. excluded_apps — JSON list of macOS bundle ids
-- (an entry ending in «*» matches a prefix). Password fields are
-- never read regardless of this list.
-- ============================================================

CREATE TABLE IF NOT EXISTS grammar_watch_settings (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    enabled        INTEGER NOT NULL DEFAULT 0,
    excluded_apps  TEXT    NOT NULL DEFAULT '[]',
    updated_at     DATETIME DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO grammar_watch_settings (id, enabled, excluded_apps)
VALUES (
    1,
    0,
    '["com.1password.1password","com.agilebits.onepassword7","com.bitwarden.desktop","com.apple.keychainaccess","com.apple.Passwords","com.apple.Terminal","com.googlecode.iterm2","dev.warp.Warp-Stable","net.kovidgoyal.kitty","com.mitchellh.ghostty","org.alacritty","com.microsoft.VSCode","com.apple.dt.Xcode","com.todesktop.230313mzl4w4u92","dev.zed.Zed","com.jetbrains.*"]'
);
