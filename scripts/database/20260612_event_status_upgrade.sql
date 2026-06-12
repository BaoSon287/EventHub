-- EventHub manual upgrade for event-service status normalization.
-- Run against the event_db database before enabling stricter application rules:
--   psql "$EVENT_DB_URL" -f scripts/database/20260612_event_status_upgrade.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(32);

UPDATE events
SET status = CASE
    WHEN end_time IS NOT NULL AND end_time <= CURRENT_TIMESTAMP THEN 'COMPLETED'
    ELSE 'PUBLISHED'
END
WHERE status IS NULL
   OR status NOT IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

ALTER TABLE events ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE events ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_status_start_time ON events (status, start_time);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_end_time ON events (end_time);
