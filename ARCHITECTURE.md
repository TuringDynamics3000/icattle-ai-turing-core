# iCattle Ecosystem Architecture

## System Overview

The iCattle ecosystem consists of two main components:

1. **TuringCore-v3** - Event sourcing backend (event producer)
2. **iCattle Dashboard** - Web UI and read models (event consumer)

```
┌─────────────────────────────────────────────────────────────────┐
│                      TuringCore-v3                               │
│                   (Event Producer / Backend)                     │
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Commands   │─────▶│   Business   │─────▶│    Events    │  │
│  │              │      │     Rules    │      │              │  │
│  │ • Create     │      │              │      │ • CATTLE_    │  │
│  │ • Transfer   │      │ • Validation │      │   CREATED    │  │
│  │ • Update     │      │ • Turing     │      │ • OWNERSHIP_ │  │
│  │ • Delete     │      │   Protocol   │      │   TRANSFER   │  │
│  └──────────────┘      │ • Fraud      │      │ • VALUATION_ │  │
│                        │   Detection  │      │   UPDATE     │  │
│                        └──────────────┘      └──────┬───────┘  │
│                                                      │          │
│                                                      ▼          │
│                                            ┌──────────────────┐ │
│                                            │ Kafka Producer   │ │
│                                            │ (Publish Events) │ │
│                                            └────────┬─────────┘ │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         KAFKA TOPICS                             │
│                     (Event Log / Source of Truth)                │
│                                                                   │
│  • turing.cattle.events         - All cattle lifecycle events    │
│  • turing.valuations.events     - Valuation updates             │
│  • turing.fraud.events          - Fraud detections              │
│  • turing.ownership.events      - Ownership transfers           │
│  • turing.health.events         - Health records                │
│                                                                   │
│  Retention: Infinite (log compacted)                            │
│  Partitions: By cattle_id                                       │
│  Replication: 3x                                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    iCattle Dashboard                             │
│                (Event Consumer / Web UI)                         │
│                                                                   │
│  ┌──────────────────┐                                            │
│  │ Kafka Consumer   │                                            │
│  │ (Read Events)    │                                            │
│  └────────┬─────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                            │
│  │ Turing Protocol  │                                            │
│  │ (Validation)     │                                            │
│  │                  │                                            │
│  │ • Verify hash    │                                            │
│  │ • Verify sig     │                                            │
│  │ • Check schema   │                                            │
│  └────────┬─────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │  Event Handlers  │─────▶│  Materialized    │                 │
│  │                  │      │  Views           │                 │
│  │ • CattleCreated  │      │                  │                 │
│  │ • Ownership      │      │ • Golden Record  │                 │
│  │   Transfer       │      │ • Fraud View     │                 │
│  │ • Valuation      │      │ • Cache (Redis)  │                 │
│  │   Update         │      │ • Search (ES)    │                 │
│  └──────────────────┘      └────────┬─────────┘                 │
│                                     │                            │
│                                     ▼                            │
│                            ┌──────────────────┐                  │
│                            │   PostgreSQL     │                  │
│                            │ (Read Models)    │                  │
│                            │                  │                  │
│                            │ • cattle         │                  │
│                            │ • clients        │                  │
│                            │ • valuations     │                  │
│                            │ • fraud_alerts   │                  │
│                            └────────┬─────────┘                  │
│                                     │                            │
│                                     ▼                            │
│                            ┌──────────────────┐                  │
│                            │   Web UI         │                  │
│                            │   (React/tRPC)   │                  │
│                            │                  │                  │
│                            │ • Dashboard      │                  │
│                            │ • Cattle List    │                  │
│                            │ • Fraud Alerts   │                  │
│                            │ • Reports        │                  │
│                            └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Responsibilities

### TuringCore-v3 (Event Producer)

**What it does:**
- Receives commands from external systems (NLIS, GPS, Biometric, Manual)
- Validates commands against business rules
- Enforces Turing Protocol (event creation, signing, hashing)
- Detects fraud in real-time
- Publishes events to Kafka topics
- Maintains event log as source of truth

**What it does NOT do:**
- Does NOT provide web UI
- Does NOT store materialized views
- Does NOT handle queries (read-only operations)

**Technology:**
- Language: Go/Rust (high performance)
- Event Store: Kafka
- Protocol: Turing Protocol V2 (EdDSA signatures, Merkle trees)

### iCattle Dashboard (Event Consumer)

**What it does:**
- Consumes events from Kafka topics
- Validates events using Turing Protocol
- Materializes events into PostgreSQL read models
- Provides web UI for viewing livestock data
- Generates reports and analytics
- Handles queries (read-only operations)

**What it does NOT do:**
- Does NOT accept commands (no writes)
- Does NOT produce events
- Does NOT enforce business rules (already enforced by TuringCore-v3)

**Technology:**
- Language: TypeScript/Node.js
- Frontend: React + tRPC
- Database: PostgreSQL (read models)
- Cache: Redis (optional)
- Search: Elasticsearch (optional)

## Event Flow

### 1. Command Processing (TuringCore-v3)

```
External System → TuringCore-v3 → Kafka
     (Command)      (Validate)    (Event)
