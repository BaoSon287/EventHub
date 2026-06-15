ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(40),
    ADD COLUMN IF NOT EXISTS event_image_url VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS event_start_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS event_location VARCHAR(150),
    ADD COLUMN IF NOT EXISTS event_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS event_city VARCHAR(100);

UPDATE bookings
   SET ticket_code = 'EH-TK-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT || id::TEXT), 1, 6))
 WHERE ticket_code IS NULL;

ALTER TABLE bookings
    ALTER COLUMN ticket_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_ticket_code
    ON bookings (ticket_code);
