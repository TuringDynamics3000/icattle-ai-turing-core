/**
 * TEST EVENT GENERATOR
 * 
 * Simulates TuringCore-v3 producing events to Kafka
 * Used for testing iCattle Dashboard consumer
 */

import { Kafka, Producer } from 'kafkajs';
import { TuringProtocolV2 } from '../server/_core/turingProtocolV2';
import type { EventEnvelopeV2 } from '../server/_core/turingProtocolV2';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const KAFKA_CLIENT_ID = 'turingcore-test-producer';
const KAFKA_TOPIC_PREFIX = process.env.KAFKA_TOPIC_PREFIX || 'turing';

const TOPICS = {
  CATTLE_EVENTS: `${KAFKA_TOPIC_PREFIX}.cattle.events`,
  VALUATIONS: `${KAFKA_TOPIC_PREFIX}.valuations.events`,
  FRAUD: `${KAFKA_TOPIC_PREFIX}.fraud.events`,
  OWNERSHIP: `${KAFKA_TOPIC_PREFIX}.ownership.events`,
  HEALTH: `${KAFKA_TOPIC_PREFIX}.health.events`,
};

// ============================================================================
// KAFKA PRODUCER
// ============================================================================

let kafka: Kafka | null = null;
let producer: Producer | null = null;

async function initProducer(): Promise<Producer> {
  if (producer) return producer;
  
  kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: KAFKA_BROKERS,
  });
  
  producer = kafka.producer();
  await producer.connect();
  
  console.log('[Producer] Connected to Kafka');
  return producer;
}

async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    console.log('[Producer] Disconnected from Kafka');
  }
}

// ============================================================================
// TEST KEY PAIRS
// ============================================================================

// Generate test key pairs (in production, these would be managed securely)
const testKeyPairs = new Map<string, { privateKey: Uint8Array; publicKey: Uint8Array }>();

async function getOrCreateKeyPair(userId: string) {
  if (!testKeyPairs.has(userId)) {
    const keyPair = await TuringProtocolV2.generateKeyPair();
    testKeyPairs.set(userId, keyPair);
    console.log(`[KeyGen] Generated key pair for ${userId}: ${TuringProtocolV2.toHex(keyPair.publicKey)}`);
  }
  return testKeyPairs.get(userId)!;
}

// ============================================================================
// EVENT GENERATORS
// ============================================================================

/**
 * Generate CATTLE_CREATED event
 */
export async function generateCattleCreatedEvent(params: {
  cattle_id: number;
  nlisId: string;
  breed: string;
  sex: 'bull' | 'steer' | 'cow' | 'heifer' | 'calf';
  clientId: number;
  dateOfBirth?: Date;
  created_by?: string;
}): Promise<EventEnvelopeV2> {
  const created_by = params.created_by || 'test_user_001';
  const keyPair = await getOrCreateKeyPair(created_by);
  
  return TuringProtocolV2.createCompleteEventEnvelope({
    event_type: 'CATTLE_CREATED',
    event_ref: `cattle_${params.cattle_id}`,
    cattle_id: params.cattle_id,
    payload: {
      nlisId: params.nlisId,
      visualId: `TAG-${params.cattle_id}`,
      breed: params.breed,
      sex: params.sex,
      dateOfBirth: params.dateOfBirth?.toISOString() || new Date('2022-01-01').toISOString(),
      cattleType: 'beef',
      clientId: params.clientId,
      status: 'active',
      healthStatus: 'healthy',
    },
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    source_system: 'TuringCore-v3-Test',
    created_by,
    provenance: {
      confidence_score: 95,
      risk_level: 'LOW',
      verifications: ['NLIS', 'GPS'],
      suspicions: [],
    },
  });
}

/**
 * Generate OWNERSHIP_TRANSFER event
 */
export async function generateOwnershipTransferEvent(params: {
  cattle_id: number;
  from_client_id: number;
  to_client_id: number;
  transfer_price?: number;
  created_by?: string;
}): Promise<EventEnvelopeV2> {
  const created_by = params.created_by || 'test_user_001';
  const keyPair = await getOrCreateKeyPair(created_by);
  
  return TuringProtocolV2.createCompleteEventEnvelope({
    event_type: 'OWNERSHIP_TRANSFER',
    event_ref: `transfer_${params.cattle_id}_${Date.now()}`,
    cattle_id: params.cattle_id,
    payload: {
      from_client_id: params.from_client_id,
      to_client_id: params.to_client_id,
      transfer_price: params.transfer_price || 150000, // $1500 in cents
      transfer_date: new Date().toISOString(),
    },
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    source_system: 'TuringCore-v3-Test',
    created_by,
    provenance: {
      confidence_score: 90,
      risk_level: 'LOW',
      verifications: ['NLIS', 'GPS', 'Photo'],
      suspicions: [],
    },
  });
}

