-- init.sql: SQL script to create the events table for the Event Store

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id VARCHAR(64) NOT NULL, -- Muzzle Hash (SHA-256)
    aggregate_type VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB NOT NULL, -- Full Turing Protocol Context (User, Device, Geo)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS events_aggregate_id_version_idx ON events (aggregate_id, version);
CREATE INDEX IF NOT EXISTS events_aggregate_id_idx ON events (aggregate_id);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON events (event_type);
