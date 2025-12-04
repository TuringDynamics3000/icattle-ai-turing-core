/**
 * KAFKA CONSUMER V2 - iCattle Dashboard Event Consumer
 * 
 * Consumes events from TuringCore-v3 Kafka topics
 * Validates events using Turing Protocol V2
 * Materializes events into PostgreSQL read models
 * 
 * Architecture: Pure Consumer (Read-Only)
 */

import { Kafka, Consumer, EachMessagePayload, EachBatchPayload } from 'kafkajs';
import { getDb } from '../db';
import type { EventEnvelopeV2 } from './turingProtocolV2';
import { TuringProtocolV2 } from './turingProtocolV2';
import { cattle, clients, lifecycleEvents, valuations, fraudAlerts } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'icattle-dashboard-consumer';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'icattle-dashboard';
const KAFKA_TOPIC_PREFIX = process.env.KAFKA_TOPIC_PREFIX || 'turing';

// Topics to consume from TuringCore-v3
const TOPICS = {
  CATTLE_EVENTS: `${KAFKA_TOPIC_PREFIX}.cattle.events`,
  VALUATIONS: `${KAFKA_TOPIC_PREFIX}.valuations.events`,
  FRAUD: `${KAFKA_TOPIC_PREFIX}.fraud.events`,
  OWNERSHIP: `${KAFKA_TOPIC_PREFIX}.ownership.events`,
  HEALTH: `${KAFKA_TOPIC_PREFIX}.health.events`,
};

// ============================================================================
// KAFKA CLIENT
// ============================================================================

let kafka: Kafka | null = null;
let consumer: Consumer | null = null;
let isConnected = false;

// ============================================================================
// EVENT VALIDATION
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive event validation
 */
async function validateEvent(envelope: EventEnvelopeV2): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Schema validation
    const schemaValidation = await TuringProtocolV2.validateEventEnvelope(envelope);
    if (!schemaValidation.valid) {
      errors.push(...schemaValidation.errors);
    }
    
    // 2. Cryptographic validation (already done in validateEventEnvelope)
    // This includes:
    // - Payload hash verification
    // - Signature verification
    // - Public key matching
    
    // 3. Business logic validation
    if (envelope.metadata.cattle_id <= 0) {
      errors.push('Invalid cattle_id: must be positive integer');
    }
    
    // 4. Provenance warnings
    if (envelope.provenance) {
      if (envelope.provenance.confidence_score < 60) {
        warnings.push(`Low confidence score: ${envelope.provenance.confidence_score}`);
      }
      
      if (envelope.provenance.risk_level === 'HIGH' || envelope.provenance.risk_level === 'CRITICAL') {
        warnings.push(`High risk level: ${envelope.provenance.risk_level}`);
      }
      
      if (envelope.provenance.suspicions && envelope.provenance.suspicions.length > 0) {
        warnings.push(`Fraud suspicions detected: ${envelope.provenance.suspicions.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation exception: ${error}`],
      warnings,
    };
  }
}

// ============================================================================
// IDEMPOTENCY
// ============================================================================

/**
 * Check if event already processed (idempotency)
 */
async function isEventProcessed(idempotency_key: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const result = await db.execute(sql`
      SELECT 1 FROM cattle_events 
      WHERE idempotency_key = ${idempotency_key}
      LIMIT 1
    `);
    
    return result.length > 0;
  } catch (error) {
    console.error('[Consumer] Idempotency check failed:', error);
    return false;
  }
}

// ============================================================================
// EVENT PERSISTENCE
// ============================================================================

/**
 * Store event in immutable event log
 */
