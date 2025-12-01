-- Database Schema for iCattle.ai Australian Deployment
-- MSA Grading System with Turing Protocol

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MSA Grading Events Table
CREATE TABLE IF NOT EXISTS msa_grading_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Turing Protocol fields
    tenant_id VARCHAR(100) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    geo_location VARCHAR(100) NOT NULL,
    
    -- Animal identification
    animal_id VARCHAR(16) NOT NULL,
    
    -- MSA grading data
    msa_grade VARCHAR(20) NOT NULL,
    marbling_score INTEGER,
    fat_score INTEGER,
    eye_muscle_area_sq_cm DECIMAL(10,2),
    rib_fat_mm DECIMAL(10,2),
    weight_kg DECIMAL(10,2) NOT NULL,
    
    -- Metadata
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes for Turing Protocol
    CONSTRAINT msa_grading_events_tenant_id_idx CHECK (tenant_id ~ '^(AU-|QPIC-)'),
    CONSTRAINT msa_grading_events_animal_id_check CHECK (LENGTH(animal_id) = 16)
);

CREATE INDEX idx_msa_grading_tenant ON msa_grading_events(tenant_id);
CREATE INDEX idx_msa_grading_request ON msa_grading_events(request_id);
CREATE INDEX idx_msa_grading_animal ON msa_grading_events(animal_id);
CREATE INDEX idx_msa_grading_timestamp ON msa_grading_events(timestamp);

-- Market Valuation Events Table
CREATE TABLE IF NOT EXISTS market_valuation_events_au (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Turing Protocol fields
    tenant_id VARCHAR(100) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    geo_location VARCHAR(100) NOT NULL,
    
    -- Animal data
    animal_id VARCHAR(16) NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    msa_grade VARCHAR(20) NOT NULL,
    region VARCHAR(50) NOT NULL,
    
    -- Valuation
    price_per_kg_aud DECIMAL(10,2) NOT NULL,
    total_value_aud DECIMAL(10,2) NOT NULL,
    price_source VARCHAR(100) NOT NULL,
    
    -- Metadata
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_valuation_tenant ON market_valuation_events_au(tenant_id);
CREATE INDEX idx_valuation_animal ON market_valuation_events_au(animal_id);
CREATE INDEX idx_valuation_timestamp ON market_valuation_events_au(timestamp);

-- Audit Log Table (Turing Protocol)
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Turing Protocol fields
    tenant_id VARCHAR(100) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    geo_location VARCHAR(100) NOT NULL,
    
    -- Request details
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    request_body TEXT,
    response_body TEXT,
    
    -- Metadata
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_request ON audit_log(request_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- Animal Profiles Table
CREATE TABLE IF NOT EXISTS animal_profiles_au (
    animal_id VARCHAR(16) PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    
    -- Basic info
    breed VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),
    
    -- NLIS data
    nlis_tag VARCHAR(16),
    pic_code VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_animal_tenant ON animal_profiles_au(tenant_id);
CREATE INDEX idx_animal_nlis ON animal_profiles_au(nlis_tag);