```

**Example:**
```
NLIS System sends: "Create cattle with tag NAUS000000001"
                    ↓
TuringCore-v3 validates:
  - Tag is unique
  - Client exists
  - Required fields present
                    ↓
TuringCore-v3 creates event:
  {
    metadata: { event_type: "CATTLE_CREATED", ... },
    payload: { nlisId: "NAUS000000001", ... },
    cryptography: { signature: "...", hash: "..." }
  }
                    ↓
Kafka receives event on topic: turing.cattle.events
```

### 2. Event Consumption (iCattle Dashboard)

```
Kafka → iCattle Consumer → Validate → Materialize → PostgreSQL
(Event)   (Read)           (Verify)    (Transform)   (Store)
```

**Example:**
```
Kafka publishes: CATTLE_CREATED event
                    ↓
iCattle Consumer receives event
                    ↓
Validate event:
  - Verify signature (EdDSA)
  - Verify hash (SHA-256)
  - Check schema version
                    ↓
Transform to read model:
  INSERT INTO cattle (id, nlis_id, breed, ...)
                    ↓
PostgreSQL stores materialized view
                    ↓
Web UI displays cattle in dashboard
```

## Turing Protocol Enforcement

### Event Structure (from TuringCore-v3)

```typescript
interface EventEnvelope {
  metadata: {
    event_id: string;              // evt_abc123
    event_type: EventType;         // CATTLE_CREATED
    cattle_id: number;             // 1234
    occurred_at: string;           // ISO 8601
    idempotency_key: string;       // SHA-256
    source_system: SourceSystem;   // NLIS, GPS, etc.
    created_by?: string;           // User/system ID
    public_key: string;            // Creator's public key
  };
  
  payload: {
    // Event-specific data
    nlisId: string;
    breed: string;
    sex: string;
    // ...
  };
  
  cryptography: {
    payload_hash: string;          // SHA-256 of payload
    previous_hash?: string;        // Links to previous event
    signature: string;             // EdDSA signature
    public_key: string;            // Signer's public key
    merkle_root?: string;          // Merkle tree root
  };
  
  provenance?: {
    confidence_score: number;      // 0-100
    risk_level: RiskLevel;         // LOW, MEDIUM, HIGH, CRITICAL
    verifications: string[];       // NLIS, Photo, GPS, etc.
    suspicions: SuspicionType[];   // Fraud flags
  };
}
```

### Validation in iCattle Dashboard

**Step 1: Schema Validation**
```typescript
// Check required fields
if (!event.metadata || !event.payload || !event.cryptography) {
  throw new Error('Invalid event structure');
}

// Check schema version
if (event.metadata.schema_version !== 2) {
  throw new Error('Unsupported schema version');
}
```

**Step 2: Hash Verification**
```typescript
// Recalculate payload hash
const calculated_hash = calculatePayloadHash(event.payload);

// Compare with event hash
if (event.cryptography.payload_hash !== calculated_hash) {
  throw new Error('Payload hash mismatch - tampering detected');
}
```

**Step 3: Signature Verification**
```typescript
// Verify EdDSA signature
const signature_valid = await verifyEventSignature(
  event.metadata,
  event.cryptography.payload_hash,
  event.cryptography.signature,
  event.cryptography.public_key
);

if (!signature_valid) {
  throw new Error('Invalid signature - authentication failed');
}
```

**Step 4: Idempotency Check**
```typescript
// Check if event already processed
const already_processed = await db.query(
  'SELECT 1 FROM cattle_events WHERE idempotency_key = $1',
  [event.metadata.idempotency_key]
);

