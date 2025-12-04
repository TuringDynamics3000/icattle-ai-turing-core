/**
 * TURING PROTOCOL V2 - STATE-OF-THE-ART EVENT SOURCING
 * 
 * Enhancements:
 * - EdDSA (Ed25519) digital signatures for non-repudiation
 * - Merkle trees for efficient batch verification
 * - Enhanced cryptographic integrity
 * - Multi-party signature support
 * 
 * Architecture: Functional Core, Imperative Shell
 */

import crypto from 'crypto';
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { MerkleTree } from 'merkletreejs';

// Re-export types from V1
export type {
  EventType,
  SourceSystem,
  RiskLevel,
  SuspicionType,
  ProvenanceFactors,
  FraudDetectionContext,
  FraudDetectionResult,
  ValidationError,
} from './turingProtocol';

// Import V1 functions
import {
  EventType,
  SourceSystem,
  RiskLevel,
  SuspicionType,
  generateEventId as generateEventIdV1,
  calculatePayloadHash as calculatePayloadHashV1,
  calculateConfidenceScore,
  determineRiskLevel,
  detectTagSwap,
  detectRapidMovement,
  detectPriceAnomaly,
  detectFraud,
  validateEventMetadata as validateEventMetadataV1,
} from './turingProtocol';

// ============================================================================
// ENHANCED TYPES
// ============================================================================

/**
 * Enhanced Event Metadata with cryptographic fields
 */
export interface EventMetadataV2 {
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
  
  // V2: Cryptographic identity
  public_key: string; // Creator's Ed25519 public key (hex)
}

/**
 * Cryptographic proof bundle
 */
export interface CryptographicProof {
  payload_hash: string;          // SHA-256 of payload
  previous_hash?: string;        // Links to previous event (blockchain-style)
  signature: string;             // EdDSA signature (hex)
  public_key: string;            // Signer's public key (hex)
  merkle_root?: string;          // Merkle tree root (for batch verification)
  merkle_proof?: string[];       // Merkle proof path
  timestamp_proof?: string;      // RFC 3161 timestamp (future)
}

/**
 * Provenance metadata
 */
export interface ProvenanceMetadata {
  confidence_score: number;      // 0-100
  risk_level: RiskLevel;         // LOW, MEDIUM, HIGH, CRITICAL
  verifications: string[];       // NLIS, Photo, GPS, Biometric, DNA
  suspicions: SuspicionType[];   // Fraud flags
  last_verified_at?: string;     // ISO 8601
}

/**
 * Enhanced Event Envelope V2
 */
export interface EventEnvelopeV2<T = any> {
  metadata: EventMetadataV2;
  payload: T;
  cryptography: CryptographicProof;
  provenance?: ProvenanceMetadata;
}

/**
 * Key pair for signing
 */
export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

// ============================================================================
// CRYPTOGRAPHIC FUNCTIONS
// ============================================================================

/**
 * Generate Ed25519 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = await ed25519.getPublicKeyAsync(privateKey);
  
  return { privateKey, publicKey };
}

/**
 * Convert Uint8Array to hex string
 */
export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

/**
 * Calculate SHA-256 hash (using @noble/hashes)
 */
export function calculateHash(data: string | Uint8Array): string {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return toHex(sha256(input));
}

/**
 * Calculate payload hash (V2 - using @noble/hashes)
 */
export function calculatePayloadHash(payload: any): string {
  let content: string;
  
  if (payload === null || payload === undefined) {
    content = String(payload);
  } else if (typeof payload !== 'object') {
    content = JSON.stringify(payload);
  } else {
    // Sort keys for deterministic hashing
    content = JSON.stringify(payload, Object.keys(payload).sort());
  }
  
  return calculateHash(content);
}

/**
 * Create signature message (deterministic string to sign)
 */
export function createSignatureMessage(
  metadata: EventMetadataV2,
  payload_hash: string,
  previous_hash?: string
): string {
  // Canonical representation for signing
  const parts = [
    metadata.event_id,
    metadata.event_type,
    metadata.cattle_id.toString(),
    metadata.occurred_at,
    metadata.idempotency_key,
    payload_hash,
    previous_hash || '',
  ];
  
  return parts.join('|');
}

/**
 * Sign event with Ed25519
 */
export async function signEvent(
  metadata: EventMetadataV2,
  payload_hash: string,
  privateKey: Uint8Array,
  previous_hash?: string
): Promise<string> {
  const message = createSignatureMessage(metadata, payload_hash, previous_hash);
  const messageBytes = new TextEncoder().encode(message);
  const messageHash = sha256(messageBytes);
  
  const signature = await ed25519.signAsync(messageHash, privateKey);
  return toHex(signature);
}

