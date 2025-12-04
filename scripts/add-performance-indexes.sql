-- Performance Indexes for iCattle Scalability
-- Optimizes queries for 17,000+ cattle operations

-- CATTLE TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_cattle_client_id ON cattle(clientId) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_health_status ON cattle(healthStatus) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_breed ON cattle(breed) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_sex ON cattle(sex) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_client_health ON cattle(clientId, healthStatus) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_gps ON cattle(latitude, longitude) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_created_at ON cattle(createdAt DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cattle_search ON cattle USING GIN (to_tsvector('english', COALESCE(nlisId, '') || ' ' || COALESCE(visualId, '')));

-- CLIENTS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(clientType);
CREATE INDEX IF NOT EXISTS idx_clients_gps ON clients(latitude, longitude);

-- LIFECYCLE EVENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_lifecycle_cattle_id ON lifecycleEvents(cattleId, eventDate DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_event_type ON lifecycleEvents(eventType);

-- CATTLE EVENTS INDEXES (Turing Protocol V2)
CREATE INDEX IF NOT EXISTS idx_cattle_events_cattle_id ON cattle_events(cattle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cattle_events_type ON cattle_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cattle_events_ref ON cattle_events(event_ref);

ANALYZE cattle;
ANALYZE clients;
ANALYZE lifecycleEvents;
ANALYZE cattle_events;
