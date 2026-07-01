-- Add index for ticket_transfer_history to optimize transfer history queries
-- Query pattern: WHERE ticket_asset_id = ? ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_ticket_transfer_history_ticket_asset_id
    ON ticket_transfer_history(ticket_asset_id, created_at DESC);

-- Comment: Optimizes transfer history lookups for a ticket asset