/**
 * Generate VALUATION_UPDATE event
 */
export async function generateValuationUpdateEvent(params: {
  cattle_id: number;
  new_value: number;
  weight?: number;
  market_price?: number;
  created_by?: string;
}): Promise<EventEnvelopeV2> {
  const created_by = params.created_by || 'test_user_001';
  const keyPair = await getOrCreateKeyPair(created_by);
  
  return TuringProtocolV2.createCompleteEventEnvelope({
    event_type: 'VALUATION_UPDATE',
    event_ref: `valuation_${params.cattle_id}_${Date.now()}`,
    cattle_id: params.cattle_id,
    payload: {
      new_value: params.new_value,
      weight: params.weight || 450,
      market_price: params.market_price || 320,
      method: 'market',
      data_source: 'MLA',
      confidence: 'high',
    },
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    source_system: 'TuringCore-v3-Test',
    created_by,
    provenance: {
      confidence_score: 92,
      risk_level: 'LOW',
      verifications: ['Weight', 'MarketData'],
      suspicions: [],
    },
  });
}

/**
 * Generate TAG_CHANGED event
 */
export async function generateTagChangedEvent(params: {
  cattle_id: number;
  old_tag: string;
  new_tag: string;
  reason?: string;
  created_by?: string;
}): Promise<EventEnvelopeV2> {
  const created_by = params.created_by || 'test_user_001';
  const keyPair = await getOrCreateKeyPair(created_by);
  
  return TuringProtocolV2.createCompleteEventEnvelope({
    event_type: 'TAG_CHANGED',
    event_ref: `tag_change_${params.cattle_id}_${Date.now()}`,
    cattle_id: params.cattle_id,
    payload: {
      old_tag: params.old_tag,
      new_tag: params.new_tag,
      reason: params.reason || 'Tag replacement',
      changed_date: new Date().toISOString(),
    },
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    source_system: 'TuringCore-v3-Test',
    created_by,
    provenance: {
      confidence_score: 85,
      risk_level: 'MEDIUM',
      verifications: ['Photo'],
      suspicions: [],
    },
  });
}

/**
 * Generate FRAUD_DETECTED event
 */
export async function generateFraudDetectedEvent(params: {
  cattle_id: number;
  suspicion_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  evidence?: any;
  created_by?: string;
}): Promise<EventEnvelopeV2> {
  const created_by = params.created_by || 'fraud_detection_system';
  const keyPair = await getOrCreateKeyPair(created_by);
  
  return TuringProtocolV2.createCompleteEventEnvelope({
    event_type: 'FRAUD_DETECTED',
    event_ref: `fraud_${params.cattle_id}_${Date.now()}`,
    cattle_id: params.cattle_id,
    payload: {
      suspicion_type: params.suspicion_type,
      severity: params.severity,
      description: params.description || `Fraud detected: ${params.suspicion_type}`,
      evidence: params.evidence || {},
      detected_at: new Date().toISOString(),
    },
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    source_system: 'TuringCore-v3-Test',
    created_by,
    provenance: {
      confidence_score: 40,
      risk_level: params.severity,
      verifications: [],
      suspicions: [params.suspicion_type],
    },
  });
}

// ============================================================================
// PUBLISH TO KAFKA
// ============================================================================

/**
 * Publish event to Kafka
 */
export async function publishEvent(
  event: EventEnvelopeV2,
  topic: string = TOPICS.CATTLE_EVENTS
): Promise<void> {
  const prod = await initProducer();
  
  await prod.send({
    topic,
    messages: [
      {
        key: event.metadata.cattle_id.toString(),
        value: JSON.stringify(event),
        headers: {
          'event_type': event.metadata.event_type,
          'event_id': event.metadata.event_id,
          'schema_version': event.metadata.schema_version.toString(),
        },
      },
    ],
  });
  
  console.log(`[Producer] Published ${event.metadata.event_type} for cattle ${event.metadata.cattle_id} to ${topic}`);
}

// ============================================================================
// BATCH GENERATORS
// ============================================================================

/**
 * Generate complete lifecycle for a cattle
 */
