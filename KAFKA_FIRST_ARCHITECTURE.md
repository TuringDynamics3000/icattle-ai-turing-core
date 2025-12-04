# Kafka-First Event Sourcing Architecture

## Design Principles

### 1. Single Source of Truth
**Kafka is the ONLY source of truth. PostgreSQL is a materialized view.**

```
Commands → Events → Kafka → Consumers → PostgreSQL
                      ↑
                  Source of Truth
```

### 2. Event-Driven
**All state changes are events. No direct database writes.**

```
❌ BAD:  API → PostgreSQL (direct write)
✅ GOOD: API → Kafka → Consumer → PostgreSQL
```

### 3. CQRS (Command Query Responsibility Segregation)
**Separate write model (events) from read models (projections).**

```
Write Side:  Commands → Events → Kafka
Read Side:   Kafka → Projections → PostgreSQL/Redis/Elasticsearch
```

### 4. Event Replay
**Can rebuild entire system state from event log.**

```
Kafka (t=0 to t=now) → Replay → New State
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMMAND SIDE                             │
│                                                                   │
│  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Client    │─────▶│  API Router  │─────▶│   Command    │   │
│  │  (Browser)  │      │   (tRPC)     │      │   Handler    │   │
│  └─────────────┘      └──────────────┘      └──────┬───────┘   │
│                                                      │           │
│                                                      ▼           │
│                                            ┌──────────────────┐ │
│                                            │ Turing Protocol  │ │
│                                            │ (Event Creation) │ │
│                                            └────────┬─────────┘ │
│                                                     │           │
│                                                     ▼           │
│                                            ┌──────────────────┐ │
│                                            │ Kafka Producer   │ │
│                                            │ (Publish Event)  │ │
│                                            └────────┬─────────┘ │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EVENT LOG                                │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    KAFKA TOPICS                            │  │
│  │                                                             │  │
│  │  • icattle.cattle.events        (All cattle events)       │  │
│  │  • icattle.valuations.events    (Valuation updates)       │  │
│  │  • icattle.fraud.events         (Fraud detections)        │  │
│  │  • icattle.ownership.events     (Ownership transfers)     │  │
│  │  • icattle.health.events        (Health records)          │  │
│  │                                                             │  │
│  │  Retention: Infinite (Compacted for snapshots)            │  │
│  │  Partitions: By cattle_id for ordering                    │  │
│  │  Replication: 3x for durability                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         QUERY SIDE                               │
│                                                                   │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────┐ │
│  │  Kafka Consumer  │   │  Kafka Consumer  │   │   Kafka     │ │
│  │  (Golden Record) │   │  (Fraud View)    │   │  Consumer   │ │
│  └────────┬─────────┘   └────────┬─────────┘   │  (Audit)    │ │
│           │                      │              └──────┬──────┘ │
│           ▼                      ▼                     ▼        │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────┐ │
│  │   PostgreSQL     │   │   PostgreSQL     │   │    S3       │ │
│  │ (Golden Record)  │   │  (Fraud View)    │   │ (Audit Log) │ │
│  │                  │   │                  │   │             │ │
│  │ • cattle         │   │ • fraud_alerts   │   │ • events/   │ │
│  │ • clients        │   │ • risk_scores    │   │   YYYY/MM/  │ │
│  │ • valuations     │   │ • suspicions     │   │   DD/       │ │
│  └──────────────────┘   └──────────────────┘   └─────────────┘ │
│                                                                   │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │  Kafka Consumer  │   │  Kafka Consumer  │                    │
│  │  (Cache View)    │   │  (Search View)   │                    │
│  └────────┬─────────┘   └────────┬─────────┘                    │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │      Redis       │   │  Elasticsearch   │                    │
│  │  (Fast Lookup)   │   │  (Full-Text)     │                    │
│  └──────────────────┘   └──────────────────┘                    │
│                                                                   │
│  ┌─────────────┐                                                 │
│  │   Client    │◀───── Query read models                        │
│  │  (Browser)  │                                                 │
│  └─────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Event Topics

### Topic Strategy

**Topic per Aggregate:**
```
icattle.cattle.events        - All cattle lifecycle events
icattle.valuations.events    - Valuation updates
icattle.fraud.events         - Fraud detections
icattle.ownership.events     - Ownership transfers
icattle.health.events        - Health records
```

**Partitioning:**
- Key: `cattle-{id}` for ordering guarantees
- Partitions: 12 (scalable to 1M cattle)

**Retention:**
- Infinite retention (event log is permanent)
- Log compaction for snapshots
- Archive to S3 after 1 year

**Replication:**
- 3x replication for durability
- Min in-sync replicas: 2

## Event Schema

### Enhanced Event Envelope

```typescript
interface EventEnvelope<T = any> {
  // Metadata
  metadata: {
    event_id: string;              // evt_abc123
    event_type: EventType;         // CATTLE_CREATED
    event_ref: string;             // Business reference
    cattle_id: number;             // Subject
    occurred_at: string;           // ISO 8601
    recorded_at: string;           // ISO 8601
    idempotency_key: string;       // SHA-256
    correlation_id?: string;       // Links related events
    causation_id?: string;         // Cause-effect chain
    source_system: SourceSystem;   // iCattle, NLIS, GPS, etc.
    schema_version: number;        // Event schema version
    created_by?: string;           // User ID
  };
  
