-- iCattle Golden Record Database
-- Event Sourcing Schema for Turing Protocol
-- This database stores the complete, immutable event history for all cattle

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EVENT STORE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cattle_events (
    -- Event identification
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    event_ref VARCHAR(255) NOT NULL UNIQUE,
    
    -- Cattle reference
    cattle_id INTEGER NOT NULL,
    
    -- Timestamps
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Idempotency and tracing
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    correlation_id VARCHAR(255),
    causation_id VARCHAR(255),
    
    -- Source and versioning
    source_system VARCHAR(50) NOT NULL DEFAULT 'iCattle',
    schema_version INTEGER NOT NULL DEFAULT 1,
    created_by VARCHAR(255),
    
    -- Event data
    payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    
    -- Metadata
    metadata JSONB,
    
    -- Indexes for fast querying
    CONSTRAINT cattle_events_check_hash CHECK (length(payload_hash) = 64)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cattle_events_cattle_id ON cattle_events(cattle_id);
CREATE INDEX IF NOT EXISTS idx_cattle_events_event_type ON cattle_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cattle_events_occurred_at ON cattle_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_cattle_events_source_system ON cattle_events(source_system);
CREATE INDEX IF NOT EXISTS idx_cattle_events_correlation_id ON cattle_events(correlation_id) WHERE correlation_id IS NOT NULL;

-- GIN index for JSONB payload queries
CREATE INDEX IF NOT EXISTS idx_cattle_events_payload ON cattle_events USING GIN (payload);

-- ============================================================================
-- GOLDEN RECORD VIEW (Materialized)
-- ============================================================================

-- This view reconstructs the current state of each cattle from the event stream
CREATE MATERIALIZED VIEW IF NOT EXISTS cattle_golden_record AS
SELECT 
    cattle_id,
    MAX(occurred_at) as last_updated,
    COUNT(*) as total_events,
    jsonb_agg(
        jsonb_build_object(
            'event_id', event_id,
            'event_type', event_type,
            'occurred_at', occurred_at,
            'payload', payload
        ) ORDER BY occurred_at DESC
    ) as event_history,
    -- Latest values (simplified - in production use proper event sourcing projection)
    (SELECT payload FROM cattle_events ce WHERE ce.cattle_id = cattle_events.cattle_id ORDER BY occurred_at DESC LIMIT 1) as latest_state
FROM cattle_events
GROUP BY cattle_id;

-- Index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_golden_record_cattle_id ON cattle_golden_record(cattle_id);

-- ============================================================================
-- AUDIT TRAIL TABLE
-- ============================================================================

-- Stores cryptographic proofs for audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    event_id UUID NOT NULL REFERENCES cattle_events(event_id),
    
    -- Blockchain/cryptographic verification
    block_hash VARCHAR(64),
    merkle_root VARCHAR(64),
    previous_block_hash VARCHAR(64),
    
    -- Verification status
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT audit_trail_unique_event UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_cattle_id ON audit_trail(cattle_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_verified ON audit_trail(verified);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to refresh the Golden Record materialized view
CREATE OR REPLACE FUNCTION refresh_golden_record()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY cattle_golden_record;
END;
$$ LANGUAGE plpgsql;

-- Function to get complete audit trail for a cattle
CREATE OR REPLACE FUNCTION get_cattle_audit_trail(p_cattle_id INTEGER)
RETURNS TABLE (
    event_id UUID,
    event_type VARCHAR,
    event_ref VARCHAR,
    occurred_at TIMESTAMP WITH TIME ZONE,
    payload JSONB,
    verified BOOLEAN,
    block_hash VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.event_id,
        ce.event_type,
        ce.event_ref,
        ce.occurred_at,
        ce.payload,
        COALESCE(at.verified, FALSE) as verified,
        at.block_hash
    FROM cattle_events ce
    LEFT JOIN audit_trail at ON ce.event_id = at.event_id
    WHERE ce.cattle_id = p_cattle_id
    ORDER BY ce.occurred_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert a system event to mark database initialization
INSERT INTO cattle_events (
    event_type,
    event_ref,
    cattle_id,
    occurred_at,
    idempotency_key,
    source_system,
    payload,
    payload_hash
) VALUES (
    'SYSTEM_INITIALIZED',
    'system-init-' || NOW()::TEXT,
    0,
    NOW(),
    'system-init-' || uuid_generate_v4()::TEXT,
    'iCattle',
    '{"message": "Golden Record database initialized", "version": "1.0.0"}'::JSONB,
    encode(sha256('system-init'::BYTEA), 'hex')
) ON CONFLICT (event_ref) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO icattle;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO icattle;
