# PowerShell Scripts - Windows Quick Start

## Overview

Three PowerShell scripts to manage the iCattle Dashboard on Windows:

| Script | Purpose |
|--------|---------|
| `start-dashboard.ps1` | Start all services and the dashboard |
| `stop-dashboard.ps1` | Stop all services |
| `reset-dashboard.ps1` | Reset database and restart with fresh data |

## Prerequisites

Before running the scripts, ensure you have:

✅ **Docker Desktop** - https://www.docker.com/products/docker-desktop
✅ **Node.js 22+** - https://nodejs.org/
✅ **pnpm** - Install with: `npm install -g pnpm`

## Quick Start

### 1. Clone Repository

```powershell
git clone https://github.com/TuringDynamics3000/icattle-ai-turing-core.git
cd icattle-ai-turing-core
```

### 2. Start Dashboard

```powershell
.\start-dashboard.ps1
```

This script will:
1. ✅ Check prerequisites (Docker, Node.js, pnpm)
2. ✅ Pull latest changes from GitHub
3. ✅ Install dependencies
4. ✅ Create `.env` file if needed
5. ✅ Start Docker services (PostgreSQL, Kafka, etc.)
6. ✅ Wait for PostgreSQL to be ready
7. ✅ Push database schema
8. ✅ Optionally seed test data
9. ✅ Start the dashboard on http://localhost:3000

### 3. Access Services

Once started, you can access:

- **🎯 iCattle Dashboard**: http://localhost:3000
- **📊 Kafka UI**: http://localhost:8080
- **🗄️ pgAdmin**: http://localhost:5050 (admin@icattle.local / admin)
- **🐘 PostgreSQL**: localhost:5432 (icattle / icattle_dev_password)

### 4. Stop Dashboard

When you're done:

```powershell
# Press Ctrl+C in the terminal running the dashboard
# Then run:
.\stop-dashboard.ps1
```

## Script Details

### start-dashboard.ps1

**What it does:**
- Validates prerequisites
- Pulls latest code
- Installs dependencies
- Starts Docker services
- Sets up database
- Launches dashboard

**Usage:**
```powershell
.\start-dashboard.ps1
```

**Output:**
```
========================================
  iCattle Dashboard - Startup Script
========================================

Checking prerequisites...
✓ All prerequisites found

Pulling latest changes from GitHub...
✓ Up to date

Installing dependencies...
✓ Dependencies installed

Starting Docker services...
✓ Docker services started

Waiting for PostgreSQL to be ready...
✓ PostgreSQL is ready

Pushing database schema...
✓ Database schema pushed

Do you want to seed test data? (Y/N)
y
✓ Test data seeded

========================================
  Services Ready!
========================================

Access Points:
  🎯 iCattle Dashboard:  http://localhost:3000
  📊 Kafka UI:           http://localhost:8080
  🗄️  pgAdmin:            http://localhost:5050
  🐘 PostgreSQL:         localhost:5432

Starting iCattle Dashboard...
```

### stop-dashboard.ps1

**What it does:**
- Stops all Docker services
- Cleans up containers

**Usage:**
```powershell
.\stop-dashboard.ps1
```

**Output:**
```
========================================
  iCattle Dashboard - Stop Script
========================================

Stopping Docker services...
✓ All services stopped

All services have been stopped.
```

### reset-dashboard.ps1

**What it does:**
- Stops all services
- Removes database volumes
- Restarts services
- Recreates database schema
- Seeds fresh test data

**Usage:**
```powershell
.\reset-dashboard.ps1
```

**Output:**
```
========================================
  iCattle Dashboard - Reset Script
========================================

WARNING: This will delete all data in the database!
Are you sure you want to continue? (Y/N)
y

Stopping services...
✓ Services stopped

Removing database volumes...
✓ Volumes removed

Starting services...
✓ Services started

Waiting for PostgreSQL to be ready...
✓ PostgreSQL is ready

Pushing database schema...
✓ Database schema pushed

Seeding test data...
✓ Test data seeded

========================================
  Reset Complete!
========================================

Database has been reset with fresh test data.
```

## Execution Policy

If you get an execution policy error:

```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or run scripts with bypass:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dashboard.ps1
```

## Troubleshooting

### Docker Not Running

**Error:**
```
ERROR: Docker is not running
```

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start
3. Run the script again

### Port Already in Use

**Error:**
```
Error: port is already allocated
```

**Solution:**
1. Check what's using the port:
   ```powershell
   netstat -ano | findstr :5432
   netstat -ano | findstr :9092
   netstat -ano | findstr :3000
   ```
2. Stop the conflicting service or change ports in `docker-compose.yml`

### PostgreSQL Not Ready

**Error:**
```
WARNING: PostgreSQL may not be fully ready
```

**Solution:**
1. Wait a bit longer
2. Check Docker logs:
   ```powershell
   docker compose logs postgres
   ```
3. Restart PostgreSQL:
   ```powershell
   docker compose restart postgres
   ```

### Database Schema Failed

**Error:**
```
ERROR: Failed to push database schema
```

**Solution:**
1. Check PostgreSQL is running:
   ```powershell
   docker compose ps postgres
   ```
2. Manually push schema:
   ```powershell
   pnpm db:push
   ```
3. Check `.env` file has correct DATABASE_URL

## Manual Commands

If you prefer manual control:

```powershell
# Start Docker services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down

# Push schema
pnpm db:push

# Seed data
pnpm db:seed

# Start dashboard
pnpm dev
```

## Development Workflow

### Daily Development

```powershell
# Morning: Start everything
.\start-dashboard.ps1

# Work on code (hot reload enabled)

# Evening: Stop everything
.\stop-dashboard.ps1
```

### Testing Changes

```powershell
# Start dashboard
.\start-dashboard.ps1

# In another terminal: Generate test events
pnpm test:generate batch 20

# View in Kafka UI: http://localhost:8080
# View in pgAdmin: http://localhost:5050
```

### Fresh Start

```powershell
# Reset everything
.\reset-dashboard.ps1

# Start dashboard
.\start-dashboard.ps1
```

## Advanced Usage

### Custom Environment

Edit `.env` file before starting:

```env
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_PREFIX=turing
PORT=3000
```

### Different Ports

Edit `docker-compose.yml`:

```yaml
postgres:
  ports:
    - "5433:5432"  # Change PostgreSQL port

kafka:
  ports:
    - "9093:9092"  # Change Kafka port
```

Then update `.env`:

```env
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5433/icattle
KAFKA_BROKERS=localhost:9093
```

## Scripts Location

All scripts are in the repository root:

```
icattle-ai-turing-core/
├── start-dashboard.ps1   ← Start everything
├── stop-dashboard.ps1    ← Stop everything
├── reset-dashboard.ps1   ← Reset database
└── POWERSHELL_SCRIPTS.md ← This file
```

## Support

For issues:
1. Check Docker Desktop is running
2. Check logs: `docker compose logs`
3. Try reset: `.\reset-dashboard.ps1`
4. See documentation in `docs/` directory

## Next Steps

After starting:
1. ✅ Open http://localhost:3000
2. ✅ Explore the dashboard
3. ✅ Generate test events: `pnpm test:generate batch 10`
4. ✅ View Kafka UI: http://localhost:8080
5. ✅ Check database: http://localhost:5050
6. ✅ Run tests: `pnpm test:run`

---

🚀 **Happy coding!**
