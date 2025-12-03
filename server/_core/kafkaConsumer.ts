/**
 * TURING PROTOCOL - KAFKA CONSUMER (IMPERATIVE SHELL)
 * 
 * Consumes events from Kafka and persists to PostgreSQL Golden Record
 * Uses functional core (turingProtocol.ts) for validation
 * 
 * Architecture: Functional Core, Imperative Shell
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { Pool } from 'pg';
import type { EventEnvelope } from './turingProtocol';
import { TuringProtocol } from './turingProtocol';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'icattle-consumer';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'icattle-event-processor';
const KAFKA_TOPIC_PREFIX = process.env.KAFKA_TOPIC_PREFIX || 'icattle';

const GOLDEN_RECORD_DB_URL = process.env.GOLDEN_RECORD_DATABASE_URL || 
  'postgresql://icattle:icattle_dev_password@localhost:5432/icattle_golden_record';

// ============================================================================
// KAFKA CLIENT
// ============================================================================

let kafka: Kafka | null = null;
let consumer: Consumer | null = null;
let isConnected = false;

// PostgreSQL connection pool
let pgPool: Pool | null = null;

function getPostgresPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: GOLDEN_RECORD_DB_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pgPool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client', err);
    });
  }
  return pgPool;
}

// ============================================================================
// EVENT PERSISTENCE (Database I/O - Imperative Shell)
// ============================================================================

/**
 * Persist event to PostgreSQL Golden Record database (side effect)
 */
async function persistEventToDatabase(envelope: EventEnvelope): Promise<void> {
  const pool = getPostgresPool();
  const { metadata, payload, payload_hash, previous_hash } = envelope;

  const query = `
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
      payload,
      payload_hash,
      previous_hash
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING event_id;
  `;

  const values = [
    metadata.event_id,
    metadata.event_type,
    metadata.event_ref,
    metadata.cattle_id,
    metadata.occurred_at,
    metadata.recorded_at,
    metadata.idempotency_key,
    metadata.correlation_id || null,
    metadata.causation_id || null,
    metadata.source_system,
    metadata.schema_version,
    metadata.created_by || null,
    JSON.stringify(payload),
    payload_hash,
    previous_hash || null,
  ];

  try {
    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) {
      console.log(`[Golden Record] Event ${metadata.event_id} already exists (idempotency)`);
    } else {
      console.log(`[Golden Record] Persisted event ${metadata.event_id}`);
    }
  } catch (error) {
    console.error('[Golden Record] Failed to persist event:', error);
    throw error;
  }
}

/**
 * Check if event already processed (idempotency check)
 */
async function isEventProcessed(idempotency_key: string): Promise<boolean> {
  const pool = getPostgresPool();
  
  try {
    const result = await pool.query(
      'SELECT 1 FROM cattle_events WHERE idempotency_key = $1',
      [idempotency_key]
    );
    return result.rowCount! > 0;
  } catch (error) {
    console.error('[Golden Record] Failed to check idempotency:', error);
    return false;
  }
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

  if (pgPool) {
    await pgPool.end();
    pgPool = null;
    console.log('[PostgreSQL] Connection pool closed');
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

/**
 * Get audit trail for a cattle from Golden Record database
 */
export async function getCattleAuditTrail(cattleId: number): Promise<any[]> {
  const pool = getPostgresPool();

  const query = `
    SELECT * FROM get_cattle_audit_trail($1);
  `;

  try {
    const result = await pool.query(query, [cattleId]);
    return result.rows;
  } catch (error) {
    console.error('[Golden Record] Failed to get audit trail:', error);
    throw error;
  }
}

/**
 * Refresh the Golden Record materialized view
 */
export async function refreshGoldenRecord(): Promise<void> {
  const pool = getPostgresPool();

  try {
    await pool.query('SELECT refresh_golden_record();');
    console.log('[Golden Record] Materialized view refreshed');
  } catch (error) {
    console.error('[Golden Record] Failed to refresh materialized view:', error);
    throw error;
  }
}

export const KafkaConsumer = {
  init: initKafkaConsumer,
  disconnect: disconnectKafkaConsumer,
  getCattleAuditTrail,
  refreshGoldenRecord,
};