  // Payload
  payload: T;                      // Event-specific data
  
  // Cryptography (NEW)
  cryptography: {
    payload_hash: string;          // SHA-256 of payload
    previous_hash?: string;        // Links to previous event
    signature: string;             // EdDSA signature (NEW)
    public_key: string;            // Creator's public key (NEW)
    merkle_root?: string;          // Merkle tree root (NEW)
    timestamp_proof?: string;      // RFC 3161 timestamp (NEW)
  };
  
  // Provenance (NEW)
  provenance?: {
    confidence_score: number;      // 0-100
    risk_level: RiskLevel;         // LOW, MEDIUM, HIGH, CRITICAL
    verifications: string[];       // NLIS, Photo, GPS, Biometric, DNA
    suspicions: SuspicionType[];   // Fraud flags
  };
}
```

## Command Handlers

### Command → Event Flow

```typescript
// 1. Client sends command
const command = {
  type: 'CREATE_CATTLE',
  data: { nlisId, breed, sex, clientId, ... }
};

// 2. Command handler validates
const validationResult = validateCreateCattleCommand(command);
if (!validationResult.isValid) {
  throw new ValidationError(validationResult.errors);
}

// 3. Create event (functional core)
const event = TuringProtocol.createCompleteEventEnvelope({
  event_type: 'CATTLE_CREATED',
  event_ref: `cattle-created-${Date.now()}`,
  cattle_id: newCattleId,
  payload: command.data,
  created_by: userId,
});

// 4. Sign event (NEW)
const signedEvent = await TuringProtocol.signEvent(event, privateKey);

// 5. Publish to Kafka
await KafkaProducer.publishEvent(signedEvent);

// 6. Return acknowledgment (NOT the result)
return {
  event_id: event.metadata.event_id,
  status: 'PUBLISHED',
  message: 'Event published to Kafka. Check event stream for result.'
};
```

### No Direct Database Writes

```typescript
// ❌ BAD: Direct database write
await db.insert(cattle).values(newCattle);

