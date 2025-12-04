# 🚀 Quick Start Guide

Get iCattle Dashboard running on your local machine in 5 minutes.

## Prerequisites

- ✅ Docker and Docker Compose
- ✅ PostgreSQL (for CLI tools)
- ✅ Node.js 22.x
- ✅ pnpm

## One-Command Setup

```bash
make setup
```

This will:
1. Install dependencies
2. Start PostgreSQL in Docker
3. Create database schema
4. Seed test data
5. Ready to go! 🎉

## Manual Setup

If you prefer step-by-step:

### 1. Clone and Install

```bash
git clone https://github.com/TuringDynamics3000/icattle-ai-turing-core.git
cd icattle-ai-turing-core
pnpm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env
```

The default DATABASE_URL works out of the box:
```
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle
```

### 3. Start PostgreSQL

```bash
docker-compose up -d postgres
```

Wait a few seconds for PostgreSQL to start.

### 4. Create Database Schema

```bash
pnpm db:push
```

### 5. Seed Test Data

```bash
pnpm db:seed
```

### 6. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## What You Get

After setup, you'll have:

**Test Users:**
- Admin: `test_user_001` (Test Admin)

**Test Clients:**
- Riverside Cattle Station (NSW) - 5000 hectares
- Highland Breeding Farm (NSW) - 2000 hectares

**Test Cattle:**
- 5 animals across 2 farms
- Mix of breeds: Angus, Wagyu, Hereford
- Complete with lifecycle events and valuations

## Common Commands

```bash
# Start development server
pnpm dev

# Run type checking
pnpm check

# Test database connection
pnpm db:test

# Seed more data
pnpm db:seed

# Open database shell
make db-shell

# View logs
make logs

# Reset everything
make db-reset
```

## Database Access

### pgAdmin Web UI
- URL: http://localhost:5050
- Email: `admin@icattle.local`
- Password: `admin`

### PostgreSQL CLI
```bash
psql postgresql://icattle:icattle_dev_password@localhost:5432/icattle
```

### Docker Shell
```bash
docker exec -it icattle-postgres psql -U icattle -d icattle
```

## Troubleshooting

### Port 5432 Already in Use

Stop your local PostgreSQL:
```bash
sudo systemctl stop postgresql
```

Or change the port in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 instead
```

Then update DATABASE_URL:
```
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5433/icattle
```

### Connection Refused

```bash
# Check if container is running
docker ps | grep icattle-postgres

# Check logs
docker logs icattle-postgres

# Restart
docker-compose restart postgres
```

### "No tables found"

```bash
# Push schema
pnpm db:push

# Verify
pnpm db:test
```

## Next Steps

1. ✅ Verify everything works: `pnpm db:test`
2. ✅ Explore the data in pgAdmin
3. ✅ Start the dev server: `pnpm dev`
4. 🚀 Build ag-platform integration UI
5. 🚀 Implement OAuth flows
6. 🚀 Test Xero integration

## Documentation

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Detailed setup guide
- [POSTGRESQL_MIGRATION.md](./POSTGRESQL_MIGRATION.md) - Migration details
- [scripts/README.md](./scripts/README.md) - Utility scripts
- [Makefile](./Makefile) - All make commands

## Need Help?

Check the logs:
```bash
docker logs icattle-postgres
```

Test connection:
```bash
pnpm db:test
```

Reset everything:
```bash
make clean
make setup
```

## Success Checklist

- [ ] Docker containers running (`docker ps`)
- [ ] Database connection works (`pnpm db:test`)
- [ ] Test data loaded (5 cattle, 2 clients)
- [ ] Development server starts (`pnpm dev`)
- [ ] Can access http://localhost:3000
- [ ] Can access pgAdmin at http://localhost:5050

If all checked, you're ready to develop! 🎉
