#!/usr/bin/env pwsh
# Complete Setup Script - iCattle Dashboard with 268 Cattle
# This script does EVERYTHING in the right order

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iCattle Dashboard - Complete Setup" -ForegroundColor Cyan
Write-Host "  268 Cattle with Turing Protocol" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Stop everything
Write-Host "[1/8] Stopping existing containers..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null
Write-Host "[OK] Containers stopped`n" -ForegroundColor Green

# Step 2: Remove old data
Write-Host "[2/8] Removing old PostgreSQL data..." -ForegroundColor Yellow
docker volume rm icattle-ai-turing-core_postgres-data 2>&1 | Out-Null
Write-Host "[OK] Old data removed`n" -ForegroundColor Green

# Step 3: Start services
Write-Host "[3/8] Starting Docker services..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start Docker services!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker services started`n" -ForegroundColor Green

# Step 4: Wait for PostgreSQL
Write-Host "[4/8] Waiting for PostgreSQL to initialize (90 seconds)..." -ForegroundColor Yellow
Write-Host "      This is important - PostgreSQL needs time to create the database" -ForegroundColor Gray

for ($i = 1; $i -le 90; $i++) {
    Write-Progress -Activity "Waiting for PostgreSQL" -Status "$i/90 seconds" -PercentComplete (($i/90)*100)
    Start-Sleep -Seconds 1
}
Write-Progress -Activity "Waiting for PostgreSQL" -Completed
Write-Host "[OK] PostgreSQL should be ready`n" -ForegroundColor Green

# Step 5: Create database user
Write-Host "[5/8] Creating icattle user and database..." -ForegroundColor Yellow

$sql = @"
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'icattle') THEN
    CREATE ROLE icattle WITH LOGIN PASSWORD 'icattle_dev_password';
    ALTER ROLE icattle CREATEDB;
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE icattle OWNER icattle'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'icattle')\gexec

GRANT ALL PRIVILEGES ON DATABASE icattle TO icattle;
"@

$sql | docker exec -i icattle-postgres psql -U postgres 2>&1 | Out-Null

$schemaSql = @"
GRANT ALL ON SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO icattle;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO icattle;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO icattle;
"@

$schemaSql | docker exec -i icattle-postgres psql -U postgres -d icattle 2>&1 | Out-Null

# Test connection
$testResult = docker exec icattle-postgres psql -U icattle -d icattle -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create icattle user!" -ForegroundColor Red
    Write-Host "Error: $testResult" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Database user created and tested`n" -ForegroundColor Green

# Step 6: Push schema
Write-Host "[6/8] Pushing database schema..." -ForegroundColor Yellow
pnpm db:push 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to push schema!" -ForegroundColor Red
    Write-Host "Try running manually: pnpm db:push" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Schema pushed`n" -ForegroundColor Green

# Step 7: Seed data
Write-Host "[7/8] Seeding 268 cattle with Turing Protocol..." -ForegroundColor Yellow
Write-Host "      This will take 2-5 minutes..." -ForegroundColor Gray

pnpm db:seed-full

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Seeding had some issues, but may have partially succeeded" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Database seeded!`n" -ForegroundColor Green
}

# Step 8: Done
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Access Points:" -ForegroundColor White
Write-Host "  Dashboard:         http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Kafka UI:          http://localhost:8080" -ForegroundColor Cyan
Write-Host "  pgAdmin:           http://localhost:5050" -ForegroundColor Cyan
Write-Host "     Credentials:    admin@icattle.local / admin`n" -ForegroundColor Gray

Write-Host "Start the dashboard:" -ForegroundColor White
Write-Host "  pnpm dev`n" -ForegroundColor Cyan

Write-Host "Press any key to start the dashboard now, or Ctrl+C to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStarting dashboard...`n" -ForegroundColor Green
pnpm dev