/**
 * Verify event signature
 */
export async function verifyEventSignature(
  metadata: EventMetadataV2,
  payload_hash: string,
  signature: string,
  publicKey: string,
  previous_hash?: string
): Promise<boolean> {
  try {
    const message = createSignatureMessage(metadata, payload_hash, previous_hash);
    const messageBytes = new TextEncoder().encode(message);
    const messageHash = sha256(messageBytes);
    
    const signatureBytes = fromHex(signature);
    const publicKeyBytes = fromHex(publicKey);
    
    return await ed25519.verifyAsync(signatureBytes, messageHash, publicKeyBytes);
  } catch (error) {
    console.error('[Crypto] Signature verification failed:', error);
    return false;
  }
}

/**
 * Verify event integrity (hash + signature)
 */
export async function verifyEventIntegrity<T>(
  envelope: EventEnvelopeV2<T>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // 1. Verify payload hash
  const calculated_hash = calculatePayloadHash(envelope.payload);
  if (envelope.cryptography.payload_hash !== calculated_hash) {
    errors.push('Payload hash mismatch - possible tampering');
  }
  
  // 2. Verify signature
  const signature_valid = await verifyEventSignature(
    envelope.metadata,
    envelope.cryptography.payload_hash,
    envelope.cryptography.signature,
    envelope.cryptography.public_key,
    envelope.cryptography.previous_hash
  );
  
  if (!signature_valid) {
    errors.push('Invalid signature - authentication failed');
  }
  
  // 3. Verify public key matches metadata
  if (envelope.metadata.public_key !== envelope.cryptography.public_key) {
    errors.push('Public key mismatch between metadata and cryptography');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MERKLE TREE FUNCTIONS
// ============================================================================

/**
 * Build Merkle tree from events
 */
export function buildMerkleTree(events: EventEnvelopeV2[]): MerkleTree {
  const leaves = events.map(event => {
    const leaf = `${event.metadata.event_id}:${event.cryptography.payload_hash}`;
    return calculateHash(leaf);
  });
  
  return new MerkleTree(leaves, calculateHash, { sortPairs: true });
}

/**
 * Get Merkle root from events
 */
export function getMerkleRoot(events: EventEnvelopeV2[]): string {
  if (events.length === 0) return '';
  const tree = buildMerkleTree(events);
  return tree.getRoot().toString('hex');
}

/**
 * Get Merkle proof for an event
 */
export function getMerkleProof(
  events: EventEnvelopeV2[],
  eventIndex: number
): string[] {
  const tree = buildMerkleTree(events);
  const event = events[eventIndex];
  const leaf = calculateHash(`${event.metadata.event_id}:${event.cryptography.payload_hash}`);
  
  const proof = tree.getProof(leaf);
  return proof.map(p => p.data.toString('hex'));
}

/**
 * Verify Merkle proof
 */
export function verifyMerkleProof(
  event: EventEnvelopeV2,
  merkleRoot: string,
  merkleProof: string[]
): boolean {
  const leaf = calculateHash(`${event.metadata.event_id}:${event.cryptography.payload_hash}`);
  const proofBuffers = merkleProof.map(p => Buffer.from(p, 'hex'));
  
  return MerkleTree.verify(
    proofBuffers,
    leaf,
    Buffer.from(merkleRoot, 'hex'),
    calculateHash,
    { sortPairs: true }
  );
}

// ============================================================================
// EVENT CREATION (V2)
// ============================================================================

/**
 * Create event metadata V2
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
  public_key: string; // Required in V2
}): EventMetadataV2 {
  const now = new Date().toISOString();
  
  return {
    event_id: generateEventIdV1(),
    event_type: params.event_type,
    event_ref: params.event_ref,
    cattle_id: params.cattle_id,
    occurred_at: params.occurred_at?.toISOString() || now,
    recorded_at: now,
    idempotency_key: params.idempotency_key,
    correlation_id: params.correlation_id,
    causation_id: params.causation_id,
    source_system: params.source_system || 'iCattle',
    schema_version: 2, // V2
    created_by: params.created_by,
    public_key: params.public_key,
  };
}

/**
 * Create signed event envelope V2
 */
export async function createSignedEventEnvelope<T>(params: {
  metadata: EventMetadataV2;
  payload: T;
  privateKey: Uint8Array;
  previous_hash?: string;
  provenance?: ProvenanceMetadata;
}): Promise<EventEnvelopeV2<T>> {
  // Calculate payload hash
  const payload_hash = calculatePayloadHash(params.payload);
  
  // Sign event
  const signature = await signEvent(
    params.metadata,
    payload_hash,
    params.privateKey,
    params.previous_hash
  );
  
  // Create cryptographic proof
  const cryptography: CryptographicProof = {
    payload_hash,
    previous_hash: params.previous_hash,
    signature,
    public_key: params.metadata.public_key,
  };
  
  return {
    metadata: params.metadata,
    payload: params.payload,
    cryptography,
    provenance: params.provenance,
  };
}

/**
 * Generate idempotency key (same as V1)
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
// VALIDATION (V2)
// ============================================================================

/**
 * Validate event metadata V2
 */
export function validateEventMetadata(metadata: EventMetadataV2): string[] {
  const errors: string[] = [];
  
  // Use V1 validation
  const v1Errors = validateEventMetadataV1(metadata as any);
  errors.push(...v1Errors.map(e => e.message));
  
  // V2-specific validation
  if (!metadata.public_key) {
    errors.push('Public key is required in V2');
  }
  
  if (metadata.public_key && metadata.public_key.length !== 64) {
    errors.push('Public key must be 64 hex characters (32 bytes)');
  }
  
  if (metadata.schema_version !== 2) {
    errors.push('Schema version must be 2 for V2 events');
  }
  
  return errors;
}

/**
 * Validate event envelope V2
 */
export async function validateEventEnvelope<T>(
  envelope: EventEnvelopeV2<T>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Validate metadata
  errors.push(...validateEventMetadata(envelope.metadata));
  
  // Validate payload exists
  if (!envelope.payload) {
    errors.push('Payload is required');
  }
  
  // Validate cryptography
  if (!envelope.cryptography) {
    errors.push('Cryptography proof is required');
  }
  
  if (!envelope.cryptography.payload_hash) {
    errors.push('Payload hash is required');
  }
  
  if (!envelope.cryptography.signature) {
    errors.push('Signature is required');
  }
  
  if (!envelope.cryptography.public_key) {
    errors.push('Public key is required in cryptography');
  }
  
  // Verify integrity (hash + signature)
  if (errors.length === 0) {
    const integrity = await verifyEventIntegrity(envelope);
    if (!integrity.valid) {
      errors.push(...integrity.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create complete signed event envelope in one call
 */
export async function createCompleteEventEnvelope<T>(params: {
  event_type: EventType;
  event_ref: string;
  cattle_id: number;
  payload: T;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  occurred_at?: Date;
  correlation_id?: string;
  causation_id?: string;
  source_system?: SourceSystem;
  created_by?: string;
  previous_hash?: string;
  provenance?: ProvenanceMetadata;
}): Promise<EventEnvelopeV2<T>> {
  // Generate idempotency key
  const idempotency_key = generateIdempotencyKey(
    params.event_type,
    params.cattle_id,
    params.event_ref
  );
  
  // Create metadata
  const metadata = createEventMetadata({
    event_type: params.event_type,
    event_ref: params.event_ref,
    cattle_id: params.cattle_id,
    occurred_at: params.occurred_at,
    idempotency_key,
    correlation_id: params.correlation_id,
    causation_id: params.causation_id,
    source_system: params.source_system || 'iCattle',
    created_by: params.created_by,
    public_key: toHex(params.publicKey),
  });
  
  // Create signed envelope
  return createSignedEventEnvelope({
    metadata,
    payload: params.payload,
    privateKey: params.privateKey,
    previous_hash: params.previous_hash,
    provenance: params.provenance,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TuringProtocolV2 = {
  // Key management
  generateKeyPair,
  toHex,
  fromHex,
  
  // Hashing
  calculateHash,
  calculatePayloadHash,
  
  // Signing
  signEvent,
  verifyEventSignature,
  verifyEventIntegrity,
  
  // Merkle trees
  buildMerkleTree,
  getMerkleRoot,
  getMerkleProof,
  verifyMerkleProof,
  
  // Event creation
  createEventMetadata,
  createSignedEventEnvelope,
  createCompleteEventEnvelope,
  generateIdempotencyKey,
  
  // Validation
  validateEventMetadata,
  validateEventEnvelope,
  
  // Re-export V1 functions
  calculateConfidenceScore,
  determineRiskLevel,
  detectTagSwap,
  detectRapidMovement,
  detectPriceAnomaly,
  detectFraud,
};
