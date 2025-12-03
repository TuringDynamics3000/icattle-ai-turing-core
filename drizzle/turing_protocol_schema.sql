-- =====================================================
-- TURING PROTOCOL FOR iCATTLE - GOLDEN RECORD SCHEMA
-- =====================================================
-- Version: 1.0
-- Purpose: Event-sourced cattle data with cryptographic integrity
-- Based on: TuringCore-v3 Turing Protocol V2 specification
-- =====================================================

-- =====================================================
-- 1. CATTLE EVENTS (Canonical Event Stream)
-- =====================================================
-- This is the Protocol backbone for cattle data
-- All cattle state transitions MUST be derivable from this stream

CREATE TABLE IF NOT EXISTS cattle_events (
  -- Event Identity
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_id BIGSERIAL UNIQUE NOT NULL,
  
  -- Temporal
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Event Classification
  event_type TEXT NOT NULL, -- CATTLE_CREATED, OWNERSHIP_TRANSFER, TAG_CHANGED, etc.
  event_ref TEXT NOT NULL,  -- Business reference (e.g., "sale-123", "tag-swap-456")
  
  -- Cattle Reference
  cattle_id INTEGER NOT NULL REFERENCES cattle(id),
  
  -- Idempotency & Correlation
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT,      -- Links related events
  causation_id TEXT,         -- What caused this event
  
  -- Integrity Protection
  payload_hash TEXT NOT NULL,  -- SHA-256 hash of payload_json
  previous_hash TEXT,          -- Hash of previous event (blockchain-style)
  
  -- Complete Event Snapshot
  payload_json JSONB NOT NULL,
  
  -- Metadata
  source_system TEXT NOT NULL DEFAULT 'iCattle',  -- iCattle, NLIS, GPS, etc.
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  
  -- Indexes
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'CATTLE_CREATED',
    'OWNERSHIP_TRANSFER', 
    'TAG_CHANGED',
    'VALUATION_UPDATE',
    'LOCATION_MOVED',
    'HEALTH_RECORD',
    'WEIGHT_RECORDED',
    'BREEDING_EVENT',
    'SALE_INITIATED',
    'SALE_COMPLETED',
    'DEATH_RECORDED',
    'THEFT_REPORTED',
    'FRAUD_DETECTED'
  ))
);

CREATE INDEX idx_cattle_events_cattle_id ON cattle_events(cattle_id);
CREATE INDEX idx_cattle_events_occurred_at ON cattle_events(occurred_at);
CREATE INDEX idx_cattle_events_event_type ON cattle_events(event_type);
CREATE INDEX idx_cattle_events_seq_id ON cattle_events(seq_id);

COMMENT ON TABLE cattle_events IS 'Turing Protocol: Canonical event stream for all cattle state transitions';
COMMENT ON COLUMN cattle_events.payload_hash IS 'SHA-256 hash of payload_json for tamper detection';
COMMENT ON COLUMN cattle_events.previous_hash IS 'Hash of previous event creating blockchain-style chain';

-- =====================================================
-- 2. PROVENANCE SCORES (Confidence & Trust)
-- =====================================================
-- Multi-source validation and confidence scoring

CREATE TABLE IF NOT EXISTS provenance_scores (
  id SERIAL PRIMARY KEY,
  cattle_id INTEGER NOT NULL REFERENCES cattle(id),
  
  -- Overall Confidence Score (0-100)
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Validation Sources
  nlis_verified BOOLEAN DEFAULT FALSE,
  photo_verified BOOLEAN DEFAULT FALSE,
  gps_verified BOOLEAN DEFAULT FALSE,
  biometric_verified BOOLEAN DEFAULT FALSE,
  dna_verified BOOLEAN DEFAULT FALSE,
  
  -- Verification Timestamps
  nlis_verified_at TIMESTAMPTZ,
  photo_verified_at TIMESTAMPTZ,
  gps_verified_at TIMESTAMPTZ,
  biometric_verified_at TIMESTAMPTZ,
  dna_verified_at TIMESTAMPTZ,
  
  -- Risk Factors
  tag_changes_count INTEGER DEFAULT 0,
  ownership_changes_count INTEGER DEFAULT 0,
  location_changes_count INTEGER DEFAULT 0,
  suspicious_transactions_count INTEGER DEFAULT 0,
  
  -- Audit
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  
  -- Unique constraint
  UNIQUE(cattle_id)
);

