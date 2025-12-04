# iCattle Dashboard - PowerShell Reset Script
# Run this script to reset the database and restart services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iCattle Dashboard - Reset Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script from the icattle-ai-turing-core directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Confirm reset
Write-Host "WARNING: This will delete all data in the database!" -ForegroundColor Red
Write-Host "Are you sure you want to continue? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -ne "Y" -and $response -ne "y") {
    Write-Host "Reset cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Stop services
Write-Host "Stopping services..." -ForegroundColor Yellow
docker compose down
Write-Host "[OK] Services stopped" -ForegroundColor Green
Write-Host ""

# Remove volumes
Write-Host "Removing database volumes..." -ForegroundColor Yellow
docker volume rm icattle-ai-turing-core_postgres-data -ErrorAction SilentlyContinue
docker volume rm icattle-ai-turing-core_pgadmin-data -ErrorAction SilentlyContinue
Write-Host "[OK] Volumes removed" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "Starting services..." -ForegroundColor Yellow
docker compose up -d
Write-Host "[OK] Services started" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $attempt++
    Start-Sleep -Seconds 2
    
    docker exec icattle-postgres pg_isready -U icattle > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
    } else {
        Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "WARNING: PostgreSQL may not be fully ready" -ForegroundColor Yellow
} else {
    Write-Host "[OK] PostgreSQL is ready" -ForegroundColor Green
}
Write-Host ""

# Push schema
Write-Host "Pushing database schema..." -ForegroundColor Yellow
pnpm db:push
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database schema pushed" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to push database schema" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Seed data
Write-Host "Seeding test data..." -ForegroundColor Yellow
pnpm db:seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Test data seeded" -ForegroundColor Green
} else {
    Write-Host "WARNING: Failed to seed test data" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Reset Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database has been reset with fresh test data." -ForegroundColor Green
Write-Host ""
Write-Host "To start the dashboard, run:" -ForegroundColor Yellow
Write-Host "  .\start-dashboard.ps1" -ForegroundColor White
Write-Host ""
