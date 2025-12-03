/**
 * EVENT REPLAY & FRAUD DETECTION TESTS
 * 
 * Comprehensive test suite for:
 * - Event replay and state reconstruction
 * - Turing Protocol enforcement
 * - Fraud detection algorithms
 * - Protocol compliance reporting
 */

import { describe, it, expect } from 'vitest';
import { TuringProtocol } from './_core/turingProtocol';
import { reconstructStateFromEvents, compareStates, verifyEventChainIntegrity, calculateReconstructionConfidence } from './_core/eventReplay';
import { analyzeForFraud } from './_core/fraudDetection';
import { enforceOnCreation, enforceOnChain, generateComplianceReport } from './_core/protocolEnforcement';

describe('Event Replay & State Reconstruction', () => {
  it('should reconstruct cattle state from events', () => {
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'CATTLE_CREATED',
        cattle_id: 1,
        payload: {
          visual_id: 'TEST-001',
          nlis_id: '982123876311',
          breed: 'Wagyu',
          sex: 'Steer',
          weight: 450,
          location: 'North Paddock',
          value: 250000,
          owner: 'Test Farm',
        },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'WEIGHT_RECORDED',
        cattle_id: 1,
        payload: {
          weight: 500,
        },
      }),
    ];

    const state = reconstructStateFromEvents(events);

    expect(state.cattle_id).toBe(1);
    expect(state.visual_id).toBe('TEST-001');
    expect(state.nlis_id).toBe('982123876311');
    expect(state.breed).toBe('Wagyu');
    expect(state.current_weight).toBe(500); // Updated by second event
    expect(state.total_events).toBe(2);
  });

  it('should verify event chain integrity', () => {
    const event1 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      cattle_id: 1,
      payload: { visual_id: 'TEST-001' },
    });

    const event2 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'WEIGHT_RECORDED',
      cattle_id: 1,
      payload: { weight: 500 },
      previous_hash: event1.payload_hash,
    });

    const result = verifyEventChainIntegrity([event1, event2]);

    expect(result.is_valid).toBe(true);
    expect(result.broken_links).toHaveLength(0);
  });

  it('should detect broken event chain', () => {
    const event1 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      cattle_id: 1,
      payload: { visual_id: 'TEST-001' },
    });

    const event2 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'WEIGHT_RECORDED',
      cattle_id: 1,
      payload: { weight: 500 },
      previous_hash: 'WRONG_HASH',
    });

    const result = verifyEventChainIntegrity([event1, event2]);

    expect(result.is_valid).toBe(false);
    expect(result.broken_links).toHaveLength(1);
  });

  it('should calculate reconstruction confidence', () => {
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'CATTLE_CREATED',
        cattle_id: 1,
        payload: {
          visual_id: 'TEST-001',
          nlis_id: '982123876311',
          breed: 'Wagyu',
          sex: 'Steer',
          current_weight: 450,
          current_location: 'North Paddock',
          current_value: 250000,
          owner: 'Test Farm',
        },
      }),
    ];

    const state = reconstructStateFromEvents(events);
    const confidence = calculateReconstructionConfidence(events, state);

    expect(confidence.score).toBeGreaterThan(0);
    expect(confidence.factors.event_count).toBe(1);
    expect(confidence.factors.chain_integrity).toBe(true);
    expect(confidence.factors.completeness).toBeGreaterThan(0);
  });

  it('should compare current state with reconstructed state', () => {
    const currentState = {
      id: 1,
      visual_id: 'TEST-001',
      nlis_id: '982123876311',
      breed: 'Wagyu',
      current_weight: 500,
    };

    const reconstructedState = {
      cattle_id: 1,
      visual_id: 'TEST-001',
      nlis_id: '982123876311',
      breed: 'Wagyu',
      current_weight: 450, // Different!
      total_events: 1,
      reconstruction_timestamp: new Date().toISOString(),
    };

    const comparison = compareStates(currentState, reconstructedState);

    expect(comparison.differences).toHaveLength(1);
    expect(comparison.differences[0].field).toBe('current_weight');
    expect(comparison.differences[0].current_value).toBe(500);
    expect(comparison.differences[0].reconstructed_value).toBe(450);
    expect(comparison.integrity_status).toBe('PARTIAL_MATCH');
  });
});

describe('Turing Protocol Enforcement', () => {
  it('should enforce protocol on event creation', () => {
    const envelope = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      cattle_id: 1,
      payload: { visual_id: 'TEST-001' },
    });

    const result = enforceOnCreation(envelope);

    expect(result.is_valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect tampered payload', () => {
    const envelope = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      cattle_id: 1,
      payload: { visual_id: 'TEST-001' },
    });

    // Tamper with payload
    envelope.payload.visual_id = 'TAMPERED';

    const result = enforceOnCreation(envelope);

    expect(result.is_valid).toBe(false);
    expect(result.violations.some(v => v.violation_type === 'TAMPERED_PAYLOAD')).toBe(true);
  });

  it('should enforce protocol on event chain', () => {
    const event1 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      cattle_id: 1,
      payload: { visual_id: 'TEST-001' },
    });

    const event2 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'WEIGHT_RECORDED',
      cattle_id: 1,
      payload: { weight: 500 },
      previous_hash: event1.payload_hash,
    });

    const result = enforceOnChain([event1, event2]);

    expect(result.is_valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should generate compliance report', () => {
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'CATTLE_CREATED',
        cattle_id: 1,
        payload: { visual_id: 'TEST-001' },
      }),
    ];

    const report = generateComplianceReport(1, events);

    expect(report.cattle_id).toBe(1);
    expect(report.total_events).toBe(1);
    expect(report.compliant_events).toBe(1);
    expect(report.compliance_rate).toBe(100);
    expect(report.chain_integrity).toBe(true);
  });
});

