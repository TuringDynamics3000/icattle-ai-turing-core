# Turing Protocol Documentation

## Overview

The Turing Protocol is a cryptographic event verification system that ensures the integrity, authenticity, and traceability of all livestock lifecycle events in the iCattle ecosystem. It provides bank-grade auditability through payload hashing, event chain linking, and comprehensive metadata tracking.

## Core Principles

The protocol is built on three fundamental principles that work together to create an immutable, verifiable audit trail:

**Immutability** ensures that once an event is recorded, it cannot be altered or deleted without detection. This is achieved through cryptographic hashing and chain linking, making any tampering immediately visible.

**Traceability** requires that every event includes complete metadata about who performed the action, when it occurred, where it happened, and which system generated it. This creates a comprehensive audit trail for regulatory compliance and fraud investigation.

**Verification** means that any party can independently verify the integrity of an event or event chain without trusting the system operator. The cryptographic proofs are self-contained and mathematically verifiable.

## Event Envelope Structure

Every event in the iCattle system is wrapped in a Turing Protocol envelope that contains both the business payload and cryptographic verification data.

### Event Metadata

The metadata section contains information about the event itself:

```typescript
interface EventMetadata {
  event_id: string;          // UUID v4 unique identifier
  event_type: EventType;     // Type of lifecycle event
  entity_id: string;         // Cattle ID (biometric hash or NLIS)
  entity_type: string;       // Always "cattle" in this system
  timestamp: string;         // ISO 8601 timestamp (UTC)
  source_system: string;     // System that generated the event
  schema_version: string;    // Protocol version (e.g., "1.0.0")
  correlation_id?: string;   // Links related events together
}
```

**Event ID** is a globally unique identifier (UUID v4) that ensures no two events can ever have the same ID, even across distributed systems.

**Event Type** categorizes the lifecycle event (e.g., HEALTH_CHECK_RECORDED, MOVEMENT_RECORDED, VALUATION_UPDATED) to enable efficient filtering and processing.

**Entity ID** links the event to a specific cattle using either the biometric hash (muzzle pattern) or NLIS tag number as the permanent identifier.

**Timestamp** records when the event occurred in UTC timezone to ensure consistent ordering across different geographic locations.

**Source System** identifies which application or device generated the event (e.g., "icattle-dashboard", "mobile-app", "iot-sensor") for troubleshooting and audit purposes.

**Correlation ID** optionally groups related events together, such as all events from a single health check session or movement batch.

### Event Payload

The payload contains the actual business data for the event. The structure varies by event type but always includes relevant details:

```typescript
interface HealthCheckPayload {
  temperature: number;        // Body temperature in Fahrenheit
  mobility_score: number;     // 1-5 scale (5 = excellent)
  notes: string;             // Veterinarian observations
  veterinarian_id: string;   // ID of examining vet
  location: string;          // Where check occurred
}

interface MovementPayload {
  from_location: string;     // Origin property/paddock
  to_location: string;       // Destination property/paddock
  transport_method: string;  // Truck, walk, rail, etc.
  distance_km: number;       // Travel distance
  gps_coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface ValuationPayload {
  book_value: number;        // Accounting book value (cents)
  market_value: number;      // Current market value (cents)
  valuation_method: string;  // How value was determined
  market_indicator: string;  // Which price index used
  fair_value_adjustment: number; // AASB 141 adjustment (cents)
}
```

### Cryptographic Verification

The verification section contains cryptographic proofs that ensure event integrity:

```typescript
interface EventVerification {
  payload_hash: string;      // SHA-256 hash of payload
  previous_hash: string;     // Hash of previous event in chain
  chain_index: number;       // Position in event chain
  signature?: string;        // Optional digital signature
}
```

**Payload Hash** is a SHA-256 cryptographic hash of the entire payload. Any modification to the payload, even changing a single character, produces a completely different hash. This makes tampering immediately detectable.

**Previous Hash** links to the hash of the previous event for this cattle, creating a blockchain-style chain. If any historical event is modified, all subsequent hashes become invalid.

**Chain Index** tracks the position of this event in the sequence (0 for first event, 1 for second, etc.) to detect missing or reordered events.

**Signature** optionally includes a digital signature from the event creator using public-key cryptography for non-repudiation.

