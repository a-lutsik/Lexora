-- ============================================================
-- LEXORA — V027: review_event by time
-- Stats (study streak, daily activity) filter and group review
-- events by `timestamp`; the existing index starts with
-- review_state_id and cannot serve a time-range scan.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_review_event_timestamp
    ON review_event(timestamp, review_state_id);
