/**
 * EVENT REPLAY - INTEGRATION TESTS
 * 
 * Tests for event replay functionality
 * Requires Kafka and PostgreSQL to be running
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EventGenerator } from './eventGenerator';
import { TuringProtocolV2 } from '../server/_core/turingProtocolV2';
import type { EventEnvelopeV2 } from '../server/_core/turingProtocolV2';

describe('Event Replay - Integration', () => {
  describe('Event Generation', () => {
    it('should generate cattle created event', async () => {
      const event = await EventGenerator.generateCattleCreatedEvent({
        cattle_id: 9999,
        nlisId: 'NAUS000009999',
        breed: 'Angus',
        sex: 'cow',
        clientId: 1,
      });
      
      expect(event.metadata.event_type).toBe('CATTLE_CREATED');
      expect(event.metadata.cattle_id).toBe(9999);
      expect(event.payload.nlisId).toBe('NAUS000009999');
      expect(event.cryptography.signature).toBeTruthy();
    });
    
    it('should generate ownership transfer event', async () => {
      const event = await EventGenerator.generateOwnershipTransferEvent({
        cattle_id: 9999,
        from_client_id: 1,
        to_client_id: 2,
      });
      
      expect(event.metadata.event_type).toBe('OWNERSHIP_TRANSFER');
      expect(event.payload.from_client_id).toBe(1);
      expect(event.payload.to_client_id).toBe(2);
    });
    
    it('should generate valuation update event', async () => {
      const event = await EventGenerator.generateValuationUpdateEvent({
        cattle_id: 9999,
        new_value: 150000,
      });
      
      expect(event.metadata.event_type).toBe('VALUATION_UPDATE');
      expect(event.payload.new_value).toBe(150000);
    });
    
    it('should generate fraud detected event', async () => {
      const event = await EventGenerator.generateFraudDetectedEvent({
        cattle_id: 9999,
        suspicion_type: 'TAG_SWAP',
        severity: 'HIGH',
      });
      
      expect(event.metadata.event_type).toBe('FRAUD_DETECTED');
      expect(event.payload.suspicion_type).toBe('TAG_SWAP');
      expect(event.payload.severity).toBe('HIGH');
    });
  });
  
  describe('Event Lifecycle', () => {
    it('should generate complete cattle lifecycle', async () => {
      const events = await EventGenerator.generateCattleLifecycle({
        cattle_id: 8888,
        nlisId: 'NAUS000008888',
        breed: 'Wagyu',
        clientId: 1,
      });
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].metadata.event_type).toBe('CATTLE_CREATED');
      
      // Verify all events are valid
      for (const event of events) {
        const validation = await TuringProtocolV2.validateEventEnvelope(event);
        expect(validation.valid).toBe(true);
      }
    });
    
    it('should generate batch of test cattle', async () => {
      const events = await EventGenerator.generateTestCattleBatch(5);
      
      expect(events.length).toBeGreaterThan(0);
      
      // Verify all events are valid
      for (const event of events) {
        const validation = await TuringProtocolV2.validateEventEnvelope(event);
        expect(validation.valid).toBe(true);
      }
    });
  });
  
  describe('Event Validation', () => {
    it('should validate generated events', async () => {
      const event = await EventGenerator.generateCattleCreatedEvent({
        cattle_id: 7777,
        nlisId: 'NAUS000007777',
        breed: 'Hereford',
        sex: 'bull',
        clientId: 1,
      });
      
      const validation = await TuringProtocolV2.validateEventEnvelope(event);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
    
    it('should verify event signatures', async () => {
      const event = await EventGenerator.generateCattleCreatedEvent({
        cattle_id: 6666,
        nlisId: 'NAUS000006666',
        breed: 'Charolais',
        sex: 'cow',
        clientId: 1,
      });
      
      const integrity = await TuringProtocolV2.verifyEventIntegrity(event);
      
      expect(integrity.valid).toBe(true);
      expect(integrity.errors).toEqual([]);
    });
  });
  
  describe('Merkle Tree Verification', () => {
    it('should build Merkle tree from generated events', async () => {
      const events = await EventGenerator.generateTestCattleBatch(10);
      
      const tree = TuringProtocolV2.buildMerkleTree(events);
      const root = TuringProtocolV2.getMerkleRoot(events);
      
      expect(tree).toBeTruthy();
      expect(root).toBeTruthy();
      expect(root.length).toBe(64);
    });
    
    it('should verify Merkle proofs for generated events', async () => {
      const events = await EventGenerator.generateTestCattleBatch(10);
      const root = TuringProtocolV2.getMerkleRoot(events);
      
      // Verify proof for middle event
      const proof = TuringProtocolV2.getMerkleProof(events, 5);
      const valid = TuringProtocolV2.verifyMerkleProof(events[5], root, proof);
      
      expect(valid).toBe(true);
    });
  });
});

describe('Event Chain Verification', () => {
  it('should generate lifecycle events with consistent signatures', async () => {
    const cattle_id = 5555;
    
    // Generate complete lifecycle
    const events = await EventGenerator.generateCattleLifecycle({
      cattle_id,
      nlisId: `NAUS00000${cattle_id}`,
      breed: 'Angus',
      clientId: 1,
    });
    
    expect(events.length).toBeGreaterThan(0);
    
    // Verify all events are valid
    for (const event of events) {
      const validation = await TuringProtocolV2.validateEventEnvelope(event);
      expect(validation.valid).toBe(true);
    }
    
    // Verify events are for the same cattle
    for (const event of events) {
      expect(event.metadata.cattle_id).toBe(cattle_id);
    }
  });
});
