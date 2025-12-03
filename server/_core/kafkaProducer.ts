/**
 * TURING PROTOCOL - KAFKA PRODUCER (IMPERATIVE SHELL)
 * 
 * Side effects isolated: Kafka event streaming
 * Uses functional core (turingProtocol.ts) for business logic
 * 
 * Architecture: Functional Core, Imperative Shell
 */

import { Kafka, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import type { EventEnvelope, EventType } from './turingProtocol';
import { TuringProtocol } from './turingProtocol';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9093'];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'icattle-producer';
const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== 'false'; // Allow disabling Kafka for testing
const KAFKA_TOPIC_PREFIX = process.env.KAFKA_TOPIC_PREFIX || 'icattle';

// ============================================================================
// KAFKA CLIENT
// ============================================================================

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let isConnected = false;

/**
 * Initialize Kafka producer (side effect)
 */
export async function initKafkaProducer(): Promise<void> {
  if (producer && isConnected) {
    console.log('[Kafka] Producer already connected');
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

    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });

    await producer.connect();
    isConnected = true;
    console.log(`[Kafka] Producer connected to ${KAFKA_BROKERS.join(', ')}`);
  } catch (error) {
    console.error('[Kafka] Failed to initialize producer:', error);
    throw error;
  }
}

/**
 * Disconnect Kafka producer (side effect)
 */
export async function disconnectKafkaProducer(): Promise<void> {
  if (producer && isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('[Kafka] Producer disconnected');
  }
}

// ============================================================================
// EVENT PUBLISHING
// ============================================================================

/**
 * Publish event to Kafka (side effect)
 * Uses functional core for event creation and validation
 */
export async function publishCattleEvent<T = any>(params: {
  event_type: EventType;
  event_ref: string;
  cattle_id: number;
  payload: T;
  occurred_at?: Date;
  correlation_id?: string;
  causation_id?: string;
  created_by?: string;
}): Promise<RecordMetadata[]> {
  // Ensure producer is connected
  if (!producer || !isConnected) {
    await initKafkaProducer();
  }

  // Generate idempotency key (functional core)
  const idempotency_key = TuringProtocol.generateIdempotencyKey(
    params.event_type,
    params.cattle_id,
    params.event_ref
  );

  // Create event metadata (functional core)
  const metadata = TuringProtocol.createEventMetadata({
    event_type: params.event_type,
    event_ref: params.event_ref,
    cattle_id: params.cattle_id,
    occurred_at: params.occurred_at,
    idempotency_key,
    correlation_id: params.correlation_id,
    causation_id: params.causation_id,
    source_system: 'iCattle',
    created_by: params.created_by,
  });

  // Create event envelope (functional core)
  const envelope = TuringProtocol.createEventEnvelope(metadata, params.payload);

  // Validate event (functional core)
  const validation_errors = TuringProtocol.validateEventEnvelope(envelope);
  if (validation_errors.length > 0) {
    throw new Error(`Event validation failed: ${JSON.stringify(validation_errors)}`);
  }

  // Publish to Kafka (imperative shell - side effect)
  const topic = `${KAFKA_TOPIC_PREFIX}.cattle.events`;
  const key = `cattle-${params.cattle_id}`;
  const value = JSON.stringify(envelope);

  try {
    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key,
          value,
          headers: {
            event_type: params.event_type,
            event_id: metadata.event_id,
            idempotency_key,
          },
        },
      ],
    };

    const metadata_result = await producer!.send(record);
    
    console.log(`[Kafka] Published event ${metadata.event_id} to ${topic}`, {
      event_type: params.event_type,
      cattle_id: params.cattle_id,
      partition: metadata_result[0].partition,
      offset: metadata_result[0].offset,
    });

    return metadata_result;
  } catch (error) {
    console.error('[Kafka] Failed to publish event:', error);
    throw error;
  }
}

/**
 * Publish batch of events to Kafka (side effect)
 */
