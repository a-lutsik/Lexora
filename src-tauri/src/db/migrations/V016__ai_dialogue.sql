-- ============================================================
-- V016: AI Dialogue — scenarios, sessions, turns
-- Interactive voice/text role-play with an AI tutor.
-- ============================================================

CREATE TABLE IF NOT EXISTS dialogue_scenario (
    id                  INTEGER PRIMARY KEY,
    slug                TEXT    NOT NULL UNIQUE,
    title               TEXT    NOT NULL,
    level               TEXT    NOT NULL,              -- A1|A2|B1|B2|C1|C2
    language            TEXT    NOT NULL DEFAULT 'en',
    description         TEXT,
    tutor_role          TEXT    NOT NULL,
    opening_line        TEXT    NOT NULL,
    suggested_vocab_json TEXT   NOT NULL DEFAULT '[]', -- JSON string array
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_dialogue_scenario_language
    ON dialogue_scenario(language, sort_order);

CREATE TABLE IF NOT EXISTS dialogue_session (
    id                  INTEGER PRIMARY KEY,
    scenario_id         INTEGER NOT NULL REFERENCES dialogue_scenario(id),
    language            TEXT    NOT NULL DEFAULT 'en',
    session_score       INTEGER,                        -- 0–100 avg fluency/clarity
    turn_count          INTEGER NOT NULL DEFAULT 0,     -- user turns only
    status              TEXT    NOT NULL DEFAULT 'active', -- active|ended
    created_at          DATETIME DEFAULT (unixepoch()),
    updated_at          DATETIME DEFAULT (unixepoch()),
    ended_at            DATETIME,
    deleted_at          DATETIME
);

CREATE INDEX IF NOT EXISTS idx_dialogue_session_scenario
    ON dialogue_session(scenario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dialogue_session_status
    ON dialogue_session(status, deleted_at);

CREATE TABLE IF NOT EXISTS dialogue_turn (
    id                  INTEGER PRIMARY KEY,
    session_id          INTEGER NOT NULL REFERENCES dialogue_session(id) ON DELETE CASCADE,
    role                TEXT    NOT NULL,              -- tutor|user
    text                TEXT    NOT NULL,
    audio_path          TEXT,
    turn_score          INTEGER,                        -- 0–100 pronunciation+grammar
    fluency_score       INTEGER,
    clarity_score       INTEGER,
    grammar_score       INTEGER,
    suggestions_json    TEXT,                           -- JSON string array
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          DATETIME DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_dialogue_turn_session
    ON dialogue_turn(session_id, sort_order);

-- ── Seed scenarios ───────────────────────────────────────

INSERT OR IGNORE INTO dialogue_scenario (
    slug, title, level, language, description, tutor_role, opening_line, suggested_vocab_json, sort_order
) VALUES
(
    'coffee-shop-london-b2',
    'Coffee Shop in London (B2 Level)',
    'B2',
    'en',
    'Order a drink and chat with a barista in a busy London café.',
    'You are a friendly London barista. Keep the conversation natural at B2 level. Ask about roast preference, milk options, and small talk about the weather.',
    'What kind of roast would you like with your flat white today?',
    '["medium roast","dark roast","Arabica","single origin"]',
    1
),
(
    'airport-checkin-b1',
    'Airport Check-in (B1 Level)',
    'B1',
    'en',
    'Check in for a flight and answer routine airline questions.',
    'You are an airport check-in agent. Speak clearly at B1 level. Ask for passport, destination, and baggage.',
    'Good morning! May I see your passport and booking confirmation, please?',
    '["boarding pass","window seat","checked bag","hand luggage"]',
    2
),
(
    'hotel-reception-a2',
    'Hotel Reception (A2 Level)',
    'A2',
    'en',
    'Check into a hotel and ask simple questions about your room.',
    'You are a hotel receptionist. Use short, clear A2 sentences. Help with check-in, Wi-Fi, and breakfast.',
    'Welcome! Do you have a reservation with us tonight?',
    '["reservation","double room","Wi-Fi password","breakfast included"]',
    3
),
(
    'job-interview-c1',
    'Job Interview (C1 Level)',
    'C1',
    'en',
    'Practice answering behavioral interview questions in English.',
    'You are a hiring manager conducting a professional interview at C1 level. Ask follow-ups about experience, teamwork, and goals.',
    'Thanks for joining us today. Could you walk me through a recent project you led?',
    '["stakeholder","deliverable","cross-functional","ownership"]',
    4
),
(
    'small-talk-b2',
    'Weekend Small Talk (B2 Level)',
    'B2',
    'en',
    'Casual conversation with a colleague about the weekend.',
    'You are a friendly colleague making weekend small talk at B2 level. Keep it light and reciprocal.',
    'So, did you get up to anything fun this weekend?',
    '["caught up","day trip","netflix binge","brunch"]',
    5
);