// ✅ GOOD: Publish event, let consumer handle it
await KafkaProducer.publishCattleCreated(newCattle);
```

## Read Models (Projections)

### 1. Golden Record (PostgreSQL)

**Purpose:** Primary read model for cattle data

**Schema:**
```sql
-- Materialized view of current cattle state
CREATE TABLE cattle (
  id SERIAL PRIMARY KEY,
  nlis_id VARCHAR(16) UNIQUE,
  breed VARCHAR(100),
  sex VARCHAR(10),
  client_id INTEGER,
  current_valuation INTEGER,
  status VARCHAR(20),
  -- Provenance
  confidence_score INTEGER,
  risk_level VARCHAR(20),
  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Event log (immutable)
CREATE TABLE cattle_events (
  event_id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(50),
  cattle_id INTEGER,
  occurred_at TIMESTAMP,
  payload JSONB,
  payload_hash VARCHAR(64),
  signature VARCHAR(128),
  public_key VARCHAR(64),
  -- Indexes
  INDEX idx_cattle_id (cattle_id),
  INDEX idx_occurred_at (occurred_at),
  INDEX idx_event_type (event_type)
);
```

**Consumer:**
```typescript
// Consume events and update cattle table
async function handleCattleCreated(event: EventEnvelope) {
  await db.insert(cattle).values({
    id: event.metadata.cattle_id,
    nlis_id: event.payload.nlisId,
    breed: event.payload.breed,
    sex: event.payload.sex,
    client_id: event.payload.clientId,
    created_at: event.metadata.occurred_at,
  });
}

async function handleOwnershipTransfer(event: EventEnvelope) {
  await db.update(cattle)
    .set({ client_id: event.payload.to_client_id })
    .where(eq(cattle.id, event.metadata.cattle_id));
}
```

### 2. Fraud View (PostgreSQL)

**Purpose:** Specialized view for fraud detection

**Schema:**
```sql
CREATE TABLE fraud_alerts (
  id SERIAL PRIMARY KEY,
  cattle_id INTEGER,
  suspicion_type VARCHAR(50),
  severity VARCHAR(20),
  description TEXT,
  evidence JSONB,
  detected_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE risk_scores (
  cattle_id INTEGER PRIMARY KEY,
  confidence_score INTEGER,
  risk_level VARCHAR(20),
  last_updated TIMESTAMP
);
```

### 3. Cache View (Redis)

**Purpose:** Fast lookup for frequently accessed data

**Keys:**
```
cattle:{id}                    → Cattle details (JSON)
cattle:{id}:valuation          → Current valuation
cattle:{id}:risk               → Risk score
client:{id}:cattle             → List of cattle IDs
```

**TTL:** 5 minutes (refresh from PostgreSQL)

### 4. Search View (Elasticsearch)

**Purpose:** Full-text search and analytics

**Index:**
```json
{
  "mappings": {
    "properties": {
      "cattle_id": { "type": "integer" },
      "nlis_id": { "type": "keyword" },
      "breed": { "type": "text" },
      "client_name": { "type": "text" },
      "location": { "type": "geo_point" },
      "tags": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

## Event Replay

### Rebuild State from Events

```typescript
async function replayEvents(fromOffset: number = 0) {
  const consumer = kafka.consumer({ groupId: 'replay-consumer' });
  
  await consumer.subscribe({ 
    topic: 'icattle.cattle.events',
    fromBeginning: true 
  });
  
  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      await applyEvent(event);
    }
  });
}

async function applyEvent(event: EventEnvelope) {
  switch (event.metadata.event_type) {
    case 'CATTLE_CREATED':
      await handleCattleCreated(event);
      break;
    case 'OWNERSHIP_TRANSFER':
      await handleOwnershipTransfer(event);
      break;
    // ... other event types
  }
}
```

### Snapshots for Performance

```typescript
// Save snapshot every 1000 events
async function createSnapshot(cattle_id: number) {
  const currentState = await db.select()
    .from(cattle)
    .where(eq(cattle.id, cattle_id));
  
  await KafkaProducer.publishEvent({
    event_type: 'SNAPSHOT_CREATED',
    event_ref: `snapshot-${cattle_id}-${Date.now()}`,
    cattle_id,
    payload: currentState,
  });
}

// Replay from latest snapshot
async function replayFromSnapshot(cattle_id: number) {
  const snapshot = await getLatestSnapshot(cattle_id);
  const events = await getEventsSinceSnapshot(cattle_id, snapshot.offset);
  
  let state = snapshot.state;
  for (const event of events) {
    state = applyEvent(state, event);
  }
  
  return state;
}
```

## Consistency Guarantees

### Eventual Consistency

**Write:** Command → Kafka (immediate acknowledgment)
**Read:** Query read model (eventually consistent)

```typescript
// Write
const result = await createCattle(command);
// Returns: { event_id, status: 'PUBLISHED' }

// Read (may not be immediately available)
const cattle = await getCattle(result.cattle_id);
// May return null if consumer hasn't processed yet

// Solution: Poll or use WebSocket for updates
```

### Strong Consistency (When Needed)

**Option 1: Wait for Consumer**
```typescript
async function createCattleSync(command) {
  const event = await publishCattleCreated(command);
  
  // Wait for consumer to process
  await waitForEvent(event.event_id, { timeout: 5000 });
  
  // Now read from database
  return await getCattle(event.cattle_id);
}
```

**Option 2: Read from Kafka**
```typescript
async function getCattleFromEvents(cattle_id: number) {
  const events = await getEventsForCattle(cattle_id);
  return reconstructStateFromEvents(events);
}
```

## Migration Strategy

### Phase 1: Dual Write (Transition)

```typescript
// Write to both Kafka AND PostgreSQL
async function createCattle(data) {
  // 1. Publish to Kafka
  await KafkaProducer.publishCattleCreated(data);
  
  // 2. Write to PostgreSQL (temporary)
  await db.insert(cattle).values(data);
}
```

### Phase 2: Kafka-First (Target)

```typescript
// Write ONLY to Kafka
async function createCattle(data) {
  // 1. Publish to Kafka
  await KafkaProducer.publishCattleCreated(data);
  
  // 2. Consumer writes to PostgreSQL
  // (no direct write here)
}
```

### Phase 3: Verify & Remove Dual Write

```typescript
// Remove direct PostgreSQL writes
async function createCattle(data) {
  // ONLY Kafka
  await KafkaProducer.publishCattleCreated(data);
}
```

## Testing Strategy

### 1. Event Replay Tests

```typescript
test('replay events rebuilds state', async () => {
  // 1. Publish events
  await publishCattleCreated({ id: 1, breed: 'Angus' });
  await publishOwnershipTransfer({ id: 1, to_client: 2 });
  
  // 2. Clear database
  await db.delete(cattle);
  
  // 3. Replay events
  await replayEvents();
  
  // 4. Verify state
  const result = await getCattle(1);
  expect(result.client_id).toBe(2);
});
```

### 2. Idempotency Tests

```typescript
test('duplicate events are ignored', async () => {
  const event = createCattleEvent({ id: 1 });
  
  // Publish twice
  await publishEvent(event);
  await publishEvent(event);
  
  // Should only create one record
  const count = await db.select().from(cattle).where(eq(cattle.id, 1));
  expect(count.length).toBe(1);
});
```

### 3. Consistency Tests

```typescript
test('read models are eventually consistent', async () => {
  await publishCattleCreated({ id: 1 });
  
  // Wait for consumer
  await sleep(100);
  
  // Verify in all read models
  const pgResult = await db.select().from(cattle).where(eq(cattle.id, 1));
  const redisResult = await redis.get('cattle:1');
  const esResult = await es.get({ index: 'cattle', id: 1 });
  
  expect(pgResult).toBeDefined();
  expect(redisResult).toBeDefined();
  expect(esResult).toBeDefined();
});
```

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Event publish latency | < 10ms | ? |
| Event processing latency | < 100ms | ? |
| Throughput | > 10,000 events/s | ? |
| Consumer lag | < 1 second | ? |
| Query latency (PostgreSQL) | < 50ms | ? |
| Query latency (Redis) | < 5ms | ? |

## Monitoring

### Kafka Metrics

- **Producer:** Publish rate, error rate, latency
- **Consumer:** Lag, processing rate, error rate
- **Topics:** Size, retention, partition count

### Application Metrics

- **Commands:** Success rate, validation errors
- **Events:** Published, processed, failed
- **Read Models:** Query latency, cache hit rate

### Alerts

- Consumer lag > 10 seconds
- Event processing errors > 1%
- Kafka unavailable
- Database replication lag > 5 seconds

## Conclusion

This Kafka-first architecture provides:

1. **Single Source of Truth:** Kafka is the event log
2. **Auditability:** Complete event history
3. **Scalability:** Horizontal scaling via partitions
4. **Flexibility:** Multiple read models for different use cases
5. **Time Travel:** Replay events to any point in time
6. **Resilience:** Can rebuild state from events

Next steps: Implement cryptographic signatures and enforce this architecture across all operations.