CREATE INDEX idx_provenance_scores_confidence ON provenance_scores(confidence_score);
CREATE INDEX idx_provenance_scores_risk_level ON provenance_scores(risk_level);

COMMENT ON TABLE provenance_scores IS 'Turing Protocol: Multi-source provenance validation and confidence scoring';
COMMENT ON COLUMN provenance_scores.confidence_score IS 'Overall trust score 0-100 based on verification sources';

-- =====================================================
-- 3. SUSPICIOUS TRANSACTIONS (Fraud Detection)
-- =====================================================
-- Automated fraud detection and manual flagging

CREATE TABLE IF NOT EXISTS suspicious_transactions (
  id SERIAL PRIMARY KEY,
  
  -- Transaction Reference
  cattle_id INTEGER NOT NULL REFERENCES cattle(id),
  event_id UUID REFERENCES cattle_events(event_id),
  
  -- Suspicion Details
  suspicion_type TEXT NOT NULL CHECK (suspicion_type IN (
    'TAG_SWAP',
    'RAPID_MOVEMENT',
    'PRICE_ANOMALY',
    'MISSING_DOCUMENTATION',
    'DUPLICATE_TAG',
    'CROSS_STATE_NO_PAPERWORK',
    'BELOW_MARKET_PRICE',
    'ABOVE_MARKET_PRICE',
    'GENETIC_MISMATCH',
    'PHOTO_MISMATCH',
    'GPS_ANOMALY',
    'MANUAL_FLAG'
  )),
  
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Detection
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by TEXT NOT NULL,  -- 'SYSTEM' or user ID
  detection_method TEXT,       -- Rule name or algorithm
  
  -- Details
  description TEXT NOT NULL,
  evidence_json JSONB,
  
  -- Investigation
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
  investigated_by TEXT,
  investigated_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suspicious_transactions_cattle_id ON suspicious_transactions(cattle_id);
CREATE INDEX idx_suspicious_transactions_status ON suspicious_transactions(status);
CREATE INDEX idx_suspicious_transactions_severity ON suspicious_transactions(severity);
CREATE INDEX idx_suspicious_transactions_detected_at ON suspicious_transactions(detected_at);

COMMENT ON TABLE suspicious_transactions IS 'Turing Protocol: Fraud detection and suspicious activity tracking';

-- =====================================================
-- 4. VERIFICATION DOCUMENTS (Evidence Storage)
-- =====================================================
-- Store verification evidence (photos, DNA results, GPS logs, etc.)

CREATE TABLE IF NOT EXISTS verification_documents (
  id SERIAL PRIMARY KEY,
  
  -- Reference
  cattle_id INTEGER NOT NULL REFERENCES cattle(id),
  event_id UUID REFERENCES cattle_events(event_id),
  
  -- Document Type
  document_type TEXT NOT NULL CHECK (document_type IN (
    'PHOTO',
    'DNA_RESULT',
    'GPS_LOG',
    'BIOMETRIC_SCAN',
    'NLIS_CERTIFICATE',
    'HEALTH_CERTIFICATE',
    'TRANSPORT_DOCUMENT',
    'SALE_RECEIPT',
    'OWNERSHIP_TRANSFER',
    'OTHER'
  )),
  
  -- Storage
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Metadata
  description TEXT,
  metadata_json JSONB,
  
  -- Hash for Integrity
  file_hash TEXT NOT NULL,  -- SHA-256 of file content
  
  -- Audit
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by TEXT
);

CREATE INDEX idx_verification_documents_cattle_id ON verification_documents(cattle_id);
CREATE INDEX idx_verification_documents_document_type ON verification_documents(document_type);

COMMENT ON TABLE verification_documents IS 'Turing Protocol: Evidence storage for multi-source verification';
COMMENT ON COLUMN verification_documents.file_hash IS 'SHA-256 hash of file content for tamper detection';

-- =====================================================
-- 5. PROTOCOL COMPLIANCE LOG
-- =====================================================
-- Track Turing Protocol compliance checks and violations

CREATE TABLE IF NOT EXISTS protocol_compliance_log (
  id SERIAL PRIMARY KEY,
  
  -- Check Details
  check_type TEXT NOT NULL CHECK (check_type IN (
    'HASH_INTEGRITY',
    'EVENT_SEQUENCE',
    'PROVENANCE_VALIDATION',
    'FRAUD_DETECTION',
    'REPLAY_CONSISTENCY'
  )),
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WARNING')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Details
  description TEXT,
  violations_count INTEGER DEFAULT 0,
  violations_json JSONB,
  
  -- Performance
  duration_ms INTEGER,
  records_checked INTEGER,
  
  -- Audit
  checked_by TEXT NOT NULL DEFAULT 'SYSTEM'
);

CREATE INDEX idx_protocol_compliance_log_checked_at ON protocol_compliance_log(checked_at);
CREATE INDEX idx_protocol_compliance_log_status ON protocol_compliance_log(status);

COMMENT ON TABLE protocol_compliance_log IS 'Turing Protocol: Compliance monitoring and violation tracking';

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate payload hash
CREATE OR REPLACE FUNCTION calculate_payload_hash(payload JSONB)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(payload::TEXT, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get latest event for cattle
CREATE OR REPLACE FUNCTION get_latest_cattle_event(p_cattle_id INTEGER)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  occurred_at TIMESTAMPTZ,
  payload_json JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT ce.event_id, ce.event_type, ce.occurred_at, ce.payload_json
  FROM cattle_events ce
  WHERE ce.cattle_id = p_cattle_id
  ORDER BY ce.seq_id DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate confidence score
CREATE OR REPLACE FUNCTION calculate_confidence_score(
  p_nlis_verified BOOLEAN,
  p_photo_verified BOOLEAN,
  p_gps_verified BOOLEAN,
  p_biometric_verified BOOLEAN,
  p_dna_verified BOOLEAN,
  p_tag_changes_count INTEGER,
  p_suspicious_count INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base score from verifications (20 points each)
  IF p_nlis_verified THEN score := score + 20; END IF;
  IF p_photo_verified THEN score := score + 20; END IF;
  IF p_gps_verified THEN score := score + 20; END IF;
  IF p_biometric_verified THEN score := score + 20; END IF;
  IF p_dna_verified THEN score := score + 20; END IF;
  
  -- Deduct for risk factors
  score := score - (p_tag_changes_count * 5);  -- -5 per tag change
  score := score - (p_suspicious_count * 10);  -- -10 per suspicious transaction
  
  -- Clamp to 0-100
  IF score < 0 THEN score := 0; END IF;
  IF score > 100 THEN score := 100; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to auto-update provenance scores when events occur
CREATE OR REPLACE FUNCTION update_provenance_score_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tag changes count for TAG_CHANGED events
  IF NEW.event_type = 'TAG_CHANGED' THEN
    UPDATE provenance_scores
    SET tag_changes_count = tag_changes_count + 1,
        last_updated = NOW()
    WHERE cattle_id = NEW.cattle_id;
  END IF;
  
  -- Update ownership changes count for OWNERSHIP_TRANSFER events
  IF NEW.event_type = 'OWNERSHIP_TRANSFER' THEN
    UPDATE provenance_scores
    SET ownership_changes_count = ownership_changes_count + 1,
        last_updated = NOW()
    WHERE cattle_id = NEW.cattle_id;
  END IF;
  
  -- Update location changes count for LOCATION_MOVED events
  IF NEW.event_type = 'LOCATION_MOVED' THEN
    UPDATE provenance_scores
    SET location_changes_count = location_changes_count + 1,
        last_updated = NOW()
    WHERE cattle_id = NEW.cattle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provenance_on_event
AFTER INSERT ON cattle_events
FOR EACH ROW
EXECUTE FUNCTION update_provenance_score_on_event();

COMMENT ON TRIGGER trigger_update_provenance_on_event ON cattle_events IS 'Auto-update provenance scores when events occur';

-- =====================================================
-- END OF TURING PROTOCOL SCHEMA
-- =====================================================
