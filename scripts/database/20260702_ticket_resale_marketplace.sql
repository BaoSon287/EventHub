CREATE TABLE IF NOT EXISTS ticket_resale_listings (
    id UUID PRIMARY KEY,
    ticket_asset_id UUID NOT NULL,
    seller_id BIGINT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_resale_listings_active_ticket
    ON ticket_resale_listings (ticket_asset_id)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_ticket_resale_listings_seller_id
    ON ticket_resale_listings (seller_id);

CREATE INDEX IF NOT EXISTS idx_ticket_resale_listings_status
    ON ticket_resale_listings (status);

CREATE INDEX IF NOT EXISTS idx_ticket_resale_listings_ticket_asset_id
    ON ticket_resale_listings (ticket_asset_id);

CREATE TABLE IF NOT EXISTS ticket_transfer_history (
    id UUID PRIMARY KEY,
    ticket_asset_id UUID NOT NULL,
    from_user_id BIGINT,
    to_user_id BIGINT,
    action VARCHAR(30) NOT NULL,
    old_qr_code TEXT,
    new_qr_code TEXT,
    created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_transfer_history_ticket_asset_id
    ON ticket_transfer_history (ticket_asset_id);
