-- Outbox Pattern for Reliable Event Publishing

CREATE TABLE IF NOT EXISTS event_outbox (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    partition_key VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP NULL,
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    INDEX idx_outbox_status_created (status, created_at),
    INDEX idx_outbox_event_id (event_id),
    INDEX idx_outbox_aggregate_id (aggregate_id)
);

CREATE OR REPLACE FUNCTION mark_event_published(p_event_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE event_outbox
    SET status = 'published', published_at = NOW()
    WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_retry(p_event_id VARCHAR, p_error TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE event_outbox
    SET retry_count = retry_count + 1,
        last_error = p_error,
        status = CASE WHEN retry_count + 1 >= 10 THEN 'failed' ELSE 'pending' END
    WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;
