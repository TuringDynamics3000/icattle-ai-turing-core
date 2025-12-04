# Testing Guide - Turing Protocol V2

## Overview

This guide covers testing the Turing Protocol V2 implementation, including unit tests, integration tests, and event replay functionality.

## Test Suite Summary

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Turing Protocol V2 | 36 tests | Cryptography, validation, Merkle trees |
| Event Replay | 11 tests | Event generation, lifecycle, verification |
| **Total** | **47 tests** | **100% passing** |

## Prerequisites

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Infrastructure

```bash
# Start Kafka, PostgreSQL, and supporting services
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME                   STATUS
icattle-kafka          Up (healthy)
icattle-zookeeper      Up
icattle-postgres       Up (healthy)
icattle-kafka-ui       Up
icattle-pgadmin        Up
```

### 3. Set Up Database

```bash
# Push schema to PostgreSQL
pnpm db:push

# (Optional) Seed test data
pnpm db:seed
```

## Running Tests

### Unit Tests (Turing Protocol V2)

```bash
# Run all unit tests
pnpm test:run

# Run specific test file
pnpm vitest run tests/turingProtocolV2.test.ts

# Run with coverage
pnpm test:coverage

# Watch mode (auto-rerun on changes)
pnpm test
```

### Integration Tests (Event Replay)

```bash
# Run event replay tests
pnpm vitest run tests/eventReplay.test.ts

# Run all tests
pnpm test:run
```

### Interactive Test UI

```bash
# Open Vitest UI
pnpm test:ui
```

Navigate to http://localhost:51204 to see interactive test results.

## Test Coverage

### Turing Protocol V2 Tests

#### 1. Cryptography (16 tests)

**Key Generation:**
- ✅ Generate valid Ed25519 key pairs
- ✅ Generate unique key pairs
- ✅ Correct key sizes (32 bytes each)

**Hex Conversion:**
- ✅ Convert Uint8Array to hex
- ✅ Convert hex to Uint8Array
- ✅ Round-trip conversion

**Hashing:**
- ✅ Calculate SHA-256 hashes
- ✅ Deterministic hashing
- ✅ Different data produces different hashes

**Payload Hashing:**
- ✅ Hash simple payloads
- ✅ Deterministic payload hashing
- ✅ Handle nested objects
- ✅ Handle null and undefined

**Digital Signatures:**
- ✅ Sign events
- ✅ Verify valid signatures
- ✅ Reject invalid signatures
- ✅ Reject signatures with wrong public key

#### 2. Event Creation (5 tests)

- ✅ Create valid event metadata
- ✅ Create signed event envelopes
- ✅ Create complete event envelopes
- ✅ Generate deterministic idempotency keys
- ✅ Generate different keys for different inputs

#### 3. Event Validation (8 tests)

**Metadata Validation:**
- ✅ Validate correct metadata
- ✅ Reject missing public key
- ✅ Reject invalid schema version

**Event Integrity:**
- ✅ Verify valid event integrity
- ✅ Detect payload tampering
- ✅ Detect signature tampering

**Event Envelope Validation:**
- ✅ Validate complete event envelope
- ✅ Reject envelope without payload

#### 4. Merkle Trees (6 tests)

- ✅ Build Merkle tree from events
- ✅ Calculate Merkle root
- ✅ Generate Merkle proof
- ✅ Verify Merkle proof
- ✅ Reject invalid Merkle proof
- ✅ Produce deterministic Merkle root

#### 5. Event Chaining (1 test)

- ✅ Create event chain with previous_hash links

### Event Replay Tests

#### 1. Event Generation (4 tests)

- ✅ Generate CATTLE_CREATED event
- ✅ Generate OWNERSHIP_TRANSFER event
- ✅ Generate VALUATION_UPDATE event
- ✅ Generate FRAUD_DETECTED event

#### 2. Event Lifecycle (2 tests)

- ✅ Generate complete cattle lifecycle
- ✅ Generate batch of test cattle

#### 3. Event Validation (2 tests)

- ✅ Validate generated events
- ✅ Verify event signatures

#### 4. Merkle Tree Verification (2 tests)

- ✅ Build Merkle tree from generated events
- ✅ Verify Merkle proofs for generated events

#### 5. Event Chain Verification (1 test)

- ✅ Generate lifecycle events with consistent signatures

## Event Generator

The event generator simulates TuringCore-v3 producing events to Kafka.

### CLI Usage

```bash
# Generate single cattle event
pnpm test:generate single

# Generate complete lifecycle for one cattle
pnpm test:generate lifecycle

# Generate batch of N cattle (default 10)
pnpm test:generate batch 20

# Generate fraud detection event
pnpm test:generate fraud
```

### Programmatic Usage

```typescript
import { EventGenerator } from './tests/eventGenerator';

// Initialize producer
await EventGenerator.init();

// Generate event
const event = await EventGenerator.generateCattleCreatedEvent({
  cattle_id: 1234,
  nlisId: 'NAUS000000001',
  breed: 'Angus',
  sex: 'cow',
  clientId: 1,
});

// Publish to Kafka
await EventGenerator.publishEvent(event);

// Cleanup
await EventGenerator.disconnect();
```

### Event Types

#### CATTLE_CREATED
```typescript
const event = await EventGenerator.generateCattleCreatedEvent({
  cattle_id: 1234,
  nlisId: 'NAUS000000001',
  breed: 'Angus',
  sex: 'cow',
  clientId: 1,
  dateOfBirth: new Date('2022-01-01'),
  created_by: 'user_001',
});
```