### Complete Event Envelope

A complete event envelope combines all three sections:

```typescript
interface TuringEventEnvelope {
  metadata: EventMetadata;
  payload: Record<string, any>;
  verification: EventVerification;
}
```

Example of a complete health check event:

```json
{
  "metadata": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "HEALTH_CHECK_RECORDED",
    "entity_id": "cattle-abc123",
    "entity_type": "cattle",
    "timestamp": "2025-12-04T10:30:00Z",
    "source_system": "icattle-dashboard",
    "schema_version": "1.0.0"
  },
  "payload": {
    "temperature": 101.5,
    "mobility_score": 5,
    "notes": "Routine health check - all normal",
    "veterinarian_id": "vet-001",
    "location": "North Paddock"
  },
  "verification": {
    "payload_hash": "a3b2c1d4e5f6...",
    "previous_hash": "9f8e7d6c5b4a...",
    "chain_index": 42,
    "signature": "MEUCIQDx..."
  }
}
```

## Event Types

The protocol defines specific event types for all livestock lifecycle activities:

### Identity & Registration Events

**CATTLE_REGISTERED** - Initial registration of new cattle in the system with biometric ID, NLIS tag, breed, date of birth, and initial owner.

**BIOMETRIC_CAPTURED** - Recording of biometric data (muzzle pattern, coat features, DNA sample) for identity verification.

**NLIS_TAG_ASSIGNED** - Assignment or update of NLIS tag number, including tag swap detection.

### Health & Welfare Events

**HEALTH_CHECK_RECORDED** - Routine or emergency health assessment with temperature, mobility, and veterinarian notes.

**VACCINATION_ADMINISTERED** - Record of vaccination with vaccine type, batch number, and administering veterinarian.

**TREATMENT_APPLIED** - Medical treatment or medication with drug name, dosage, and withdrawal period.

**INJURY_REPORTED** - Documentation of injury or illness with severity, treatment plan, and recovery timeline.

### Movement & Location Events

**MOVEMENT_RECORDED** - Physical movement between properties or paddocks with origin, destination, and transport details.

**LOCATION_UPDATED** - GPS coordinate update from tracking device or manual entry.

**PROPERTY_TRANSFER** - Change of ownership with buyer, seller, sale price, and transfer date.

### Valuation & Financial Events

**VALUATION_UPDATED** - Market value recalculation based on current prices, weight, and quality grade.

**GRADING_RECORDED** - USDA quality and yield grade assessment with marbling score and carcass data.

**SALE_RECORDED** - Sale transaction with buyer, price, payment terms, and settlement date.

### Feed & Nutrition Events

**FEED_RECORDED** - Feed intake or ration change with feed type, quantity, and nutritional analysis.

**WEIGHT_RECORDED** - Weight measurement with scale ID, weight in kg, and body condition score.

### Breeding Events

**BREEDING_RECORDED** - Mating or artificial insemination with sire ID, dam ID, and breeding method.

**PREGNANCY_CONFIRMED** - Pregnancy test result with expected calving date.

**BIRTH_RECORDED** - Calf birth with birth weight, ease of calving, and maternal health.

## Payload Hashing Algorithm

The payload hashing algorithm ensures consistent, deterministic hashes that can be independently verified:

```typescript
function calculatePayloadHash(payload: Record<string, any>): string {
  // Handle null or undefined payloads
  if (!payload || typeof payload !== 'object') {
    return crypto.createHash('sha256')
      .update('null')
      .digest('hex');
  }

  // Sort keys alphabetically for deterministic ordering
  const sortedKeys = Object.keys(payload).sort();
  
  // Build canonical string representation
  const canonicalString = sortedKeys
    .map(key => {
      const value = payload[key];
      // Handle nested objects recursively
      if (typeof value === 'object' && value !== null) {
        return `${key}:${JSON.stringify(value)}`;
      }
      return `${key}:${value}`;
    })
    .join('|');

  // Generate SHA-256 hash
  return crypto.createHash('sha256')
    .update(canonicalString)
    .digest('hex');
}
```

**Key Features:**

**Deterministic Ordering** - Keys are sorted alphabetically before hashing to ensure the same payload always produces the same hash, regardless of key order in the original object.