async function persistEventToLog(envelope: EventEnvelopeV2): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { metadata, payload, cryptography, provenance } = envelope;
  
  await db.execute(sql`
    INSERT INTO cattle_events (
      event_id,
      event_type,
      event_ref,
      cattle_id,
      occurred_at,
      recorded_at,
      idempotency_key,
      correlation_id,
      causation_id,
      source_system,
      schema_version,
      created_by,
      public_key,
      payload,
      payload_hash,
      signature,
      previous_hash,
      merkle_root,
      confidence_score,
      risk_level
    ) VALUES (
      ${metadata.event_id},
      ${metadata.event_type},
      ${metadata.event_ref},
      ${metadata.cattle_id},
      ${metadata.occurred_at},
      ${metadata.recorded_at},
      ${metadata.idempotency_key},
      ${metadata.correlation_id || null},
      ${metadata.causation_id || null},
      ${metadata.source_system},
      ${metadata.schema_version},
      ${metadata.created_by || null},
      ${metadata.public_key},
      ${JSON.stringify(payload)},
      ${cryptography.payload_hash},
      ${cryptography.signature},
      ${cryptography.previous_hash || null},
      ${cryptography.merkle_root || null},
      ${provenance?.confidence_score || null},
      ${provenance?.risk_level || null}
    )
    ON CONFLICT (idempotency_key) DO NOTHING
  `);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle CATTLE_CREATED event
 */
async function handleCattleCreated(envelope: EventEnvelopeV2): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { metadata, payload, provenance } = envelope;
  
    await db.insert(cattle).values({
    nlisId: payload.nlisId,
    visualId: payload.visualId || null,
    breed: payload.breed,
    sex: payload.sex,
    dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
    cattleType: payload.cattleType || 'beef',
    clientId: payload.clientId,
    currentWeight: payload.currentWeight || null,
    currentValuation: payload.currentValuation || null,
    status: payload.status || 'active',
    healthStatus: payload.healthStatus || 'healthy',
    currentLocation: payload.currentLocation || null,
    // Note: confidenceScore and riskLevel not in cattle table, stored in cattle_events
    createdAt: new Date(metadata.occurred_at),
    updatedAt: new Date(metadata.recorded_at),
  }).onConflictDoNothing();
  
  console.log(`[Handler] Created cattle ${metadata.cattle_id} (${payload.nlisId})`);
}

/**
 * Handle OWNERSHIP_TRANSFER event
 */
async function handleOwnershipTransfer(envelope: EventEnvelopeV2): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { metadata, payload } = envelope;
  
  await db.update(cattle)
    .set({
      clientId: payload.to_client_id,
      updatedAt: new Date(metadata.recorded_at),
    })
    .where(eq(cattle.id, metadata.cattle_id));
  
  // Create lifecycle event
  await db.insert(lifecycleEvents).values({
    cattleId: metadata.cattle_id,
    eventType: 'transfer',
    eventDate: new Date(metadata.occurred_at),
    details: JSON.stringify({
      from_client_id: payload.from_client_id,
      to_client_id: payload.to_client_id,
    }),
    recordedBy: metadata.created_by ? parseInt(metadata.created_by) : null,
  });
  
  console.log(`[Handler] Transferred ownership of cattle ${metadata.cattle_id}`);
}

/**
 * Handle VALUATION_UPDATE event
 */
async function handleValuationUpdate(envelope: EventEnvelopeV2): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { metadata, payload } = envelope;
  
  // Update current valuation
  await db.update(cattle)
    .set({
      currentValuation: payload.new_value,
      updatedAt: new Date(metadata.recorded_at),
    })
    .where(eq(cattle.id, metadata.cattle_id));
  
  // Create valuation record
  await db.insert(valuations).values({
    cattleId: metadata.cattle_id,
    valuationDate: new Date(metadata.occurred_at),
    valuationAmount: payload.new_value,
    method: payload.method || 'market',
    marketPrice: payload.market_price || null,
    weight: payload.weight || null,
    dataSource: payload.data_source || 'TuringCore',
    confidence: payload.confidence || 'medium',
    calculatedBy: metadata.created_by || 'system',
  });
  
  console.log(`[Handler] Updated valuation for cattle ${metadata.cattle_id}: $${payload.new_value / 100}`);
}

