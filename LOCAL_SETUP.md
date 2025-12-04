# Local Development Setup Guide

## Prerequisites

- ✅ Docker and Docker Compose installed
- ✅ PostgreSQL installed (for CLI tools)
- ✅ Node.js 22.x installed
- ✅ pnpm installed

## Quick Start

### 1. Start PostgreSQL Database

```bash
# Start PostgreSQL and pgAdmin using Docker Compose
docker-compose up -d postgres pgadmin

# Verify PostgreSQL is running
docker ps | grep icattle-postgres

# Check PostgreSQL logs
docker logs icattle-postgres
```

**Database Credentials:**
- Host: `localhost`
- Port: `5432`
- Database: `icattle`
- Username: `icattle`
- Password: `icattle_dev_password`

**pgAdmin Access:**
- URL: http://localhost:5050
- Email: `admin@icattle.local`
- Password: `admin`

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env

# The default DATABASE_URL should work out of the box:
# DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install
```

### 4. Push Database Schema

```bash
# Generate and apply migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Or use the combined command
pnpm db:push
```

### 5. Start Development Server

```bash
# Start the application
pnpm dev

# The server will start on http://localhost:3000
```

## Database Management

### Using pgAdmin

1. Open http://localhost:5050 in your browser
2. Login with credentials above
3. Right-click "Servers" → "Register" → "Server"
4. **General Tab:**
   - Name: `iCattle Local`
5. **Connection Tab:**
   - Host: `postgres` (Docker network) or `host.docker.internal` (if that doesn't work)
   - Port: `5432`
   - Database: `icattle`
   - Username: `icattle`
   - Password: `icattle_dev_password`

### Using psql CLI

```bash
# Connect to the database
psql postgresql://icattle:icattle_dev_password@localhost:5432/icattle

# List all tables
\dt

# Describe a table
\d cattle

# Run a query
SELECT COUNT(*) FROM cattle;

# Exit
\q
```

### Using Docker Exec

```bash
# Connect to PostgreSQL inside the container
docker exec -it icattle-postgres psql -U icattle -d icattle

# List databases
\l

# Connect to icattle database
\c icattle

# List tables
\dt
```

## Common Tasks

### Reset Database

```bash
# Stop and remove containers with volumes
docker-compose down -v

# Start fresh
docker-compose up -d postgres

# Push schema again
pnpm db:push
```

### View Database Logs

```bash
# Follow PostgreSQL logs
docker logs -f icattle-postgres
```

### Backup Database

```bash
# Create a backup
docker exec icattle-postgres pg_dump -U icattle icattle > backup.sql

# Restore from backup
docker exec -i icattle-postgres psql -U icattle icattle < backup.sql
```

### Seed Test Data

Create a seed script:

```typescript
// scripts/seed.ts
import { getDb } from './server/db';
import { clients, cattle } from './drizzle/schema';

async function seed() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Insert test client
  const [client] = await db.insert(clients).values({
    name: 'Test Farm',
    abn: '12345678901',
    contactName: 'John Farmer',
    contactEmail: 'john@testfarm.com',
    clientType: 'producer',
    status: 'active',
  }).returning();

  // Insert test cattle
  await db.insert(cattle).values({
    clientId: client.id,
    nlisId: 'TEST123456789',
    visualId: 'COW-001',
    breed: 'Angus',
    sex: 'cow',
    cattleType: 'beef',
    status: 'active',
    currentWeight: 500,
    currentValuation: 150000, // $1500 in cents
  });

  console.log('✅ Test data seeded successfully!');
}

seed().catch(console.error);
```

Run it:
```bash
pnpm exec tsx scripts/seed.ts
```

## Kafka (Optional)

If you need Kafka for event streaming:

```bash
# Start all services including Kafka
docker-compose up -d

# Access Kafka UI
# http://localhost:8080
```

## Troubleshooting

### Port 5432 Already in Use

If you have PostgreSQL running locally:

```bash
# Option 1: Stop local PostgreSQL
sudo systemctl stop postgresql

# Option 2: Change Docker port mapping in docker-compose.yml
# Change "5432:5432" to "5433:5432"
# Then update DATABASE_URL to use port 5433
```

### Connection Refused

```bash
# Check if container is running
docker ps | grep icattle-postgres

# Check container logs
docker logs icattle-postgres

# Restart container
docker-compose restart postgres
```

### Permission Denied

```bash
# Fix volume permissions
docker-compose down -v
docker volume rm icattle-ai-turing-core_postgres-data
docker-compose up -d postgres
```

### Can't Connect from pgAdmin

If using `postgres` as hostname doesn't work, try:
- `host.docker.internal` (Mac/Windows)
- `172.17.0.1` (Linux - Docker bridge IP)
- Or connect pgAdmin to `localhost:5432` directly

## Development Workflow

1. **Make Schema Changes**
   ```bash
   # Edit drizzle/schema.ts
   # Generate migration
   pnpm drizzle-kit generate
   # Apply migration
   pnpm drizzle-kit migrate
   ```

2. **Test Changes**
   ```bash
   # Run type checking
   pnpm check
   
   # Run tests
   pnpm test
   ```

3. **Commit Changes**
   ```bash
   git add -A
   git commit -m "feat: your changes"
   git push
   ```

## Next Steps

Once your local environment is running:

1. ✅ Verify database connection
2. ✅ Test CRUD operations
3. ✅ Seed test data
4. 🚀 Build ag-platform integration UI
5. 🚀 Implement OAuth flows
6. 🚀 Test Xero integration

## Resources

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [pgAdmin Docs](https://www.pgadmin.org/docs/)
