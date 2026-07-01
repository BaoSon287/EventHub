-- Add indexes for payment_transactions table
-- Improves query performance for: payment lookup, user payment history, payment status tracking

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id
    ON payment_transactions(booking_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
    ON payment_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created
    ON payment_transactions(status, created_at DESC);

-- Comment: These indexes support common query patterns:
-- - WHERE booking_id = ? (payment lookup for a booking)
-- - WHERE user_id = ? (user's payment history)
-- - WHERE status = ? ORDER BY created_at DESC (payment status tracking)