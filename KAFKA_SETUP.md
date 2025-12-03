# Kafka Event Streaming Setup Guide

This guide explains how to set up and run the complete Kafka event streaming infrastructure for the iCattle Dashboard.

## Overview

The iCattle Dashboard uses **Kafka event streaming** to create an immutable, cryptographically-verified audit trail of all cattle operations. This "Golden Record" system provides:

- **Tamper-proof event history** - SHA-256 hashing ensures events cannot be modified
- **Event sourcing architecture** - Complete rebuild capability from event stream
- **Blockchain-style verification** - Event chaining with previous hash references
- **Real-time streaming** - Events flow through Kafka for downstream processing
- **PostgreSQL persistence** - Golden Record stored in separate database

## Architecture

```
┌─────────────────┐
│  iCattle Web    │
│   Dashboard     │
└────────┬────────┘
         │ tRPC
         ▼
┌─────────────────┐     ┌──────────────┐
│ Kafka Producer  │────▶│    Kafka     │
│  (routers.ts)   │     │   Broker     │
└─────────────────┘     └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Kafka     │
                        │   Consumer   │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  PostgreSQL  │
                        │Golden Record │
                        └──────────────┘
```

## Quick Start (Windows)

### Prerequisites

1. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
2. **Node.js 22+** - Download from https://nodejs.org
3. **pnpm** - Install with `npm install -g pnpm`

### Automated Setup

Run the PowerShell setup script:

```powershell
.\setup-windows.ps1
```

This script will:
1. ✓ Check Docker and pnpm installation
2. ✓ Start Kafka infrastructure (docker-compose up -d)
3. ✓ Create .env file with configuration
4. ✓ Install dependencies (pnpm install)
5. ✓ Start development server (pnpm dev)

### Manual Setup

If you prefer manual setup:

```powershell
# 1. Start Kafka infrastructure
docker-compose up -d

# 2. Wait 30 seconds for services to initialize
Start-Sleep -Seconds 30

# 3. Create .env file
@"
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=icattle-dashboard
KAFKA_ENABLED=true
KAFKA_TOPIC_PREFIX=icattle
GOLDEN_RECORD_DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle_golden_record
"@ | Out-File -FilePath .env -Encoding utf8

# 4. Install dependencies
pnpm install

# 5. Start development server
pnpm dev
```

## Services

After setup, the following services will be running:

| Service | URL | Purpose |
|---------|-----|---------|
| **iCattle Dashboard** | http://localhost:3000 | Main web application |
| **Kafka UI** | http://localhost:8080 | Monitor Kafka topics and messages |
| **Kafka Broker** | localhost:9092 | Event streaming broker |
| **PostgreSQL** | localhost:5432 | Golden Record database |
| **Zookeeper** | localhost:2181 | Kafka coordination |

## Testing Event Flow

### 1. Perform a Cattle Operation

Navigate to http://localhost:3000 and:

1. Go to **Cattle Registry**
2. Click on any cattle (e.g., "Darling-15")
3. Click **Health Records** tab
4. Click **Record Health Check**
5. Fill in the form and submit

### 2. View Events in Kafka UI

Open http://localhost:8080:

1. Click **Topics** in the sidebar
2. Click on `icattle.cattle.events`
3. Click **Messages** tab
4. You'll see the health check event with:
   - Event ID
   - Event type: `HEALTH_CHECK`
   - Payload hash (SHA-256)
   - Timestamp
   - Full payload

### 3. View Audit Trail

Back in the iCattle Dashboard:

1. Go to the same cattle detail page
2. Click **Audit Trail** tab
3. You'll see the cryptographically-verified event history:
   - Event type and timestamp
   - Payload hash (for tamper detection)
   - Previous hash (for event chaining)
   - Full event details

## Event Types

The system publishes these event types:

| Event Type | Trigger | Example Payload |
|------------|---------|-----------------|
| `CATTLE_CREATED` | New cattle added | `{ visual_id, nlis_id, breed, sex }` |
| `HEALTH_CHECK` | Health check recorded | `{ health_status, checked_at, notes }` |
| `MOVEMENT` | Location changed | `{ to_location, moved_at, reason }` |
| `VALUATION_UPDATE` | Valuation changed | `{ new_value, method, updated_at }` |
| `WEIGHT_RECORDED` | Weight measured | `{ weight, measured_at }` |
| `OWNERSHIP_TRANSFER` | Owner changed | `{ new_owner, transferred_at }` |

## Turing Protocol

Events follow the **Turing Protocol** specification:

```typescript
{
  metadata: {
    event_id: "evt_abc123",
    event_type: "HEALTH_CHECK",
    event_ref: "health-check-001",
    cattle_id: 1,
    occurred_at: "2025-12-03T17:30:00Z",
    recorded_at: "2025-12-03T17:30:01Z",
    idempotency_key: "sha256(event_type:cattle_id:ref)",
    source_system: "iCattle",
    schema_version: 1
  },
  payload: {
    health_status: "healthy",
    checked_at: "2025-12-03T17:30:00Z",
    notes: "Routine check"
  },
  payload_hash: "sha256(payload)",
  previous_hash: "sha256(previous_event)"
}
```

### Integrity Verification

Each event includes:

- **Payload Hash**: SHA-256 hash of payload content (detects tampering)
- **Previous Hash**: Links to previous event (creates blockchain-style chain)
- **Idempotency Key**: Prevents duplicate event processing

## Database Schema

### Golden Record (PostgreSQL)

```sql
CREATE TABLE cattle_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    cattle_id INTEGER NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    source_system VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cattle_events_cattle_id ON cattle_events(cattle_id);
CREATE INDEX idx_cattle_events_event_type ON cattle_events(event_type);
CREATE INDEX idx_cattle_events_occurred_at ON cattle_events(occurred_at);
```

## Troubleshooting

### Kafka won't start

```powershell
# Check Docker is running
docker ps

# View logs
docker-compose logs kafka

# Restart services
docker-compose down
docker-compose up -d
```

### PostgreSQL connection failed

```powershell
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Events not appearing in Audit Trail

1. Check Kafka UI to verify events are being published
2. Check PostgreSQL connection in .env file
3. Check Kafka consumer logs: `docker-compose logs -f`
4. Verify KAFKA_ENABLED=true in .env

### Port conflicts

If ports 3000, 5432, 8080, or 9092 are already in use:

```powershell
# Stop conflicting services
docker-compose down

# Edit docker-compose.yml to use different ports
# Then restart
docker-compose up -d
```

## Stopping Services

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Production Deployment

For production deployment to AWS MSK:

1. Update `KAFKA_BROKERS` to AWS MSK broker URLs
2. Add SASL authentication configuration
3. Update `GOLDEN_RECORD_DATABASE_URL` to production PostgreSQL
4. Enable SSL/TLS for Kafka connections
5. Set up Kafka consumer as a separate service
6. Configure monitoring and alerting

## Further Reading

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [TuringCore-v3 Repository](https://github.com/TuringDynamics3000/TuringCore-v3)
