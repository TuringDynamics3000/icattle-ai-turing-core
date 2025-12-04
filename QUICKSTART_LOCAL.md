# Quick Start - Local Deployment

## Prerequisites

✅ Docker and Docker Compose installed
✅ PostgreSQL installed locally
✅ Node.js 22+ installed
✅ pnpm installed

## Step-by-Step Guide

### 1. Clone and Setup

```bash
# If not already cloned
git clone https://github.com/TuringDynamics3000/icattle-ai-turing-core.git
cd icattle-ai-turing-core

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Kafka, Zookeeper, Kafka UI, and pgAdmin
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

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.local.example .env

# Edit .env if needed (default values should work)
# DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle
# KAFKA_BROKERS=localhost:9092
```

### 4. Setup Database

```bash
# Push schema to PostgreSQL
pnpm db:push

# (Optional) Seed test data
pnpm db:seed
```

### 5. Start the Dashboard

```bash
# Start development server
pnpm dev
```

The dashboard will start on **http://localhost:3000**

### 6. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **iCattle Dashboard** | http://localhost:3000 | (No auth in dev mode) |
| **Kafka UI** | http://localhost:8080 | None |
| **pgAdmin** | http://localhost:5050 | admin@icattle.local / admin |
| **PostgreSQL** | localhost:5432 | icattle / icattle_dev_password |

## Quick Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart postgres

# Reset database
pnpm db:reset

# Run tests
pnpm test:run

# Generate test events
pnpm test:generate batch 10
```

## Troubleshooting

### Port Already in Use

If ports are already in use, you can change them in `docker-compose.yml`:

```yaml
# PostgreSQL
ports:
  - "5433:5432"  # Change 5432 to 5433

# Kafka
ports:
  - "9093:9092"  # Change 9092 to 9093
```

Then update `.env`:
```bash
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5433/icattle
KAFKA_BROKERS=localhost:9093
```

### Docker Services Won't Start

```bash
# Check Docker is running
docker ps

# Check logs
docker-compose logs postgres
docker-compose logs kafka

# Restart Docker Desktop (if on Mac/Windows)
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql -h localhost -U icattle -d icattle -c "SELECT 1;"

# Restart PostgreSQL
docker-compose restart postgres
```

### Kafka Connection Failed

```bash
# Check Kafka is running
docker-compose ps kafka

# View Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka zookeeper
```

## Development Workflow

### 1. Normal Development

```bash
# Terminal 1: Start infrastructure
docker-compose up -d

# Terminal 2: Start dashboard
pnpm dev

# Make changes, hot reload will update automatically
```

### 2. Testing Event Sourcing

```bash
# Terminal 1: Start infrastructure
docker-compose up -d

# Terminal 2: Generate test events
pnpm test:generate batch 20

# Terminal 3: Start dashboard (will consume events)
pnpm dev

# Open Kafka UI to see events: http://localhost:8080
```

### 3. Database Management

```bash
# View data in pgAdmin
open http://localhost:5050

# Or use psql
psql -h localhost -U icattle -d icattle

# Run queries
SELECT * FROM cattle ORDER BY created_at DESC LIMIT 10;
SELECT * FROM cattle_events ORDER BY occurred_at DESC LIMIT 10;
```

## Production Deployment

For production deployment to AWS, see:
- `docs/AWS_DEPLOYMENT.md` (coming soon)
- Use AWS RDS for PostgreSQL
- Use AWS MSK for Kafka
- Deploy to ECS/EKS or EC2

## Next Steps

1. ✅ Dashboard running locally
2. 🔄 Explore the UI
3. 🔄 Generate test events
4. 🔄 View Kafka topics
5. 🔄 Check PostgreSQL data
6. 🔄 Run tests
7. 🔄 Deploy to production

## Support

- **Documentation**: See `docs/` directory
- **Testing**: See `TESTING_GUIDE.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Turing Protocol**: See `TURING_PROTOCOL_SUMMARY.md`

---

🚀 **Happy coding!**
