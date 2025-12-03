/**
 * TURING PROTOCOL - FUNCTIONAL CORE
 * 
 * Pure functions for event sourcing, validation, and business logic.
 * NO SIDE EFFECTS - all I/O happens in the imperative shell.
 * 
 * Architecture: Functional Core, Imperative Shell
 * Based on: TuringCore-v3 Turing Protocol V2
 */

import crypto from 'crypto';

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type EventType =
  | 'CATTLE_CREATED'
  | 'OWNERSHIP_TRANSFER'
  | 'TAG_CHANGED'
  | 'VALUATION_UPDATE'
  | 'LOCATION_MOVED'
  | 'HEALTH_RECORD'
  | 'WEIGHT_RECORDED'
  | 'BREEDING_EVENT'
  | 'SALE_INITIATED'
  | 'SALE_COMPLETED'
  | 'DEATH_RECORDED'
  | 'THEFT_REPORTED'
  | 'FRAUD_DETECTED';

export type SourceSystem = 'iCattle' | 'NLIS' | 'GPS' | 'Biometric' | 'DNA' | 'Manual';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SuspicionType =
  | 'TAG_SWAP'
  | 'RAPID_MOVEMENT'
  | 'PRICE_ANOMALY'
  | 'MISSING_DOCUMENTATION'
  | 'DUPLICATE_TAG'
  | 'CROSS_STATE_NO_PAPERWORK'
  | 'BELOW_MARKET_PRICE'
  | 'ABOVE_MARKET_PRICE'
  | 'GENETIC_MISMATCH'
  | 'PHOTO_MISMATCH'
  | 'GPS_ANOMALY'
  | 'MANUAL_FLAG';

// ============================================================================
// EVENT METADATA
// ============================================================================

export interface EventMetadata {
  event_id: string;
  event_type: EventType;
  event_ref: string;
  cattle_id: number;
  occurred_at: string; // ISO 8601
  recorded_at: string; // ISO 8601
  idempotency_key: string;
  correlation_id?: string;
  causation_id?: string;
  source_system: SourceSystem;
  schema_version: number;
  created_by?: string;
}

// ============================================================================
// EVENT ENVELOPE
// ============================================================================

export interface EventEnvelope<T = any> {
  metadata: EventMetadata;
  payload: T;
  payload_hash: string;
  previous_hash?: string;
}

// ============================================================================
// FUNCTIONAL CORE - PURE FUNCTIONS
// ============================================================================

/**
 * Create event metadata (pure function)
 */
export function createEventMetadata(params: {
  event_type: EventType;
  event_ref: string;
  cattle_id: number;
  occurred_at?: Date;
  idempotency_key: string;
  correlation_id?: string;
  causation_id?: string;
  source_system?: SourceSystem;
  created_by?: string;
}): EventMetadata {
  const now = new Date().toISOString();
  
  return {
    event_id: generateEventId(),
    event_type: params.event_type,
    event_ref: params.event_ref,
    cattle_id: params.cattle_id,
    occurred_at: params.occurred_at?.toISOString() || now,
    recorded_at: now,
    idempotency_key: params.idempotency_key,
    correlation_id: params.correlation_id,
    causation_id: params.causation_id,
    source_system: params.source_system || 'iCattle',
    schema_version: 1,
    created_by: params.created_by,
  };
}

/**
 * Calculate payload hash (pure function)
 * SHA-256 hash of payload for tamper detection
 */
