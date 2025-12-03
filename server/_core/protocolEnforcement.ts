/**
 * TURING PROTOCOL ENFORCEMENT
 * 
 * Enforces cryptographic verification and chain integrity at all stages:
 * 1. Event creation - validate structure and generate hashes
 * 2. Event publishing - verify before sending to Kafka
 * 3. Event consumption - verify integrity before persistence
 * 4. Event replay - verify chain before reconstruction
 * 5. Fraud detection - verify events before analysis
 * 
 * Zero tolerance for protocol violations.
 */

import { TuringProtocol } from './turingProtocol';
import type { EventEnvelope, EventType } from './turingProtocol';

export interface ProtocolViolation {
  violation_type: 'INVALID_STRUCTURE' | 'TAMPERED_PAYLOAD' | 'BROKEN_CHAIN' | 'DUPLICATE_EVENT' | 'INVALID_SIGNATURE';
  event_id: string;
  cattle_id: number;
  details: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  detected_at: string;
}

export interface ProtocolEnforcementResult {
  is_valid: boolean;
  violations: ProtocolViolation[];
  event_id?: string;
}

/**
 * Enforce protocol on event creation
 * Called before publishing to Kafka
 */
export function enforceOnCreation<T>(
  envelope: EventEnvelope<T>
): ProtocolEnforcementResult {
  const violations: ProtocolViolation[] = [];

  // 1. Validate event structure
  const structureErrors = TuringProtocol.validateEventEnvelope(envelope);
  if (structureErrors.length > 0) {
    violations.push({
      violation_type: 'INVALID_STRUCTURE',
      event_id: envelope.metadata.event_id,
      cattle_id: envelope.metadata.cattle_id,
      details: `Structure validation failed: ${JSON.stringify(structureErrors)}`,
      severity: 'CRITICAL',
      detected_at: new Date().toISOString(),
    });
  }

  // 2. Verify payload integrity
  if (!TuringProtocol.verifyEventIntegrity(envelope)) {
    violations.push({
      violation_type: 'TAMPERED_PAYLOAD',
      event_id: envelope.metadata.event_id,
      cattle_id: envelope.metadata.cattle_id,
      details: 'Payload hash does not match calculated hash',
      severity: 'CRITICAL',
      detected_at: new Date().toISOString(),
    });
  }

  return {
    is_valid: violations.length === 0,
    violations,
    event_id: envelope.metadata.event_id,
  };
}

/**
 * Enforce protocol on event consumption
 * Called when reading from Kafka before persistence
 */
export function enforceOnConsumption<T>(
  envelope: EventEnvelope<T>,
  previousEvent?: EventEnvelope<any>
): ProtocolEnforcementResult {
  const violations: ProtocolViolation[] = [];

  // 1. Validate structure
  const creationResult = enforceOnCreation(envelope);
  violations.push(...creationResult.violations);

  // 2. Verify chain integrity (if previous event exists)
  if (previousEvent) {
    if (envelope.previous_hash !== previousEvent.payload_hash) {
      violations.push({
        violation_type: 'BROKEN_CHAIN',
        event_id: envelope.metadata.event_id,
        cattle_id: envelope.metadata.cattle_id,
        details: `Chain broken: expected previous_hash=${previousEvent.payload_hash}, got=${envelope.previous_hash}`,
        severity: 'CRITICAL',
        detected_at: new Date().toISOString(),
      });
    }
  }

  return {
    is_valid: violations.length === 0,
    violations,
    event_id: envelope.metadata.event_id,
  };
}

/**
 * Enforce protocol on event chain
 * Called before event replay or state reconstruction
 */
export function enforceOnChain(
  events: EventEnvelope<any>[]
): ProtocolEnforcementResult {
  const violations: ProtocolViolation[] = [];

  if (events.length === 0) {
    return { is_valid: true, violations: [] };
  }

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.metadata.occurred_at).getTime() - new Date(b.metadata.occurred_at).getTime()
  );

  // 1. Validate each event individually
  for (const event of sortedEvents) {
    const result = enforceOnCreation(event);
    violations.push(...result.violations);
  }

  // 2. Verify chain integrity
  for (let i = 1; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i];
    const previousEvent = sortedEvents[i - 1];

    if (currentEvent.previous_hash !== previousEvent.payload_hash) {
      violations.push({
        violation_type: 'BROKEN_CHAIN',
        event_id: currentEvent.metadata.event_id,
        cattle_id: currentEvent.metadata.cattle_id,
        details: `Chain broken at position ${i}: expected ${previousEvent.payload_hash}, got ${currentEvent.previous_hash}`,
        severity: 'CRITICAL',
        detected_at: new Date().toISOString(),
      });
    }
  }

  // 3. Check for duplicate events (same idempotency key)
  const idempotencyKeys = new Set<string>();
  for (const event of sortedEvents) {
    if (idempotencyKeys.has(event.metadata.idempotency_key)) {
      violations.push({
        violation_type: 'DUPLICATE_EVENT',
        event_id: event.metadata.event_id,
        cattle_id: event.metadata.cattle_id,
        details: `Duplicate idempotency key: ${event.metadata.idempotency_key}`,
        severity: 'HIGH',
        detected_at: new Date().toISOString(),
      });
    }
    idempotencyKeys.add(event.metadata.idempotency_key);
  }

  return {
    is_valid: violations.length === 0,
    violations,
  };
}

