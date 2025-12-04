#!/usr/bin/env pwsh
# Fix PostgreSQL Database Script
# Ensures the icattle user and database are properly created

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix iCattle Database" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Checking PostgreSQL container..." -ForegroundColor Yellow
$containerRunning = docker ps --filter "name=icattle-postgres" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host "[ERROR] PostgreSQL container is not running!" -ForegroundColor Red
    Write-Host "`nStart it with: docker compose up -d postgres`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] PostgreSQL container is running`n" -ForegroundColor Green

Write-Host "Creating icattle user and database..." -ForegroundColor Yellow

# Create user and database using postgres superuser
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

# Execute SQL as postgres superuser
$sql | docker exec -i icattle-postgres psql -U postgres 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] User and database created`n" -ForegroundColor Green
} else {
    Write-Host "[WARNING] User may already exist (this is OK)`n" -ForegroundColor Yellow
}

Write-Host "Granting schema privileges..." -ForegroundColor Yellow

# Grant privileges on public schema
$schemaSql = @"
GRANT ALL ON SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO icattle;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO icattle;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO icattle;
"@

$schemaSql | docker exec -i icattle-postgres psql -U postgres -d icattle 2>&1 | Out-Null

Write-Host "[OK] Privileges granted`n" -ForegroundColor Green

Write-Host "Waiting for PostgreSQL to fully initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Testing connection as icattle user..." -ForegroundColor Yellow

$testResult = docker exec icattle-postgres psql -U icattle -d icattle -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connection test successful!`n" -ForegroundColor Green
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Database Fixed!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "You can now run:" -ForegroundColor White
    Write-Host "  pnpm db:push       # Push schema" -ForegroundColor Cyan
    Write-Host "  pnpm db:seed-full  # Seed 268 cattle`n" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Connection test failed!" -ForegroundColor Red
    Write-Host "`nError details:" -ForegroundColor Yellow
    Write-Host $testResult -ForegroundColor Red
    Write-Host "`nTry restarting PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  docker compose restart postgres`n" -ForegroundColor Cyan
    exit 1
}
