# Kafka Integration Setup

iCattle consumes TuringCore-v3's Kafka infrastructure for event sourcing and the Turing Protocol Golden Record.

## Architecture

```
iCattle (Application Layer)
    ↓ publishes events
TuringCore-v3 Kafka (Infrastructure Layer)
    ↓ consumes events
PostgreSQL Golden Record (Event Store)
```

## Prerequisites

1. **TuringCore-v3 Kafka running** on your local machine
2. **Network connectivity** from TuringDynamics sandbox to your local Kafka

## Setup Steps

### 1. Start TuringCore-v3 Kafka

On your local machine:

```bash
cd /path/to/TuringCore-v3
docker-compose up -d zookeeper kafka
```

Wait for Kafka to be healthy:

```bash
docker-compose logs -f kafka
# Wait for "Kafka Server started" message
```

### 2. Initialize iCattle Topics

From your local machine (where Docker is running):

```bash
cd /path/to/icattle-dashboard
./scripts/init-kafka-topics-docker.sh
```

This creates:
- `icattle.cattle.events` (6 partitions, 7-day retention)
- `icattle.provenance.events` (3 partitions, 7-day retention)
- `icattle.fraud.alerts` (3 partitions, 30-day retention)

### 3. Configure iCattle Connection

Set environment variable to point to your local Kafka:

```bash
# Find your local IP address
ipconfig getifaddr en0  # macOS
ip addr show           # Linux

# Set in iCattle environment
export KAFKA_BROKERS="YOUR_LOCAL_IP:9093"
```

**Important**: Use port `9093` (external) not `9092` (internal to Docker network).

### 4. Test Connection

From the TuringDynamics sandbox, test Kafka connectivity:

```bash
# This will be added to iCattle
npm run test:kafka
```

## Event Flow

### Publishing Events

```typescript
import { KafkaProducer } from './server/_core/kafkaProducer';

// Initialize (done automatically on first publish)
await KafkaProducer.init();

// Publish cattle created event
await KafkaProducer.publishCattleCreated(cattle_id, {
  tag: 'NLIS123456',
  breed: 'Angus',
  weight_kg: 450,
  // ... other cattle data
}, user_id);

// Publish ownership transfer
await KafkaProducer.publishOwnershipTransfer(
  cattle_id,
  from_client_id,
  to_client_id,
  user_id
);
```

### Consuming Events

The Kafka consumer runs automatically when the server starts:

```typescript
// server/_core/index.ts
import { KafkaConsumer } from './kafkaConsumer';

// Start consumer
await KafkaConsumer.init();
```

Events are:
1. Validated (hash integrity, schema)
2. Checked for idempotency
3. Persisted to PostgreSQL `cattle_events` table
4. Processed for provenance scoring and fraud detection

## Monitoring

### View Kafka Topics

```bash
docker exec turingcore-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --list
```

### View Topic Details

```bash
docker exec turingcore-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic icattle.cattle.events
```

### Consume Events (Debug)

```bash
docker exec turingcore-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic icattle.cattle.events \
  --from-beginning \
  --property print.key=true \
  --property print.headers=true
```

## Troubleshooting

### Connection Refused

**Problem**: `KafkaJSConnectionError: Connection error: connect ECONNREFUSED`

**Solution**:
1. Check Kafka is running: `docker ps | grep kafka`
2. Verify port 9093 is exposed: `docker port turingcore-kafka`
3. Check firewall allows connections to port 9093
4. Verify `KAFKA_BROKERS` uses external IP, not `localhost`

### Topic Not Found

**Problem**: `KafkaJSProtocolError: This server does not host this topic-partition`

**Solution**:
1. Run `./scripts/init-kafka-topics-docker.sh`
2. Verify topics exist: `docker exec turingcore-kafka kafka-topics --list`

### Events Not Persisting

**Problem**: Events published but not appearing in database

**Solution**:
1. Check consumer is running: Look for `[Kafka] Consumer started` in logs
2. Check for consumer errors in server logs
3. Verify PostgreSQL `cattle_events` table exists
4. Check idempotency - event may have been processed already

## Production Deployment

For production, both iCattle and TuringCore-v3 should connect to a **managed Kafka cluster** (e.g., Confluent Cloud, AWS MSK, Azure Event Hubs).

Update environment variables:

```bash
KAFKA_BROKERS=kafka-broker-1:9092,kafka-broker-2:9092,kafka-broker-3:9092
KAFKA_CLIENT_ID=icattle-prod
KAFKA_GROUP_ID=icattle-event-processor-prod
```

## Turing Protocol Compliance

All events published to Kafka follow the Turing Protocol:

- ✅ **Event Sourcing**: All cattle state changes are events
- ✅ **Hash Integrity**: SHA-256 hash for tamper detection
- ✅ **Idempotency**: Duplicate events are ignored
- ✅ **Validation**: Schema and business rule validation
- ✅ **Audit Trail**: Complete event history in PostgreSQL

See `docs/TURING_PROTOCOL.md` for full specification.