/**
 * Enforce protocol on fraud detection
 * Called before analyzing events for fraud
 */
export function enforceOnFraudDetection(
  events: EventEnvelope<any>[]
): ProtocolEnforcementResult {
  // Use same enforcement as chain verification
  return enforceOnChain(events);
}

/**
 * Get violation severity level
 */
export function getViolationSeverityLevel(violations: ProtocolViolation[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' {
  if (violations.length === 0) {
    return 'NONE';
  }

  if (violations.some(v => v.severity === 'CRITICAL')) {
    return 'CRITICAL';
  }

  if (violations.some(v => v.severity === 'HIGH')) {
    return 'HIGH';
  }

  return 'MEDIUM';
}

/**
 * Format violations for logging/alerting
 */
export function formatViolations(violations: ProtocolViolation[]): string {
  if (violations.length === 0) {
    return 'No violations detected';
  }

  return violations.map(v => 
    `[${v.severity}] ${v.violation_type}: ${v.details} (event_id=${v.event_id}, cattle_id=${v.cattle_id})`
  ).join('\n');
}

/**
 * Check if violations are critical (should block operation)
 */
export function hasCriticalViolations(violations: ProtocolViolation[]): boolean {
  return violations.some(v => v.severity === 'CRITICAL');
}

/**
 * Create protocol violation alert
 */
export function createViolationAlert(violation: ProtocolViolation): {
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  cattle_id: number;
  event_id: string;
} {
  return {
    title: `Protocol Violation: ${violation.violation_type}`,
    message: violation.details,
    severity: violation.severity,
    cattle_id: violation.cattle_id,
    event_id: violation.event_id,
  };
}

/**
 * Middleware wrapper for tRPC procedures
 * Enforces protocol on all cattle operations
 */
export function withProtocolEnforcement<T>(
  operation: () => Promise<T>,
  envelope: EventEnvelope<any>
): Promise<T> {
  // Enforce protocol before operation
  const result = enforceOnCreation(envelope);
  
  if (!result.is_valid) {
    const errorMessage = formatViolations(result.violations);
    throw new Error(`Protocol enforcement failed: ${errorMessage}`);
  }

  // Execute operation
  return operation();
}

/**
 * Batch protocol enforcement
 * For bulk operations
 */
export function enforceOnBatch(
  envelopes: EventEnvelope<any>[]
): {
  valid_events: EventEnvelope<any>[];
  invalid_events: Array<{ envelope: EventEnvelope<any>; violations: ProtocolViolation[] }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    critical_violations: number;
  };
} {
  const valid_events: EventEnvelope<any>[] = [];
  const invalid_events: Array<{ envelope: EventEnvelope<any>; violations: ProtocolViolation[] }> = [];
  let critical_violations = 0;

  for (const envelope of envelopes) {
    const result = enforceOnCreation(envelope);
    
    if (result.is_valid) {
      valid_events.push(envelope);
    } else {
      invalid_events.push({ envelope, violations: result.violations });
      if (hasCriticalViolations(result.violations)) {
        critical_violations++;
      }
    }
  }

  return {
    valid_events,
    invalid_events,
    summary: {
      total: envelopes.length,
      valid: valid_events.length,
      invalid: invalid_events.length,
      critical_violations,
    },
  };
}

/**
 * Protocol compliance report
 */
export interface ProtocolComplianceReport {
  cattle_id: number;
  total_events: number;
  compliant_events: number;
  violations: ProtocolViolation[];
  compliance_rate: number;
  chain_integrity: boolean;
  last_checked: string;
}

export function generateComplianceReport(
  cattle_id: number,
  events: EventEnvelope<any>[]
): ProtocolComplianceReport {
  const chainResult = enforceOnChain(events);
  const compliant_events = events.length - chainResult.violations.length;
  const compliance_rate = events.length > 0 ? (compliant_events / events.length) * 100 : 0;

  return {
    cattle_id,
    total_events: events.length,
    compliant_events,
    violations: chainResult.violations,
    compliance_rate: Math.round(compliance_rate * 100) / 100,
    chain_integrity: chainResult.is_valid,
    last_checked: new Date().toISOString(),
  };
}