export async function generateCattleLifecycle(params: {
  cattle_id: number;
  nlisId: string;
  breed: string;
  clientId: number;
}): Promise<EventEnvelopeV2[]> {
  const events: EventEnvelopeV2[] = [];
  
  // 1. Created
  const created = await generateCattleCreatedEvent({
    cattle_id: params.cattle_id,
    nlisId: params.nlisId,
    breed: params.breed,
    sex: 'cow',
    clientId: params.clientId,
  });
  events.push(created);
  
  // 2. Initial valuation
  const valuation1 = await generateValuationUpdateEvent({
    cattle_id: params.cattle_id,
    new_value: 120000, // $1200
    weight: 400,
  });
  events.push(valuation1);
  
  // 3. Updated valuation
  const valuation2 = await generateValuationUpdateEvent({
    cattle_id: params.cattle_id,
    new_value: 150000, // $1500
    weight: 450,
  });
  events.push(valuation2);
  
  // 4. Ownership transfer
  const transfer = await generateOwnershipTransferEvent({
    cattle_id: params.cattle_id,
    from_client_id: params.clientId,
    to_client_id: params.clientId + 1,
    transfer_price: 150000,
  });
  events.push(transfer);
  
  return events;
}

/**
 * Generate batch of test cattle
 */
export async function generateTestCattleBatch(count: number = 10): Promise<EventEnvelopeV2[]> {
  const events: EventEnvelopeV2[] = [];
  const breeds = ['Angus', 'Hereford', 'Wagyu', 'Charolais', 'Brahman'];
  
  for (let i = 1; i <= count; i++) {
    const cattle_id = 1000 + i;
    const nlisId = `NAUS${String(cattle_id).padStart(9, '0')}`;
    const breed = breeds[i % breeds.length];
    const clientId = 1 + (i % 3); // Distribute across 3 clients
    
    const lifecycle = await generateCattleLifecycle({
      cattle_id,
      nlisId,
      breed,
      clientId,
    });
    
    events.push(...lifecycle);
  }
  
  return events;
}

/**
 * Publish batch of events to Kafka
 */
export async function publishBatch(events: EventEnvelopeV2[]): Promise<void> {
  console.log(`[Producer] Publishing ${events.length} events...`);
  
  for (const event of events) {
    await publishEvent(event);
    // Small delay to simulate real-world timing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[Producer] Published ${events.length} events successfully`);
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const command = process.argv[2];
  
  try {
    await initProducer();
    
    switch (command) {
      case 'single':
        // Generate single cattle created event
        const event = await generateCattleCreatedEvent({
          cattle_id: 9999,
          nlisId: 'NAUS000009999',
          breed: 'Angus',
          sex: 'cow',
          clientId: 1,
        });
        await publishEvent(event);
        break;
      
      case 'lifecycle':
        // Generate complete lifecycle for one cattle
        const lifecycle = await generateCattleLifecycle({
          cattle_id: 8888,
          nlisId: 'NAUS000008888',
          breed: 'Wagyu',
          clientId: 1,
        });
        await publishBatch(lifecycle);
        break;
      
      case 'batch':
        // Generate batch of test cattle
        const count = parseInt(process.argv[3] || '10');
        const batch = await generateTestCattleBatch(count);
        await publishBatch(batch);
        break;
      
      case 'fraud':
        // Generate fraud event
        const fraudEvent = await generateFraudDetectedEvent({
          cattle_id: 7777,
          suspicion_type: 'TAG_SWAP',
          severity: 'HIGH',
          description: 'Suspected tag swap detected by biometric mismatch',
          evidence: {
            expected_biometric: 'abc123',
            actual_biometric: 'xyz789',
            confidence: 0.95,
          },
        });
        await publishEvent(fraudEvent, TOPICS.FRAUD);
        break;
      
      default:
        console.log('Usage:');
        console.log('  pnpm test:generate single     - Generate single cattle event');
        console.log('  pnpm test:generate lifecycle  - Generate complete lifecycle');
        console.log('  pnpm test:generate batch [N]  - Generate N cattle (default 10)');
        console.log('  pnpm test:generate fraud      - Generate fraud event');
    }
  } catch (error) {
    console.error('[Producer] Error:', error);
    process.exit(1);
  } finally {
    await disconnectProducer();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// ============================================================================
// EXPORTS
// ============================================================================

export const EventGenerator = {
  init: initProducer,
  disconnect: disconnectProducer,
  generateCattleCreatedEvent,
  generateOwnershipTransferEvent,
  generateValuationUpdateEvent,
  generateTagChangedEvent,
  generateFraudDetectedEvent,
  generateCattleLifecycle,
  generateTestCattleBatch,
  publishEvent,
  publishBatch,
};