#### OWNERSHIP_TRANSFER
```typescript
const event = await EventGenerator.generateOwnershipTransferEvent({
  cattle_id: 1234,
  from_client_id: 1,
  to_client_id: 2,
  transfer_price: 150000, // $1500 in cents
  created_by: 'user_001',
});
```

#### VALUATION_UPDATE
```typescript
const event = await EventGenerator.generateValuationUpdateEvent({
  cattle_id: 1234,
  new_value: 150000, // $1500 in cents
  weight: 450, // kg
  market_price: 320, // cents per kg
  created_by: 'user_001',
});
```

#### TAG_CHANGED
```typescript
const event = await EventGenerator.generateTagChangedEvent({
  cattle_id: 1234,
  old_tag: 'NAUS000000001',
  new_tag: 'NAUS000000002',
  reason: 'Tag replacement',
  created_by: 'user_001',
});
```

#### FRAUD_DETECTED
```typescript
const event = await EventGenerator.generateFraudDetectedEvent({
  cattle_id: 1234,
  suspicion_type: 'TAG_SWAP',
  severity: 'HIGH',
  description: 'Suspected tag swap detected',
  evidence: { /* ... */ },
  created_by: 'fraud_detection_system',
});
```

## Manual Testing Workflow

### 1. Start Infrastructure

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f kafka
```

### 2. Generate Test Events

```bash
# Generate 10 test cattle with complete lifecycles
pnpm test:generate batch 10
```

### 3. Monitor Kafka

Open Kafka UI: http://localhost:8080

- View topics: `turing.cattle.events`
- See messages in real-time
- Inspect event payloads

### 4. Start Consumer

```bash
# Start iCattle Dashboard consumer
pnpm dev
```

The consumer will:
1. Connect to Kafka
2. Subscribe to topics
3. Validate events
4. Materialize to PostgreSQL

### 5. Verify Database

Open pgAdmin: http://localhost:5050

**Login:**
- Email: admin@icattle.local
- Password: admin

**Connect to PostgreSQL:**
- Host: postgres
- Port: 5432
- Database: icattle
- Username: icattle
- Password: icattle_dev_password

**Check tables:**
```sql
-- View event log
SELECT * FROM cattle_events ORDER BY occurred_at DESC LIMIT 10;

-- View materialized cattle
SELECT * FROM cattle ORDER BY created_at DESC LIMIT 10;

-- View fraud alerts
SELECT * FROM fraud_alerts ORDER BY detected_at DESC;
```

### 6. Test Event Replay

```bash
# Clear database
psql -h localhost -U icattle -d icattle -c "DELETE FROM cattle; DELETE FROM cattle_events;"

# Replay events from Kafka
# (Consumer will automatically replay from beginning if no offset stored)
pnpm dev
```

## Continuous Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: icattle
          POSTGRES_PASSWORD: icattle_dev_password
          POSTGRES_DB: icattle
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      kafka:
        image: confluentinc/cp-kafka:7.5.0
        # ... (Kafka config)
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test:run
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Performance Benchmarks

### Event Validation

```
Payload hashing:        ~1ms
Signature verification: ~5ms
Total validation:       ~10ms
```

### Event Generation

```
Single event:           ~10ms
Complete lifecycle:     ~50ms
Batch of 100 cattle:    ~5 seconds
```

### Event Replay

```
1,000 events:           ~10 seconds
10,000 events:          ~100 seconds
100,000 events:         ~1,000 seconds (17 minutes)
```

## Troubleshooting

### Kafka Connection Issues

```bash
# Check Kafka is running
docker-compose ps kafka

# Check Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

### PostgreSQL Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql -h localhost -U icattle -d icattle -c "SELECT 1;"

# Check logs
docker-compose logs postgres
```

### Test Failures

```bash
# Run tests in verbose mode
pnpm vitest run --reporter=verbose

# Run specific test
pnpm vitest run -t "should verify valid signature"

# Debug test
pnpm vitest run --inspect-brk
```

### Event Validation Failures

Common issues:
1. **Invalid signature** - Check key pair consistency
2. **Hash mismatch** - Verify payload hasn't been modified
3. **Schema version** - Ensure using V2 schema

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use unique cattle IDs for each test
- Clean up after tests (if needed)

### 2. Event Generation

- Use consistent key pairs for related events
- Set proper timestamps
- Include provenance metadata

### 3. Validation

- Always validate events before publishing
- Check both schema and cryptographic integrity
- Log validation errors for debugging

### 4. Performance

- Batch event generation when possible
- Use Merkle trees for efficient verification
- Monitor consumer lag

## Next Steps

1. **Load Testing** - Test with millions of events
2. **Chaos Engineering** - Test failure scenarios
3. **Security Audit** - Review cryptographic implementation
4. **Performance Optimization** - Optimize hot paths

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Kafka Testing Guide](https://kafka.apache.org/documentation/#testing)
- [Ed25519 Specification](https://ed25519.cr.yp.to/)
- [Merkle Tree Explanation](https://en.wikipedia.org/wiki/Merkle_tree)

## Support

For issues or questions:
- GitHub Issues: https://github.com/TuringDynamics3000/icattle-ai-turing-core/issues
- Documentation: See ARCHITECTURE.md, TURING_PROTOCOL_SUMMARY.md