/**
 * Handle TAG_CHANGED event
 */
async function handleTagChanged(envelope: EventEnvelopeV2): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { metadata, payload } = envelope;
  
  await db.update(cattle)
    .set({
      nlisId: payload.new_tag,
      updatedAt: new Date(metadata.recorded_at),
    })
    .where(eq(cattle.id, metadata.cattle_id));
  
  // Create lifecycle event
  await db.insert(lifecycleEvents).values({
    cattleId: metadata.cattle_id,
    eventType: 'movement',
    eventDate: new Date(metadata.occurred_at),
    details: JSON.stringify({
      old_tag: payload.old_tag,
      new_tag: payload.new_tag,
      reason: payload.reason,
    }),
    recordedBy: metadata.created_by ? parseInt(metadata.created_by) : null,
    notes: payload.reason || null,
  });
  
  console.log(`[Handler] Changed tag for cattle ${metadata.cattle_id}: ${payload.old_tag} → ${payload.new_tag}`);
}

/**
 * Handle FRAUD_DETECTED event
 */
async function handleFraudDetected(envelope: EventEnvelopeV2): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { metadata, payload, provenance } = envelope;
  
  // Note: Risk level stored in cattle_events and fraud_alerts, not in cattle table
  
  // Create fraud alert
  await db.insert(fraudAlerts).values({
    cattleId: metadata.cattle_id,
    eventId: metadata.event_id,
    suspicionType: payload.suspicion_type,
    severity: payload.severity || 'HIGH',
    description: payload.description || null,
    evidence: payload.evidence ? JSON.stringify(payload.evidence) : null,
    detectedAt: new Date(metadata.occurred_at),
    resolved: false,
  });
  
  console.log(`[Handler] Fraud detected for cattle ${metadata.cattle_id}: ${payload.suspicion_type}`);
}

/**
 * Route event to appropriate handler
 */
async function routeEvent(envelope: EventEnvelopeV2): Promise<void> {
  const { event_type } = envelope.metadata;
  
  switch (event_type) {
    case 'CATTLE_CREATED':
      await handleCattleCreated(envelope);
      break;
    
    case 'OWNERSHIP_TRANSFER':
      await handleOwnershipTransfer(envelope);
      break;
    
    case 'VALUATION_UPDATE':
      await handleValuationUpdate(envelope);
      break;
    
    case 'TAG_CHANGED':
      await handleTagChanged(envelope);
      break;
    
    case 'FRAUD_DETECTED':
      await handleFraudDetected(envelope);
      break;
    
    default:
      console.warn(`[Handler] Unknown event type: ${event_type}`);
  }
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

/**
 * Process a single event
 */
async function processEvent(envelope: EventEnvelopeV2): Promise<void> {
  const { metadata } = envelope;
  
  // 1. Validate event
  const validation = await validateEvent(envelope);
  
  if (!validation.valid) {
    console.error('[Consumer] Event validation failed:', {
      event_id: metadata.event_id,
      errors: validation.errors,
    });
    throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('[Consumer] Event warnings:', {
      event_id: metadata.event_id,
      warnings: validation.warnings,
    });
  }
  
  // 2. Check idempotency
  const already_processed = await isEventProcessed(metadata.idempotency_key);
  if (already_processed) {
    console.log('[Consumer] Event already processed (idempotent):', metadata.event_id);
    return;
  }
  
  // 3. Persist to event log
  await persistEventToLog(envelope);
  
  // 4. Route to handler (materialize to read model)
  await routeEvent(envelope);
  
  console.log('[Consumer] Event processed successfully:', {
    event_id: metadata.event_id,
    event_type: metadata.event_type,
    cattle_id: metadata.cattle_id,
  });
}

/**
 * Handle incoming Kafka message
 */
async function handleMessage(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;
  
  try {
    // Parse event envelope
    const envelope: EventEnvelopeV2 = JSON.parse(message.value!.toString());
    
    console.log('[Consumer] Received event:', {
      topic,
      partition,
      offset: message.offset,
      event_id: envelope.metadata.event_id,
      event_type: envelope.metadata.event_type,
    });
    
    // Process event
    await processEvent(envelope);
  } catch (error) {
    console.error('[Consumer] Failed to process message:', error);
    // TODO: Send to dead letter queue
    throw error;
  }
}

// ============================================================================
// CONSUMER LIFECYCLE
// ============================================================================

/**
 * Initialize Kafka consumer
 */
export async function initKafkaConsumer(): Promise<void> {
  if (consumer && isConnected) {
    console.log('[Kafka] Consumer already connected');
    return;
  }
  
  try {
    kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS,
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });
    
    consumer = kafka.consumer({
      groupId: KAFKA_GROUP_ID,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
    });
    
    await consumer.connect();
    isConnected = true;
    
    // Subscribe to all topics
    const topics = Object.values(TOPICS);
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`[Kafka] Subscribed to ${topic}`);
    }
    
    // Start consuming
    await consumer.run({
      eachMessage: handleMessage,
    });
    
    console.log('[Kafka] Consumer started processing events');
  } catch (error) {
    console.error('[Kafka] Failed to initialize consumer:', error);
    throw error;
  }
}