describe('Fraud Detection', () => {
  it('should detect no fraud for clean events', async () => {
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'CATTLE_CREATED',
        cattle_id: 1,
        payload: { visual_id: 'TEST-001' },
      }),
    ];

    const result = await analyzeForFraud(1, events);

    expect(result.cattle_id).toBe(1);
    expect(result.alerts).toHaveLength(0);
    expect(result.risk_score).toBe(0);
    expect(result.protocol_compliant).toBe(true);
  });

  it('should detect tag swap fraud', async () => {
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'CATTLE_CREATED',
        cattle_id: 1,
        payload: { nlis_id: '982123876311' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'TAG_CHANGED',
        cattle_id: 1,
        payload: { old_nlis_id: '982123876311', new_nlis_id: '982123876312' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'TAG_CHANGED',
        cattle_id: 1,
        payload: { old_nlis_id: '982123876312', new_nlis_id: '982123876313' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'TAG_CHANGED',
        cattle_id: 1,
        payload: { old_nlis_id: '982123876313', new_nlis_id: '982123876314' },
      }),
    ];

    const result = await analyzeForFraud(1, events);

    expect(result.alerts.some(a => a.fraud_type === 'TAG_SWAP')).toBe(true);
    expect(result.risk_score).toBeGreaterThan(0);
  });

  it('should detect rapid movement fraud', async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const event1 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'MOVEMENT',
      cattle_id: 1,
      payload: { to_location: 'Paddock A' },
    });
    // Override occurred_at
    event1.metadata.occurred_at = twoHoursAgo.toISOString();

    const event2 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'MOVEMENT',
      cattle_id: 1,
      payload: { to_location: 'Paddock B' },
    });
    // Override occurred_at
    event2.metadata.occurred_at = now.toISOString();

    const events = [event1, event2];

    const result = await analyzeForFraud(1, events);

    expect(result.alerts.some(a => a.fraud_type === 'RAPID_MOVEMENT')).toBe(true);
  });

  it('should detect price anomaly fraud', async () => {
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'VALUATION_UPDATE',
        cattle_id: 1,
        payload: { new_value: 100000, value: 100000 },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'VALUATION_UPDATE',
        cattle_id: 1,
        payload: { new_value: 200000, value: 200000 }, // 100% increase!
      }),
    ];

    const result = await analyzeForFraud(1, events);

    expect(result.alerts.some(a => a.fraud_type === 'PRICE_ANOMALY')).toBe(true);
    expect(result.risk_score).toBeGreaterThan(0);
  });

  it('should detect ownership churn fraud', async () => {
    // Need more than 3 ownership changes
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'OWNERSHIP_TRANSFER',
        cattle_id: 1,
        payload: { new_owner: 'Owner A' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'OWNERSHIP_TRANSFER',
        cattle_id: 1,
        payload: { new_owner: 'Owner B' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'OWNERSHIP_TRANSFER',
        cattle_id: 1,
        payload: { new_owner: 'Owner C' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'OWNERSHIP_TRANSFER',
        cattle_id: 1,
        payload: { new_owner: 'Owner D' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'OWNERSHIP_TRANSFER',
        cattle_id: 1,
        payload: { new_owner: 'Owner E' },
      }),
    ];

    const result = await analyzeForFraud(1, events);

    expect(result.alerts.some(a => a.fraud_type === 'OWNERSHIP_CHURN')).toBe(true);
  });

  it('should detect location anomaly fraud', async () => {
    // Need more than 3 visits to same location
    const events = [
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'MOVEMENT',
        cattle_id: 1,
        payload: { to_location: 'Paddock A' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'MOVEMENT',
        cattle_id: 1,
        payload: { to_location: 'Paddock A' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'MOVEMENT',
        cattle_id: 1,
        payload: { to_location: 'Paddock A' },
      }),
      TuringProtocol.createCompleteEventEnvelope({
        event_type: 'MOVEMENT',
        cattle_id: 1,
        payload: { to_location: 'Paddock A' },
      }),
    ];

    const result = await analyzeForFraud(1, events);

    expect(result.alerts.some(a => a.fraud_type === 'LOCATION_ANOMALY')).toBe(true);
  });

  it('should detect protocol violations as critical fraud', async () => {
    const event1 = TuringProtocol.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      cattle_id: 1,
      payload: { visual_id: 'TEST-001' },
    });

    // Tamper with payload
    event1.payload.visual_id = 'TAMPERED';

    const result = await analyzeForFraud(1, [event1]);

    expect(result.protocol_compliant).toBe(false);
    expect(result.alerts.some(a => a.fraud_type === 'PROTOCOL_VIOLATION')).toBe(true);
    expect(result.risk_score).toBe(100); // Maximum risk
  });
});