export function calculatePayloadHash(payload: any): string {
  const content = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Create event envelope (pure function)
 */
export function createEventEnvelope<T>(
  metadata: EventMetadata,
  payload: T,
  previous_hash?: string
): EventEnvelope<T> {
  const payload_hash = calculatePayloadHash(payload);
  
  return {
    metadata,
    payload,
    payload_hash,
    previous_hash,
  };
}

/**
 * Verify event integrity (pure function)
 * Returns true if payload_hash matches calculated hash
 */
export function verifyEventIntegrity<T>(envelope: EventEnvelope<T>): boolean {
  const calculated_hash = calculatePayloadHash(envelope.payload);
  return envelope.payload_hash === calculated_hash;
}

/**
 * Generate event ID (pure function using timestamp + random)
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `evt_${timestamp}_${random}`;
}

/**
 * Generate idempotency key (pure function)
 */
export function generateIdempotencyKey(
  event_type: EventType,
  cattle_id: number,
  ref: string
): string {
  const content = `${event_type}:${cattle_id}:${ref}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================================
// PROVENANCE SCORING (PURE BUSINESS LOGIC)
// ============================================================================

export interface ProvenanceFactors {
  nlis_verified: boolean;
  photo_verified: boolean;
  gps_verified: boolean;
  biometric_verified: boolean;
  dna_verified: boolean;
  tag_changes_count: number;
  ownership_changes_count: number;
  location_changes_count: number;
  suspicious_transactions_count: number;
}

/**
 * Calculate confidence score (pure function)
 * Score 0-100 based on verification sources and risk factors
 */
export function calculateConfidenceScore(factors: ProvenanceFactors): number {
  let score = 0;
  
  // Base score from verifications (20 points each)
  if (factors.nlis_verified) score += 20;
  if (factors.photo_verified) score += 20;
  if (factors.gps_verified) score += 20;
  if (factors.biometric_verified) score += 20;
  if (factors.dna_verified) score += 20;
  
  // Deduct for risk factors
  score -= factors.tag_changes_count * 5; // -5 per tag change
  score -= factors.ownership_changes_count * 3; // -3 per ownership change
  score -= factors.location_changes_count * 2; // -2 per location change
  score -= factors.suspicious_transactions_count * 10; // -10 per suspicious transaction
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine risk level from confidence score (pure function)
 */
export function determineRiskLevel(confidence_score: number): RiskLevel {
  if (confidence_score >= 80) return 'LOW';
  if (confidence_score >= 60) return 'MEDIUM';
  if (confidence_score >= 40) return 'HIGH';
  return 'CRITICAL';
}

// ============================================================================
// FRAUD DETECTION RULES (PURE BUSINESS LOGIC)
// ============================================================================

export interface FraudDetectionContext {
  cattle: {
    id: number;
    current_tag: string;
    previous_tag?: string;
    current_location: string;
    previous_location?: string;
    current_value: number;
    market_value?: number;
    breed: string;
    age_months: number;
  };
  event: {
    type: EventType;
    occurred_at: Date;
    previous_event_at?: Date;
  };
}

export interface FraudDetectionResult {
  is_suspicious: boolean;
  suspicion_type?: SuspicionType;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  evidence?: Record<string, any>;
}

/**
 * Detect tag swap (pure function)
 */
export function detectTagSwap(
  current_tag: string,
  previous_tag?: string,
  has_documentation: boolean = false
): FraudDetectionResult {
  if (!previous_tag || current_tag === previous_tag) {
    return { is_suspicious: false };
  }
  
  // Tag changed without documentation = suspicious
  if (!has_documentation) {
    return {
      is_suspicious: true,
      suspicion_type: 'TAG_SWAP',
      severity: 'HIGH',
      description: `Tag changed from ${previous_tag} to ${current_tag} without supporting documentation`,
      evidence: { previous_tag, current_tag, has_documentation },
    };
  }
  
  return { is_suspicious: false };
}

/**
 * Detect rapid movement (pure function)
 */
export function detectRapidMovement(
  current_location: string,
  previous_location?: string,
  time_since_last_event_hours?: number
): FraudDetectionResult {
  if (!previous_location || current_location === previous_location) {
    return { is_suspicious: false };
  }
  
  // Movement within 24 hours = suspicious
  if (time_since_last_event_hours !== undefined && time_since_last_event_hours < 24) {
    return {
      is_suspicious: true,
      suspicion_type: 'RAPID_MOVEMENT',
      severity: 'MEDIUM',
      description: `Cattle moved from ${previous_location} to ${current_location} in ${time_since_last_event_hours.toFixed(1)} hours`,
      evidence: { previous_location, current_location, time_since_last_event_hours },
    };
  }
  
  return { is_suspicious: false };
}

/**
 * Detect price anomaly (pure function)
 */
export function detectPriceAnomaly(
  current_value: number,
  market_value?: number,
  threshold_percent: number = 30
): FraudDetectionResult {
  if (!market_value) {
    return { is_suspicious: false };
  }
  
  const diff_percent = Math.abs((current_value - market_value) / market_value) * 100;
  
  if (diff_percent > threshold_percent) {
    const is_below = current_value < market_value;
    
    return {
      is_suspicious: true,
      suspicion_type: is_below ? 'BELOW_MARKET_PRICE' : 'ABOVE_MARKET_PRICE',
      severity: diff_percent > 50 ? 'HIGH' : 'MEDIUM',
      description: `Valuation ${is_below ? 'below' : 'above'} market by ${diff_percent.toFixed(1)}% ($${current_value} vs $${market_value})`,
      evidence: { current_value, market_value, diff_percent },
    };
  }
  
  return { is_suspicious: false };
}

/**
 * Run all fraud detection rules (pure function)
 */
export function detectFraud(context: FraudDetectionContext): FraudDetectionResult[] {
  const results: FraudDetectionResult[] = [];
  
  // Tag swap detection
  if (context.event.type === 'TAG_CHANGED') {
    const tagSwapResult = detectTagSwap(
      context.cattle.current_tag,
      context.cattle.previous_tag,
      false // TODO: Check for documentation in payload
    );
    if (tagSwapResult.is_suspicious) {
      results.push(tagSwapResult);
    }
  }
  
  // Rapid movement detection
  if (context.event.type === 'LOCATION_MOVED' && context.event.previous_event_at) {
    const hours = (context.event.occurred_at.getTime() - context.event.previous_event_at.getTime()) / (1000 * 60 * 60);
    const rapidMovementResult = detectRapidMovement(
      context.cattle.current_location,
      context.cattle.previous_location,
      hours
    );
    if (rapidMovementResult.is_suspicious) {
      results.push(rapidMovementResult);
    }
  }
  
  // Price anomaly detection
  if (context.event.type === 'VALUATION_UPDATE') {
    const priceAnomalyResult = detectPriceAnomaly(
      context.cattle.current_value,
      context.cattle.market_value
    );
    if (priceAnomalyResult.is_suspicious) {
      results.push(priceAnomalyResult);
    }
  }
  
  return results;
}

// ============================================================================
// EVENT VALIDATION (PURE BUSINESS LOGIC)
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate event metadata (pure function)
 */
export function validateEventMetadata(metadata: EventMetadata): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!metadata.event_id) {
    errors.push({ field: 'event_id', message: 'Event ID is required' });
  }
  
  if (!metadata.event_type) {
    errors.push({ field: 'event_type', message: 'Event type is required' });
  }
  
  if (!metadata.event_ref) {
    errors.push({ field: 'event_ref', message: 'Event reference is required' });
  }
  
  if (!metadata.cattle_id || metadata.cattle_id <= 0) {
    errors.push({ field: 'cattle_id', message: 'Valid cattle ID is required' });
  }
  
  if (!metadata.idempotency_key) {
    errors.push({ field: 'idempotency_key', message: 'Idempotency key is required' });
  }
  
  return errors;
}

/**
 * Validate event envelope (pure function)
 */
export function validateEventEnvelope<T>(envelope: EventEnvelope<T>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Validate metadata
  errors.push(...validateEventMetadata(envelope.metadata));
  
  // Validate payload exists
  if (!envelope.payload) {
    errors.push({ field: 'payload', message: 'Payload is required' });
  }
  
  // Validate hash
  if (!envelope.payload_hash) {
    errors.push({ field: 'payload_hash', message: 'Payload hash is required' });
  }
  
  // Verify integrity
  if (!verifyEventIntegrity(envelope)) {
    errors.push({ field: 'payload_hash', message: 'Payload hash does not match calculated hash (tampering detected)' });
  }
  
  return errors;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TuringProtocol = {
  // Event creation
  createEventMetadata,
  createEventEnvelope,
  generateEventId,
  generateIdempotencyKey,
  
  // Integrity
  calculatePayloadHash,
  verifyEventIntegrity,
  
  // Provenance
  calculateConfidenceScore,
  determineRiskLevel,
  
  // Fraud detection
  detectTagSwap,
  detectRapidMovement,
  detectPriceAnomaly,
  detectFraud,
  
  // Validation
  validateEventMetadata,
  validateEventEnvelope,
};
