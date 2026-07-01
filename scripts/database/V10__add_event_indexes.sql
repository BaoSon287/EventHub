-- Add indexes for events table (event_db)
-- Improves query performance for: event list, category search, date-based queries

CREATE INDEX IF NOT EXISTS idx_events_status_start_time
    ON events(status, start_time);

CREATE INDEX IF NOT EXISTS idx_events_category_status
    ON events(category, status);

-- Comment: These indexes support common query patterns:
-- - WHERE status = 'PUBLISHED' ORDER BY start_time ASC (event list)
-- - WHERE category = ? AND status = 'PUBLISHED' (category search)