**Nested Object Support** - Handles complex nested structures by recursively processing objects and arrays.

**Null Handling** - Treats null and undefined payloads consistently to avoid hash collisions.

**Canonical Representation** - Uses a pipe-separated format (key:value|key:value) that is human-readable and unambiguous.

## Event Chain Linking

Events for each cattle are linked in a blockchain-style chain where each event includes the hash of the previous event:

```
Event 0 (Genesis)
├─ payload_hash: abc123...
├─ previous_hash: null
└─ chain_index: 0
        │
        ▼
Event 1
├─ payload_hash: def456...
├─ previous_hash: abc123...  ← Links to Event 0
└─ chain_index: 1
        │
        ▼
Event 2
├─ payload_hash: ghi789...
├─ previous_hash: def456...  ← Links to Event 1
└─ chain_index: 2
```

**Chain Integrity Verification:**

To verify the integrity of an event chain, the system checks three conditions:

1. **Hash Validity** - Recalculate the payload hash for each event and verify it matches the stored hash
2. **Chain Continuity** - Verify each event's previous_hash matches the payload_hash of the preceding event
3. **Index Sequence** - Verify chain_index increments by 1 for each event with no gaps

If any of these checks fail, the chain is considered compromised and a fraud alert is generated.

## Event Validation

The protocol enforces strict validation rules before accepting events:

### Metadata Validation

**Event ID Format** - Must be a valid UUID v4 (36 characters with hyphens)

**Event Type** - Must be one of the defined EventType enum values

**Entity ID** - Must be a non-empty string matching cattle ID format

**Timestamp** - Must be a valid ISO 8601 timestamp in UTC timezone

**Source System** - Must be a registered system identifier

**Schema Version** - Must match current protocol version

### Payload Validation

**Required Fields** - All mandatory fields for the event type must be present

**Data Types** - Fields must match expected types (number, string, boolean, object)

**Value Ranges** - Numeric values must fall within valid ranges (e.g., temperature 95-110°F)

**String Formats** - Strings must match expected patterns (e.g., NLIS tag format)

### Verification Validation

**Payload Hash** - Must be a valid 64-character hexadecimal SHA-256 hash

**Previous Hash** - Must match the hash of the previous event (except for genesis event)

**Chain Index** - Must be exactly one more than the previous event's index

**Signature** - If present, must be a valid digital signature that verifies with the public key

## Fraud Detection Integration

The Turing Protocol enables sophisticated fraud detection by providing a complete, verifiable event history:

### Tag Swap Detection

Monitors for the same NLIS tag appearing on multiple cattle by tracking tag assignment events across all animals. If the same tag is assigned to two different biometric IDs, a fraud alert is generated.

### Rapid Movement Detection

Analyzes movement events to detect impossible travel times. If a cattle appears at two locations that are farther apart than could be traveled in the elapsed time, this indicates either a data error or fraudulent movement reporting.

### Ownership Churn Detection

Tracks property transfer events to identify cattle that change ownership suspiciously frequently (more than 3 times in 6 months). This pattern often indicates fraudulent activity such as loan stacking or identity laundering.

### Price Anomaly Detection

Monitors valuation events for sudden spikes that exceed 3 standard deviations from historical values. This can indicate fraudulent overvaluation for lending purposes.

### Chain Integrity Monitoring

Continuously verifies event chain integrity for all cattle. Any break in the chain (invalid hash, missing event, broken link) triggers an immediate fraud alert and locks the cattle record for investigation.

## Event Replay & State Reconstruction

The immutable event log enables complete state reconstruction at any point in time:

```typescript
function reconstructCattleState(
  cattleId: string,
  targetDate?: Date
): CattleState {
  // Fetch all events for this cattle from Golden Record
  const events = await getEventsByCattleId(cattleId);
  
  // Filter to events before target date (if specified)
  const relevantEvents = targetDate
    ? events.filter(e => new Date(e.metadata.timestamp) <= targetDate)
    : events;
  
  // Sort by chain index to ensure correct order
  relevantEvents.sort((a, b) => 
    a.verification.chain_index - b.verification.chain_index
  );
  
  // Replay events to build current state
  let state: CattleState = createEmptyState();
  
  for (const event of relevantEvents) {
    state = applyEvent(state, event);
  }
  
  return state;
}
```