/**
 * Disconnect Kafka consumer
 */
export async function disconnectKafkaConsumer(): Promise<void> {
  if (consumer && isConnected) {
    await consumer.disconnect();
    isConnected = false;
    console.log('[Kafka] Consumer disconnected');
  }
}

// ============================================================================
// EVENT REPLAY
// ============================================================================

/**
 * Replay events from beginning (rebuild state)
 */
export async function replayEvents(options?: {
  fromBeginning?: boolean;
  topic?: string;
  clearState?: boolean;
}): Promise<void> {
  const {
    fromBeginning = true,
    topic = TOPICS.CATTLE_EVENTS,
    clearState = false,
  } = options || {};
  
  console.log('[Replay] Starting event replay...', { fromBeginning, topic, clearState });
  
  // Create replay consumer
  const replayConsumer = kafka!.consumer({
    groupId: `${KAFKA_GROUP_ID}-replay-${Date.now()}`,
  });
  
  await replayConsumer.connect();
  await replayConsumer.subscribe({ topic, fromBeginning });
  
  // Clear state if requested
  if (clearState) {
    const db = await getDb();
    if (db) {
      console.log('[Replay] Clearing existing state...');
      await db.delete(cattle);
      await db.delete(lifecycleEvents);
      await db.delete(valuations);
      await db.delete(fraudAlerts);
      await db.execute(sql`DELETE FROM cattle_events`);
      console.log('[Replay] State cleared');
    }
  }
  
  let processedCount = 0;
  let errorCount = 0;
  
  await replayConsumer.run({
    eachMessage: async (payload) => {
      try {
        await handleMessage(payload);
        processedCount++;
        
        if (processedCount % 100 === 0) {
          console.log(`[Replay] Processed ${processedCount} events...`);
        }
      } catch (error) {
        errorCount++;
        console.error('[Replay] Error processing event:', error);
      }
    },
  });
  
  console.log('[Replay] Event replay completed', {
    processed: processedCount,
    errors: errorCount,
  });
  
  await replayConsumer.disconnect();
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('[Consumer] SIGTERM received, shutting down gracefully...');
  await disconnectKafkaConsumer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Consumer] SIGINT received, shutting down gracefully...');
  await disconnectKafkaConsumer();
  process.exit(0);
});

// ============================================================================
// EXPORTS
// ============================================================================

export const KafkaConsumerV2 = {
  init: initKafkaConsumer,
  disconnect: disconnectKafkaConsumer,
  replayEvents,
};
