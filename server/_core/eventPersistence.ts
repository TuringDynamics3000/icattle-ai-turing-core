/**
 * TURING PROTOCOL - EVENT PERSISTENCE LAYER
 * 
 * Enforces protocol compliance and persists events to cattle_events table.
 * This is the imperative shell that wraps the functional core.
 * 
 * CRITICAL: All cattle operations MUST go through this layer.
 */

import { db } from '../db';
import { cattleEvents } from '../../drizzle/schema';
import { TuringProtocol, EventEnvelope } from './turingProtocol';
import { enforceOnCreation, ProtocolEnforcementResult } from './protocolEnforcement';
import { KafkaProducer } from './kafkaProducer';

export interface EventPersistenceResult {
  success: boolean;
  event_id?: string;
  seq_id?: number;
  violations?: any[];
  error?: string;
}

/**
 * Persist event to database with protocol enforcement
 * This is the ONLY way events should be written to cattle_events
 */
export async function persistEvent<T>(
  envelope: EventEnvelope<T>
): Promise<EventPersistenceResult> {
  try {
    // 1. Enforce Turing Protocol BEFORE persistence
    const enforcement = enforceOnCreation(envelope);
    
    if (!enforcement.is_valid) {
      console.error('[EventPersistence] Protocol violation detected:', enforcement.violations);
      return {
        success: false,
        violations: enforcement.violations,
        error: 'Protocol enforcement failed',
      };
    }

    // 2. Persist to database (immutable append-only)
    const [inserted] = await db.insert(cattleEvents).values({
      eventId: envelope.metadata.event_id,
      eventType: envelope.metadata.event_type,
      eventRef: envelope.metadata.event_ref,
      cattleId: envelope.metadata.cattle_id,
      occurredAt: new Date(envelope.metadata.occurred_at),
      recordedAt: new Date(envelope.metadata.recorded_at),
      idempotencyKey: envelope.metadata.idempotency_key,
      correlationId: envelope.metadata.correlation_id,
      causationId: envelope.metadata.causation_id,
      payloadHash: envelope.payload_hash,
      previousHash: envelope.previous_hash,
      payloadJson: envelope.payload,
      sourceSystem: envelope.metadata.source_system,
      schemaVersion: envelope.metadata.schema_version,
      createdBy: envelope.metadata.created_by,
    }).returning({ eventId: cattleEvents.eventId });

    // 3. Publish to Kafka for async consumers (best effort)
    try {
      await KafkaProducer.publishEvent(envelope);
    } catch (kafkaError) {
      console.warn('[EventPersistence] Kafka publish failed (non-fatal):', kafkaError);
      // Don't fail the operation - database is source of truth
    }

    return {
      success: true,
      event_id: inserted.eventId,
    };
  } catch (error: any) {
    console.error('[EventPersistence] Failed to persist event:', error);
    
    // Check for idempotency key violation (duplicate event)
    if (error.code === '23505' && error.constraint === 'cattle_events_idempotency_key_unique') {
      return {
        success: false,
        error: 'Duplicate event (idempotency key already exists)',
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown persistence error',
    };
  }
}

/**
 * Persist multiple events in a batch
 * Ensures atomic write - all or nothing
 */
export async function persistEventBatch<T>(
  envelopes: EventEnvelope<T>[]
): Promise<{
  success: boolean;
  persisted_count: number;
  failed_count: number;
  violations: any[];
  errors: string[];
}> {
  const violations: any[] = [];
  const errors: string[] = [];
  let persisted_count = 0;
  let failed_count = 0;

  // Enforce protocol on all events first
  for (const envelope of envelopes) {
    const enforcement = enforceOnCreation(envelope);
    if (!enforcement.is_valid) {
      violations.push(...enforcement.violations);
      failed_count++;
    }
  }

  // If any violations, reject entire batch (atomic)
  if (violations.length > 0) {
    return {
      success: false,
      persisted_count: 0,
      failed_count: envelopes.length,
      violations,
      errors: ['Protocol violations detected in batch'],
    };
  }

  // Persist all events in transaction
  try {
    const values = envelopes.map(envelope => ({
      eventId: envelope.metadata.event_id,
      eventType: envelope.metadata.event_type,
      eventRef: envelope.metadata.event_ref,
      cattleId: envelope.metadata.cattle_id,
      occurredAt: new Date(envelope.metadata.occurred_at),
      recordedAt: new Date(envelope.metadata.recorded_at),
      idempotencyKey: envelope.metadata.idempotency_key,
      correlationId: envelope.metadata.correlation_id,
      causationId: envelope.metadata.causation_id,
      payloadHash: envelope.payload_hash,
      previousHash: envelope.previous_hash,
      payloadJson: envelope.payload,
      sourceSystem: envelope.metadata.source_system,
      schemaVersion: envelope.metadata.schema_version,
      createdBy: envelope.metadata.created_by,
    }));

    await db.insert(cattleEvents).values(values);
    persisted_count = envelopes.length;

    // Publish to Kafka (best effort)
    try {
      await KafkaProducer.publishBatch(envelopes as any);
    } catch (kafkaError) {
      console.warn('[EventPersistence] Kafka batch publish failed (non-fatal):', kafkaError);
    }

    return {
      success: true,
      persisted_count,
      failed_count: 0,
      violations: [],
      errors: [],
    };
  } catch (error: any) {
    console.error('[EventPersistence] Batch persistence failed:', error);
    return {
      success: false,
      persisted_count: 0,
      failed_count: envelopes.length,
      violations: [],
      errors: [error.message || 'Batch persistence failed'],
    };
  }
}

/**
 * Get event chain for a cattle (for replay/verification)
 */
export async function getEventChain(cattle_id: number): Promise<EventEnvelope<any>[]> {
  const events = await db
    .select()
    .from(cattleEvents)
    .where(eq(cattleEvents.cattleId, cattle_id))
    .orderBy(asc(cattleEvents.occurredAt));

  return events.map(event => ({
    metadata: {
      event_id: event.eventId,
      event_type: event.eventType as any,
      event_ref: event.eventRef,
      cattle_id: event.cattleId,
      occurred_at: event.occurredAt.toISOString(),
      recorded_at: event.recordedAt.toISOString(),
      idempotency_key: event.idempotencyKey,
      correlation_id: event.correlationId || undefined,
      causation_id: event.causationId || undefined,
      source_system: event.sourceSystem as any,
      schema_version: event.schemaVersion,
      created_by: event.createdBy || undefined,
    },
    payload: event.payloadJson,
    payload_hash: event.payloadHash,
    previous_hash: event.previousHash || undefined,
  }));
}

/**
 * Verify event chain integrity for a cattle
 */
export async function verifyEventChainIntegrity(cattle_id: number): Promise<{
  is_valid: boolean;
  total_events: number;
  violations: any[];
}> {
  const events = await getEventChain(cattle_id);
  
  if (events.length === 0) {
    return {
      is_valid: true,
      total_events: 0,
      violations: [],
    };
  }

  const { enforceOnChain } = await import('./protocolEnforcement');
  const result = enforceOnChain(events);

  return {
    is_valid: result.is_valid,
    total_events: events.length,
    violations: result.violations,
  };
}

/**
 * Get recent events across all cattle (for dashboard)
 */
export async function getRecentEvents(limit: number = 10): Promise<EventEnvelope<any>[]> {
  const events = await db
    .select()
    .from(cattleEvents)
    .orderBy(desc(cattleEvents.occurredAt))
    .limit(limit);

  return events.map(event => ({
    metadata: {
      event_id: event.eventId,
      event_type: event.eventType as any,
      event_ref: event.eventRef,
      cattle_id: event.cattleId,
      occurred_at: event.occurredAt.toISOString(),
      recorded_at: event.recordedAt.toISOString(),
      idempotency_key: event.idempotencyKey,
      correlation_id: event.correlationId || undefined,
      causation_id: event.causationId || undefined,
      source_system: event.sourceSystem as any,
      schema_version: event.schemaVersion,
      created_by: event.createdBy || undefined,
    },
    payload: event.payloadJson,
    payload_hash: event.payloadHash,
    previous_hash: event.previousHash || undefined,
  }));
}

// Import missing functions
import { eq, asc, desc } from 'drizzle-orm';
