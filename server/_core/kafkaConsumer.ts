/**
 * TURING PROTOCOL - KAFKA CONSUMER (IMPERATIVE SHELL)
 * 
 * Consumes events from Kafka and persists to PostgreSQL Golden Record
 * Uses functional core (turingProtocol.ts) for validation
 * 
 * Architecture: Functional Core, Imperative Shell
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import type { EventEnvelope } from './turingProtocol';
import { TuringProtocol } from './turingProtocol';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9093'];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'icattle-consumer';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'icattle-event-processor';
const KAFKA_TOPIC_PREFIX = process.env.KAFKA_TOPIC_PREFIX || 'icattle';

// ============================================================================
// KAFKA CLIENT
// ============================================================================

let kafka: Kafka | null = null;
let consumer: Consumer | null = null;
let isConnected = false;

// ============================================================================
// EVENT PERSISTENCE (Database I/O - Imperative Shell)
// ============================================================================

/**
 * Persist event to PostgreSQL (side effect)
 * This would use webdev_execute_sql or a proper database client
 */
async function persistEventToDatabase(envelope: EventEnvelope): Promise<void> {
  // TODO: Implement actual database persistence
  // For now, log the event
  console.log('[DB] Persisting event to PostgreSQL:', {
    event_id: envelope.metadata.event_id,
    event_type: envelope.metadata.event_type,
    cattle_id: envelope.metadata.cattle_id,
    payload_hash: envelope.payload_hash,
  });

  // In production, this would be:
  // await db.execute(`
  //   INSERT INTO cattle_events (
  //     event_id, seq_id, occurred_at, recorded_at,
  //     event_type, event_ref, cattle_id,
  //     idempotency_key, correlation_id, causation_id,
  //     payload_hash, previous_hash, payload_json,
  //     source_system, schema_version, created_by
  //   ) VALUES (...)
  // `, envelope);
}

/**
 * Check if event already processed (idempotency check)
 */
async function isEventProcessed(idempotency_key: string): Promise<boolean> {
  // TODO: Implement actual database check
  // For now, return false (always process)
  return false;

  // In production:
  // const result = await db.execute(`
  //   SELECT 1 FROM cattle_events WHERE idempotency_key = ?
  // `, [idempotency_key]);
  // return result.length > 0;
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

/**
 * Process a single event (uses functional core for validation)
 */
async function processEvent(envelope: EventEnvelope): Promise<void> {
  // Validate event integrity (functional core)
  const validation_errors = TuringProtocol.validateEventEnvelope(envelope);
  if (validation_errors.length > 0) {
    console.error('[Consumer] Event validation failed:', validation_errors);
    throw new Error(`Event validation failed: ${JSON.stringify(validation_errors)}`);
  }

  // Verify hash integrity (functional core)
  if (!TuringProtocol.verifyEventIntegrity(envelope)) {
    console.error('[Consumer] Event integrity check failed - possible tampering');
    throw new Error('Event integrity check failed');
  }

  // Check idempotency (imperative shell)
  const already_processed = await isEventProcessed(envelope.metadata.idempotency_key);
  if (already_processed) {
    console.log('[Consumer] Event already processed (idempotency):', envelope.metadata.event_id);
    return;
  }

  // Persist to database (imperative shell)
  await persistEventToDatabase(envelope);

  console.log('[Consumer] Event processed successfully:', {
    event_id: envelope.metadata.event_id,
    event_type: envelope.metadata.event_type,
    cattle_id: envelope.metadata.cattle_id,
  });
}

/**
 * Handle incoming Kafka message
 */
async function handleMessage(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;

  try {
    // Parse event envelope
    const envelope: EventEnvelope = JSON.parse(message.value!.toString());

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
    // In production, send to dead letter queue
    throw error;
  }
}

// ============================================================================
// CONSUMER LIFECYCLE
// ============================================================================

/**
 * Initialize Kafka consumer (side effect)
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
    });

    await consumer.connect();
    isConnected = true;

    // Subscribe to cattle events topic
    const topic = `${KAFKA_TOPIC_PREFIX}.cattle.events`;
    await consumer.subscribe({ topic, fromBeginning: false });

    console.log(`[Kafka] Consumer connected and subscribed to ${topic}`);

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
 * Disconnect Kafka consumer (side effect)
 */
export async function disconnectKafkaConsumer(): Promise<void> {
  if (consumer && isConnected) {
    await consumer.disconnect();
    isConnected = false;
    console.log('[Kafka] Consumer disconnected');
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handle graceful shutdown
 */
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

export const KafkaConsumer = {
  init: initKafkaConsumer,
  disconnect: disconnectKafkaConsumer,
};
