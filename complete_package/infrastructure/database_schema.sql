-- ============================================================================
-- iCattle.ai Livestock Management Database Schema
-- Event Sourcing Architecture with Turing Protocol
-- Developed by: TuringDynamics
-- ============================================================================

-- Animal Grading Events
CREATE TABLE IF NOT EXISTS animal_grading_events (
    event_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) NOT NULL,
    quality_grade VARCHAR(50) NOT NULL,
    yield_grade VARCHAR(10) NOT NULL,
    marbling_score INTEGER NOT NULL,
    ribeye_area_sq_in DECIMAL(10,2) NOT NULL,
    fat_thickness_in DECIMAL(10,2) NOT NULL,
    hot_carcass_weight_lbs DECIMAL(10,2),
    grader_notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    geo_location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grading_aggregate ON animal_grading_events(aggregate_id);
CREATE INDEX idx_grading_tenant ON animal_grading_events(tenant_id);

-- Physical Measurement Events
CREATE TABLE IF NOT EXISTS physical_measurement_events (
    event_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) NOT NULL,
    weight_lbs DECIMAL(10,2) NOT NULL,
    body_condition_score VARCHAR(10) NOT NULL,
    frame_score INTEGER NOT NULL,
    hip_height_in DECIMAL(10,2),
    body_length_in DECIMAL(10,2),
    measurement_notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    geo_location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurement_aggregate ON physical_measurement_events(aggregate_id);
CREATE INDEX idx_measurement_tenant ON physical_measurement_events(tenant_id);

-- Animal Location Events
CREATE TABLE IF NOT EXISTS animal_location_events (
    event_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    altitude_m DECIMAL(10,2),
    accuracy_m DECIMAL(10,2),
    property_id VARCHAR(255),
    pasture_id VARCHAR(255),
    movement_notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    geo_location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_aggregate ON animal_location_events(aggregate_id);
CREATE INDEX idx_location_tenant ON animal_location_events(tenant_id);

-- Market Valuation Events
CREATE TABLE IF NOT EXISTS market_valuation_events (
    event_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) NOT NULL,
    market_class VARCHAR(50) NOT NULL,
    live_weight_lbs DECIMAL(10,2) NOT NULL,
    quality_grade VARCHAR(50),
    market_price_per_cwt DECIMAL(10,2) NOT NULL,
    estimated_value_usd DECIMAL(12,2) NOT NULL,
    price_source VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    request_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    geo_location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_valuation_aggregate ON market_valuation_events(aggregate_id);
CREATE INDEX idx_valuation_tenant ON market_valuation_events(tenant_id);

-- Animal Profile Projection
CREATE TABLE IF NOT EXISTS animal_profiles (
    muzzle_hash VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    quality_grade VARCHAR(50),
    yield_grade VARCHAR(10),
    marbling_score INTEGER,
    weight_lbs DECIMAL(10,2),
    body_condition_score VARCHAR(10),
    frame_score INTEGER,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    property_id VARCHAR(255),
    pasture_id VARCHAR(255),
    estimated_value_usd DECIMAL(12,2),
    market_price_per_cwt DECIMAL(10,2),
    last_valued TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profile_tenant ON animal_profiles(tenant_id);
