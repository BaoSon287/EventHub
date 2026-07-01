-- Add missing indexes for bookings table
-- Improves query performance for: my bookings, event bookings, status filters

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Comment: These indexes support common query patterns:
-- - WHERE user_id = ? (my bookings)
-- - WHERE event_id = ? (event bookings)
-- - WHERE status = ? ORDER BY created_at DESC (booking history)
-- - WHERE payment_status = ? (payment tracking)