**Use Cases:**

**Historical Audits** - Reconstruct what a cattle's state was at any past date for regulatory audits or dispute resolution.

**Data Recovery** - If the operational database is corrupted, rebuild all cattle records from the Golden Record event log.

**Compliance Reporting** - Generate reports showing complete lifecycle history for food safety or traceability requirements.

**Fraud Investigation** - Replay events to identify when fraudulent data was introduced and trace the source.

## Protocol Enforcement Middleware

All API endpoints enforce Turing Protocol validation through middleware:

```typescript
async function validateTuringProtocol(
  event: TuringEventEnvelope
): Promise<ValidationResult> {
  const errors: string[] = [];
  
  // Validate metadata
  if (!isValidUUID(event.metadata.event_id)) {
    errors.push('Invalid event_id format');
  }
  
  if (!isValidEventType(event.metadata.event_type)) {
    errors.push('Invalid event_type');
  }
  
  if (!isValidTimestamp(event.metadata.timestamp)) {
    errors.push('Invalid timestamp format');
  }
  
  // Validate payload hash
  const calculatedHash = calculatePayloadHash(event.payload);
  if (calculatedHash !== event.verification.payload_hash) {
    errors.push('Payload hash mismatch - event may be tampered');
  }
  
  // Validate chain linking
  if (event.verification.chain_index > 0) {
    const previousEvent = await getPreviousEvent(
      event.metadata.entity_id,
      event.verification.chain_index - 1
    );
    
    if (!previousEvent) {
      errors.push('Previous event not found - chain broken');
    } else if (previousEvent.verification.payload_hash !== 
               event.verification.previous_hash) {
      errors.push('Previous hash mismatch - chain integrity violated');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Security Considerations

The Turing Protocol provides strong security guarantees but requires proper implementation:

**Cryptographic Strength** - Uses SHA-256 hashing which is computationally infeasible to reverse or find collisions. Would require 2^256 attempts to brute force.

**Tamper Evidence** - Any modification to historical events breaks the chain and is immediately detectable. Cannot silently alter past records.

**Non-Repudiation** - Digital signatures (when used) provide cryptographic proof of who created an event. Cannot deny authorship.

**Time Ordering** - Timestamps and chain indices create a total ordering of events. Cannot reorder events without detection.

**Distributed Verification** - Any party with access to the event log can independently verify integrity without trusting the system operator.

**Limitations:**

**Garbage In, Garbage Out** - The protocol cannot verify the accuracy of the original data, only that it hasn't been modified after creation.

**Timestamp Trust** - Relies on accurate system clocks. Attackers with control over timestamps could manipulate event ordering.

**Key Management** - Digital signatures require secure private key storage. Compromised keys enable signature forgery.

**Genesis Event** - The first event in a chain has no previous hash to verify against. Must trust the initial registration.

## Best Practices

**Always Validate** - Never accept events without full Turing Protocol validation, even from trusted sources.

**Store Immutably** - Use append-only storage (like PostgreSQL with no UPDATE/DELETE permissions) for the Golden Record.

**Monitor Continuously** - Run automated chain integrity checks on a schedule to detect tampering quickly.

**Separate Concerns** - Keep the Golden Record database separate from operational databases to prevent accidental corruption.

**Archive Strategically** - Retain event logs indefinitely for regulatory compliance, but archive old events to cold storage.

**Version Carefully** - When updating the protocol, maintain backward compatibility and version all events.

**Sign Critical Events** - Use digital signatures for high-value events like property transfers and sales.

**Audit Regularly** - Conduct independent audits of event chain integrity and fraud detection effectiveness.

## Future Enhancements

**Zero-Knowledge Proofs** - Enable verification of event properties without revealing the actual data.

**Distributed Ledger** - Migrate from centralized PostgreSQL to distributed blockchain for enhanced decentralization.

**Multi-Party Signatures** - Require multiple parties to sign critical events (e.g., buyer and seller for property transfers).

**Smart Contracts** - Automate business logic execution based on event patterns (e.g., automatic payment on delivery confirmation).

**Homomorphic Encryption** - Enable computation on encrypted event data without decryption.

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2025  
**Author:** Turing Dynamics 3000
