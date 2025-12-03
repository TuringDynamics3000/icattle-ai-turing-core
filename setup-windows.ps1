# iCattle Dashboard - Windows Setup Script
# This script sets up the complete Kafka event streaming infrastructure on Windows

Write-Host "🐄 iCattle Dashboard - Kafka Event Streaming Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop for Windows first." -ForegroundColor Red
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if pnpm is installed
Write-Host "Checking pnpm installation..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm found: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ pnpm not found. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✓ pnpm installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 1: Starting Kafka infrastructure..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Start Docker Compose
Write-Host "Starting Kafka, Zookeeper, PostgreSQL, and Kafka UI..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Kafka infrastructure started successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start Kafka infrastructure" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Waiting for services to be ready..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Waiting 30 seconds for Kafka and PostgreSQL to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Step 3: Creating .env file..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file with Kafka configuration..." -ForegroundColor Yellow
    
    $envContent = @"
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=icattle-dashboard
KAFKA_ENABLED=true
KAFKA_TOPIC_PREFIX=icattle

# Golden Record Database
GOLDEN_RECORD_DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle_golden_record
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Installing dependencies..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 5: Starting development server..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Starting iCattle Dashboard..." -ForegroundColor Yellow
Write-Host ""

# Start the dev server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm dev"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running:" -ForegroundColor Yellow
Write-Host "  • iCattle Dashboard:  http://localhost:3000" -ForegroundColor White
Write-Host "  • Kafka UI:           http://localhost:8080" -ForegroundColor White
Write-Host "  • Kafka Broker:       localhost:9092" -ForegroundColor White
Write-Host "  • PostgreSQL:         localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Navigate to a cattle detail page" -ForegroundColor White
Write-Host "  3. Perform a health check or movement operation" -ForegroundColor White
Write-Host "  4. Check Kafka UI at http://localhost:8080 to see events" -ForegroundColor White
Write-Host "  5. View the Audit Trail tab to see Golden Record events" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
