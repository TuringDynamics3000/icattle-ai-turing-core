/**
 * TURING PROTOCOL V2 - UNIT TESTS
 * 
 * Tests for cryptographic functions, event validation, and integrity verification
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TuringProtocolV2 } from '../server/_core/turingProtocolV2';
import type { EventEnvelopeV2, KeyPair } from '../server/_core/turingProtocolV2';

describe('Turing Protocol V2 - Cryptography', () => {
  let keyPair: KeyPair;
  
  beforeAll(async () => {
    keyPair = await TuringProtocolV2.generateKeyPair();
  });
  
  describe('Key Generation', () => {
    it('should generate valid Ed25519 key pair', async () => {
      const kp = await TuringProtocolV2.generateKeyPair();
      
      expect(kp.privateKey).toBeInstanceOf(Uint8Array);
      expect(kp.publicKey).toBeInstanceOf(Uint8Array);
      expect(kp.privateKey.length).toBe(32);
      expect(kp.publicKey.length).toBe(32);
    });
    
    it('should generate unique key pairs', async () => {
      const kp1 = await TuringProtocolV2.generateKeyPair();
      const kp2 = await TuringProtocolV2.generateKeyPair();
      
      const pk1 = TuringProtocolV2.toHex(kp1.publicKey);
      const pk2 = TuringProtocolV2.toHex(kp2.publicKey);
      
      expect(pk1).not.toBe(pk2);
    });
  });
  
  describe('Hex Conversion', () => {
    it('should convert Uint8Array to hex string', () => {
      const bytes = new Uint8Array([0x01, 0x02, 0x03, 0xff]);
      const hex = TuringProtocolV2.toHex(bytes);
      
      expect(hex).toBe('010203ff');
    });
    
    it('should convert hex string to Uint8Array', () => {
      const hex = '010203ff';
      const bytes = TuringProtocolV2.fromHex(hex);
      
      expect(bytes).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0xff]));
    });
    
    it('should round-trip correctly', () => {
      const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const hex = TuringProtocolV2.toHex(original);
      const restored = TuringProtocolV2.fromHex(hex);
      
      expect(restored).toEqual(original);
    });
  });
  
  describe('Hashing', () => {
    it('should calculate SHA-256 hash', () => {
      const data = 'Hello, World!';
      const hash = TuringProtocolV2.calculateHash(data);
      
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });
    
    it('should produce deterministic hashes', () => {
      const data = 'test data';
      const hash1 = TuringProtocolV2.calculateHash(data);
      const hash2 = TuringProtocolV2.calculateHash(data);
      
      expect(hash1).toBe(hash2);
    });
    
    it('should produce different hashes for different data', () => {
      const hash1 = TuringProtocolV2.calculateHash('data1');
      const hash2 = TuringProtocolV2.calculateHash('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('Payload Hashing', () => {
    it('should hash simple payload', () => {
      const payload = { nlisId: 'NAUS000000001', breed: 'Angus' };
      const hash = TuringProtocolV2.calculatePayloadHash(payload);
      
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64); // SHA-256 hex = 64 chars
    });
    
    it('should produce deterministic payload hashes', () => {
      const payload = { nlisId: 'NAUS000000001', breed: 'Angus' };
      const hash1 = TuringProtocolV2.calculatePayloadHash(payload);
      const hash2 = TuringProtocolV2.calculatePayloadHash(payload);
      
      expect(hash1).toBe(hash2);
    });
    
    it('should handle nested objects', () => {
      const payload = {
        cattle: {
          nlisId: 'NAUS000000001',
          details: {
            breed: 'Angus',
            weight: 450,
          },
        },
      };
      const hash = TuringProtocolV2.calculatePayloadHash(payload);
      
      expect(hash).toBeTruthy();
    });
    
    it('should handle null and undefined', () => {
      const hash1 = TuringProtocolV2.calculatePayloadHash(null);
      const hash2 = TuringProtocolV2.calculatePayloadHash(undefined);
      
      expect(hash1).toBeTruthy();
      expect(hash2).toBeTruthy();
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('Digital Signatures', () => {
    it('should sign event', async () => {
      const metadata = TuringProtocolV2.createEventMetadata({
        event_type: 'CATTLE_CREATED',
        event_ref: 'test_ref',
        cattle_id: 1234,
        idempotency_key: 'test_key',
        public_key: TuringProtocolV2.toHex(keyPair.publicKey),
      });
      
      const payload_hash = TuringProtocolV2.calculatePayloadHash({ test: 'data' });
      const signature = await TuringProtocolV2.signEvent(
        metadata,
        payload_hash,
        keyPair.privateKey
      );
      
      expect(signature).toBeTruthy();
      expect(signature.length).toBe(128); // Ed25519 signature = 64 bytes = 128 hex chars
    });
    
    it('should verify valid signature', async () => {
      const metadata = TuringProtocolV2.createEventMetadata({
        event_type: 'CATTLE_CREATED',
        event_ref: 'test_ref',
        cattle_id: 1234,
        idempotency_key: 'test_key',
        public_key: TuringProtocolV2.toHex(keyPair.publicKey),
      });
      
      const payload_hash = TuringProtocolV2.calculatePayloadHash({ test: 'data' });
      const signature = await TuringProtocolV2.signEvent(
        metadata,
        payload_hash,
        keyPair.privateKey
      );
      
      const valid = await TuringProtocolV2.verifyEventSignature(
        metadata,
        payload_hash,
        signature,
        TuringProtocolV2.toHex(keyPair.publicKey)
      );
      
      expect(valid).toBe(true);
    });
    
    it('should reject invalid signature', async () => {
      const metadata = TuringProtocolV2.createEventMetadata({
        event_type: 'CATTLE_CREATED',
        event_ref: 'test_ref',
        cattle_id: 1234,
        idempotency_key: 'test_key',
        public_key: TuringProtocolV2.toHex(keyPair.publicKey),
      });
      
      const payload_hash = TuringProtocolV2.calculatePayloadHash({ test: 'data' });
      const fake_signature = '0'.repeat(128);
      
      const valid = await TuringProtocolV2.verifyEventSignature(
        metadata,
        payload_hash,
        fake_signature,
        TuringProtocolV2.toHex(keyPair.publicKey)
      );
      
      expect(valid).toBe(false);
    });
    
    it('should reject signature with wrong public key', async () => {
      const kp2 = await TuringProtocolV2.generateKeyPair();
      
      const metadata = TuringProtocolV2.createEventMetadata({
        event_type: 'CATTLE_CREATED',
        event_ref: 'test_ref',
        cattle_id: 1234,
        idempotency_key: 'test_key',
        public_key: TuringProtocolV2.toHex(keyPair.publicKey),
      });
      
      const payload_hash = TuringProtocolV2.calculatePayloadHash({ test: 'data' });
      const signature = await TuringProtocolV2.signEvent(
        metadata,
        payload_hash,
        keyPair.privateKey
      );
      
      // Try to verify with different public key
      const valid = await TuringProtocolV2.verifyEventSignature(
        metadata,
        payload_hash,
        signature,
        TuringProtocolV2.toHex(kp2.publicKey)
      );
      
      expect(valid).toBe(false);
    });
  });
});

describe('Turing Protocol V2 - Event Creation', () => {
  let keyPair: KeyPair;
  
  beforeAll(async () => {
    keyPair = await TuringProtocolV2.generateKeyPair();
  });
  
  describe('Event Metadata', () => {
    it('should create valid event metadata', () => {
      const metadata = TuringProtocolV2.createEventMetadata({
        event_type: 'CATTLE_CREATED',
        event_ref: 'cattle_1234',
        cattle_id: 1234,
        idempotency_key: 'test_key',
        public_key: TuringProtocolV2.toHex(keyPair.publicKey),
      });
      
      expect(metadata.event_id).toBeTruthy();
      expect(metadata.event_type).toBe('CATTLE_CREATED');
      expect(metadata.cattle_id).toBe(1234);
      expect(metadata.schema_version).toBe(2);
      expect(metadata.public_key).toBe(TuringProtocolV2.toHex(keyPair.publicKey));
    });
  });
  
  describe('Signed Event Envelope', () => {
    it('should create signed event envelope', async () => {
      const metadata = TuringProtocolV2.createEventMetadata({
        event_type: 'CATTLE_CREATED',
        event_ref: 'cattle_1234',
        cattle_id: 1234,
        idempotency_key: 'test_key',
        public_key: TuringProtocolV2.toHex(keyPair.publicKey),
      });
      
      const payload = {
        nlisId: 'NAUS000000001',
        breed: 'Angus',
        sex: 'cow',
      };
      
      const envelope = await TuringProtocolV2.createSignedEventEnvelope({
        metadata,
        payload,
        privateKey: keyPair.privateKey,
      });
      
      expect(envelope.metadata).toEqual(metadata);
      expect(envelope.payload).toEqual(payload);
      expect(envelope.cryptography.payload_hash).toBeTruthy();
      expect(envelope.cryptography.signature).toBeTruthy();
      expect(envelope.cryptography.public_key).toBe(TuringProtocolV2.toHex(keyPair.publicKey));
    });
    
    it('should create complete event envelope', async () => {
      const envelope = await TuringProtocolV2.createCompleteEventEnvelope({
        event_type: 'CATTLE_CREATED',
        event_ref: 'cattle_1234',
        cattle_id: 1234,
        payload: {
          nlisId: 'NAUS000000001',
          breed: 'Angus',
        },
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
      });
      
      expect(envelope.metadata.event_type).toBe('CATTLE_CREATED');
      expect(envelope.payload.nlisId).toBe('NAUS000000001');
      expect(envelope.cryptography.signature).toBeTruthy();
    });
  });
  
  describe('Idempotency Key', () => {
    it('should generate deterministic idempotency key', () => {
      const key1 = TuringProtocolV2.generateIdempotencyKey('CATTLE_CREATED', 1234, 'ref1');
      const key2 = TuringProtocolV2.generateIdempotencyKey('CATTLE_CREATED', 1234, 'ref1');
      
      expect(key1).toBe(key2);
    });
    
    it('should generate different keys for different inputs', () => {
      const key1 = TuringProtocolV2.generateIdempotencyKey('CATTLE_CREATED', 1234, 'ref1');
      const key2 = TuringProtocolV2.generateIdempotencyKey('CATTLE_CREATED', 1235, 'ref1');
      
      expect(key1).not.toBe(key2);
    });
  });
});

describe('Turing Protocol V2 - Event Validation', () => {
  let keyPair: KeyPair;
  let validEnvelope: EventEnvelopeV2;
  
  beforeAll(async () => {
    keyPair = await TuringProtocolV2.generateKeyPair();
    
    validEnvelope = await TuringProtocolV2.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      event_ref: 'cattle_1234',
      cattle_id: 1234,
      payload: {
        nlisId: 'NAUS000000001',
        breed: 'Angus',
      },
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
    });
  });
  
  describe('Metadata Validation', () => {
    it('should validate correct metadata', () => {
      const errors = TuringProtocolV2.validateEventMetadata(validEnvelope.metadata);
      expect(errors).toEqual([]);
    });
    
    it('should reject missing public key', () => {
      const metadata = { ...validEnvelope.metadata, public_key: '' };
      const errors = TuringProtocolV2.validateEventMetadata(metadata);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.toLowerCase().includes('public'))).toBe(true);
    });
    
    it('should reject invalid schema version', () => {
      const metadata = { ...validEnvelope.metadata, schema_version: 1 };
      const errors = TuringProtocolV2.validateEventMetadata(metadata);
      
      expect(errors.some(e => e.toLowerCase().includes('schema'))).toBe(true);
    });
  });
  
  describe('Event Integrity', () => {
    it('should verify valid event integrity', async () => {
      const result = await TuringProtocolV2.verifyEventIntegrity(validEnvelope);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should detect payload tampering', async () => {
      const tamperedEnvelope = {
        ...validEnvelope,
        payload: { ...validEnvelope.payload, breed: 'Hereford' }, // Changed!
      };
      
      const result = await TuringProtocolV2.verifyEventIntegrity(tamperedEnvelope);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('hash mismatch'))).toBe(true);
    });
    
    it('should detect signature tampering', async () => {
      const tamperedEnvelope = {
        ...validEnvelope,
        cryptography: {
          ...validEnvelope.cryptography,
          signature: '0'.repeat(128), // Invalid signature
        },
      };
      
      const result = await TuringProtocolV2.verifyEventIntegrity(tamperedEnvelope);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('signature'))).toBe(true);
    });
  });
  
  describe('Event Envelope Validation', () => {
    it('should validate complete event envelope', async () => {
      const result = await TuringProtocolV2.validateEventEnvelope(validEnvelope);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject envelope without payload', async () => {
      const invalidEnvelope = {
        ...validEnvelope,
        payload: null as any,
      };
      
      const result = await TuringProtocolV2.validateEventEnvelope(invalidEnvelope);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('payload'))).toBe(true);
    });
  });
});

describe('Turing Protocol V2 - Merkle Trees', () => {
  let events: EventEnvelopeV2[];
  let keyPair: KeyPair;
  
  beforeAll(async () => {
    keyPair = await TuringProtocolV2.generateKeyPair();
    
    // Create 5 test events
    events = await Promise.all(
      [1, 2, 3, 4, 5].map(i =>
        TuringProtocolV2.createCompleteEventEnvelope({
          event_type: 'CATTLE_CREATED',
          event_ref: `cattle_${i}`,
          cattle_id: i,
          payload: { nlisId: `NAUS00000000${i}` },
          privateKey: keyPair.privateKey,
          publicKey: keyPair.publicKey,
        })
      )
    );
  });
  
  it('should build Merkle tree from events', () => {
    const tree = TuringProtocolV2.buildMerkleTree(events);
    expect(tree).toBeTruthy();
  });
  
  it('should calculate Merkle root', () => {
    const root = TuringProtocolV2.getMerkleRoot(events);
    expect(root).toBeTruthy();
    expect(root.length).toBe(64); // SHA-256 hex
  });
  
  it('should generate Merkle proof', () => {
    const proof = TuringProtocolV2.getMerkleProof(events, 2);
    expect(proof).toBeTruthy();
    expect(Array.isArray(proof)).toBe(true);
  });
  
  it('should verify Merkle proof', () => {
    const root = TuringProtocolV2.getMerkleRoot(events);
    const proof = TuringProtocolV2.getMerkleProof(events, 2);
    
    const valid = TuringProtocolV2.verifyMerkleProof(events[2], root, proof);
    expect(valid).toBe(true);
  });
  
  it('should reject invalid Merkle proof', () => {
    const root = TuringProtocolV2.getMerkleRoot(events);
    const proof = TuringProtocolV2.getMerkleProof(events, 2);
    
    // Try to verify different event with same proof
    const valid = TuringProtocolV2.verifyMerkleProof(events[3], root, proof);
    expect(valid).toBe(false);
  });
  
  it('should produce deterministic Merkle root', () => {
    const root1 = TuringProtocolV2.getMerkleRoot(events);
    const root2 = TuringProtocolV2.getMerkleRoot(events);
    
    expect(root1).toBe(root2);
  });
});

describe('Turing Protocol V2 - Event Chaining', () => {
  let keyPair: KeyPair;
  
  beforeAll(async () => {
    keyPair = await TuringProtocolV2.generateKeyPair();
  });
  
  it('should create event chain', async () => {
    // Event 1
    const event1 = await TuringProtocolV2.createCompleteEventEnvelope({
      event_type: 'CATTLE_CREATED',
      event_ref: 'cattle_1',
      cattle_id: 1,
      payload: { nlisId: 'NAUS000000001' },
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
    });
    
    // Event 2 (links to event 1)
    const event2 = await TuringProtocolV2.createCompleteEventEnvelope({
      event_type: 'VALUATION_UPDATE',
      event_ref: 'valuation_1',
      cattle_id: 1,
      payload: { new_value: 150000 },
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      previous_hash: event1.cryptography.payload_hash,
    });
    
    // Event 3 (links to event 2)
    const event3 = await TuringProtocolV2.createCompleteEventEnvelope({
      event_type: 'OWNERSHIP_TRANSFER',
      event_ref: 'transfer_1',
      cattle_id: 1,
      payload: { to_client_id: 2 },
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      previous_hash: event2.cryptography.payload_hash,
    });
    
    // Verify chain
    expect(event2.cryptography.previous_hash).toBe(event1.cryptography.payload_hash);
    expect(event3.cryptography.previous_hash).toBe(event2.cryptography.payload_hash);
  });
});