if (already_processed.rowCount > 0) {
  console.log('Event already processed (idempotent)');
  return; // Skip processing
}
```

**Step 5: Materialize to Database**
```typescript
// Transform event to read model
await db.transaction(async (tx) => {
  // Store event in event log
  await tx.insert(cattle_events).values({
    event_id: event.metadata.event_id,
    event_type: event.metadata.event_type,
    cattle_id: event.metadata.cattle_id,
    payload: event.payload,
    payload_hash: event.cryptography.payload_hash,
    signature: event.cryptography.signature,
    occurred_at: event.metadata.occurred_at,
  });
  
  // Update materialized view
  if (event.metadata.event_type === 'CATTLE_CREATED') {
    await tx.insert(cattle).values({
      id: event.metadata.cattle_id,
      nlis_id: event.payload.nlisId,
      breed: event.payload.breed,
      sex: event.payload.sex,
      // ...
    });
  }
});
```

## Read Models

### 1. Golden Record (cattle table)

**Purpose:** Current state of all cattle

```sql
CREATE TABLE cattle (
  id INTEGER PRIMARY KEY,
  nlis_id VARCHAR(16) UNIQUE NOT NULL,
  visual_id VARCHAR(50),
  breed VARCHAR(100),
  sex VARCHAR(10),
  date_of_birth DATE,
  client_id INTEGER,
  current_valuation INTEGER,
  status VARCHAR(20),
  confidence_score INTEGER,
  risk_level VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. Event Log (cattle_events table)

**Purpose:** Immutable audit trail

```sql
CREATE TABLE cattle_events (
  event_id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  cattle_id INTEGER NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP NOT NULL,
  idempotency_key VARCHAR(64) UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  signature VARCHAR(128) NOT NULL,
  public_key VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64),
  
  INDEX idx_cattle_id (cattle_id),
  INDEX idx_occurred_at (occurred_at),
  INDEX idx_event_type (event_type)
);
```

### 3. Fraud Alerts (fraud_alerts table)

**Purpose:** Suspicious activity tracking

```sql
CREATE TABLE fraud_alerts (
  id SERIAL PRIMARY KEY,
  cattle_id INTEGER NOT NULL,
  event_id VARCHAR(64),
  suspicion_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT,
  evidence JSONB,
  detected_at TIMESTAMP NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100)
);
```

## Event Replay

### Rebuild State from Events

```typescript
async function replayEvents(fromOffset: number = 0) {
  const consumer = kafka.consumer({ 
    groupId: 'icattle-replay-consumer' 
  });
  
  await consumer.subscribe({ 
    topic: 'turing.cattle.events',
    fromBeginning: true 
  });
  
  // Clear existing state
  await db.delete(cattle);
  await db.delete(cattle_events);
  
  // Replay all events
  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      
      // Validate event
      const validation = await validateEvent(event);
      if (!validation.valid) {
        console.error('Invalid event:', validation.errors);
        return;
      }
      
      // Apply event to rebuild state
      await applyEvent(event);
    }
  });
}
```

## Deployment

### TuringCore-v3
- Deployed separately (microservice)
- Handles all write operations
- Publishes to Kafka

### iCattle Dashboard
- Deployed as web application
- Consumes from Kafka
- Serves web UI
- Read-only operations

### Kafka
- Shared event bus
- Single source of truth
- Infinite retention

## Benefits of This Architecture

1. **Separation of Concerns**
   - TuringCore-v3: Write model (commands → events)
   - iCattle Dashboard: Read model (events → views)

2. **Scalability**
   - Scale TuringCore-v3 independently
   - Scale iCattle Dashboard independently
   - Multiple consumers can read same events

3. **Auditability**
   - Complete event history in Kafka
   - Immutable audit trail
   - Can replay events to any point in time

4. **Resilience**
   - If iCattle Dashboard crashes, events are safe in Kafka
   - Can rebuild state from event log
   - No data loss

5. **Flexibility**
   - Can add new consumers without changing TuringCore-v3
   - Can create multiple read models for different use cases
   - Can change read model schema without affecting events

## Next Steps

1. ✅ Document architecture
2. 🔄 Enhance Turing Protocol validation in iCattle Dashboard
3. 🔄 Build robust Kafka consumer with error handling
4. 🔄 Create event replay mechanism
5. 🔄 Add comprehensive tests
6. 🔄 Set up monitoring and alerting
