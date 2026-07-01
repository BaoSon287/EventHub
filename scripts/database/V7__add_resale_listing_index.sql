-- Add composite index for ticket_resale_listings to optimize marketplace queries
-- Query pattern: WHERE status = 'ACTIVE' ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_ticket_resale_listings_status_created
    ON ticket_resale_listings(status, created_at DESC);

-- Comment: Optimizes marketplace listing queries