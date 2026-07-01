CREATE TABLE IF NOT EXISTS ticket_assets (
    id UUID PRIMARY KEY,
    ticket_id BIGINT NOT NULL UNIQUE,
    event_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    original_buyer_id BIGINT NOT NULL,
    ticket_code VARCHAR(40) UNIQUE,
    qr_code TEXT,
    status VARCHAR(30) NOT NULL,
    purchase_price DECIMAL(12, 2) NOT NULL,
    event_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_assets_owner_id
    ON ticket_assets (owner_id);

CREATE INDEX IF NOT EXISTS idx_ticket_assets_event_id
    ON ticket_assets (event_id);

CREATE INDEX IF NOT EXISTS idx_ticket_assets_status
    ON ticket_assets (status);