export async function publishCattleEventBatch(
  events: Array<{
    event_type: EventType;
    event_ref: string;
    cattle_id: number;
    payload: any;
    occurred_at?: Date;
    correlation_id?: string;
    causation_id?: string;
    created_by?: string;
  }>
): Promise<RecordMetadata[]> {
  // Ensure producer is connected
  if (!producer || !isConnected) {
    await initKafkaProducer();
  }

  const topic = `${KAFKA_TOPIC_PREFIX}.cattle.events`;
  const messages = [];

  // Create envelopes for all events (functional core)
  for (const event of events) {
    const idempotency_key = TuringProtocol.generateIdempotencyKey(
      event.event_type,
      event.cattle_id,
      event.event_ref
    );

    const metadata = TuringProtocol.createEventMetadata({
      event_type: event.event_type,
      event_ref: event.event_ref,
      cattle_id: event.cattle_id,
      occurred_at: event.occurred_at,
      idempotency_key,
      correlation_id: event.correlation_id,
      causation_id: event.causation_id,
      source_system: 'iCattle',
      created_by: event.created_by,
    });

    const envelope = TuringProtocol.createEventEnvelope(metadata, event.payload);

    // Validate
    const validation_errors = TuringProtocol.validateEventEnvelope(envelope);
    if (validation_errors.length > 0) {
      throw new Error(`Event validation failed: ${JSON.stringify(validation_errors)}`);
    }

    messages.push({
      key: `cattle-${event.cattle_id}`,
      value: JSON.stringify(envelope),
      headers: {
        event_type: event.event_type,
        event_id: metadata.event_id,
        idempotency_key,
      },
    });
  }

  // Publish batch to Kafka (imperative shell - side effect)
  try {
    const metadata_result = await producer!.send({
      topic,
      messages,
    });

    console.log(`[Kafka] Published ${messages.length} events to ${topic}`);
    return metadata_result;
  } catch (error) {
    console.error('[Kafka] Failed to publish batch:', error);
    throw error;
  }
}

// ============================================================================
// HELPER: Publish specific event types
// ============================================================================

export async function publishCattleCreated(cattle_id: number, payload: any, created_by?: string) {
  return publishCattleEvent({
    event_type: 'CATTLE_CREATED',
    event_ref: `cattle-created-${cattle_id}`,
    cattle_id,
    payload,
    created_by,
  });
}

export async function publishOwnershipTransfer(
  cattle_id: number,
  from_client_id: number,
  to_client_id: number,
  created_by?: string
) {
  return publishCattleEvent({
    event_type: 'OWNERSHIP_TRANSFER',
    event_ref: `ownership-${cattle_id}-${Date.now()}`,
    cattle_id,
    payload: { from_client_id, to_client_id, transferred_at: new Date().toISOString() },
    created_by,
  });
}

export async function publishTagChanged(
  cattle_id: number,
  old_tag: string,
  new_tag: string,
  reason?: string,
  created_by?: string
) {
  return publishCattleEvent({
    event_type: 'TAG_CHANGED',
    event_ref: `tag-change-${cattle_id}-${Date.now()}`,
    cattle_id,
    payload: { old_tag, new_tag, reason, changed_at: new Date().toISOString() },
    created_by,
  });
}

export async function publishValuationUpdate(
  cattle_id: number,
  old_value: number,
  new_value: number,
  reason?: string,
  created_by?: string
) {
  return publishCattleEvent({
    event_type: 'VALUATION_UPDATE',
    event_ref: `valuation-${cattle_id}-${Date.now()}`,
    cattle_id,
    payload: { old_value, new_value, reason, updated_at: new Date().toISOString() },
    created_by,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const KafkaProducer = {
  init: initKafkaProducer,
  disconnect: disconnectKafkaProducer,
  publishEvent: publishCattleEvent,
  publishBatch: publishCattleEventBatch,
  publishCattleCreated,
  publishOwnershipTransfer,
  publishTagChanged,
  publishValuationUpdate,
};
