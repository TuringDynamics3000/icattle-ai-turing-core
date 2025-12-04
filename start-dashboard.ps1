# iCattle Dashboard - PowerShell Startup Script
# Run this script to start the entire iCattle Dashboard stack

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iCattle Dashboard - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script from the icattle-ai-turing-core directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$missingTools = @()

if (-not (Test-Command "docker")) {
    $missingTools += "Docker Desktop"
}

if (-not (Test-Command "pnpm")) {
    $missingTools += "pnpm"
}

if (-not (Test-Command "node")) {
    $missingTools += "Node.js"
}

if ($missingTools.Count -gt 0) {
    Write-Host "ERROR: Missing required tools:" -ForegroundColor Red
    foreach ($tool in $missingTools) {
        Write-Host "  - $tool" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install:" -ForegroundColor Yellow
    Write-Host "  - Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "  - Node.js 22+: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  - pnpm: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] All prerequisites found" -ForegroundColor Green
Write-Host ""

# Pull latest changes
Write-Host "Pulling latest changes from GitHub..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git pull failed. Continuing with local version..." -ForegroundColor Yellow
}
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env"
        Write-Host "[OK] .env file created" -ForegroundColor Green
    } else {
        Write-Host "Creating default .env file..." -ForegroundColor Yellow
        $envContent = @"
# iCattle Dashboard - Local Development
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_PREFIX=turing
OAUTH_SERVER_URL=http://localhost:4000
APP_ID=dev-app-id
COOKIE_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
PORT=3000
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "[OK] Default .env file created" -ForegroundColor Green
    }
    Write-Host ""
}

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Docker is running" -ForegroundColor Green
Write-Host ""

# Start Docker services
Write-Host "Starting Docker services (PostgreSQL, Kafka, Zookeeper)..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker services" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker services started" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $attempt++
    Start-Sleep -Seconds 2
    
    docker exec icattle-postgres pg_isready -U icattle -d icattle > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        # Double check the user exists
        docker exec icattle-postgres psql -U icattle -d icattle -c "SELECT 1" > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
        }
    }
    
    if (-not $ready) {
        Write-Host "  Attempt $attempt/$maxAttempts... (waiting for PostgreSQL to fully initialize)" -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "ERROR: PostgreSQL did not become ready in time" -ForegroundColor Red
    Write-Host "Please check Docker logs: docker compose logs postgres" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "[OK] PostgreSQL is ready" -ForegroundColor Green
}
Write-Host ""

# Push database schema with retry
Write-Host "Pushing database schema..." -ForegroundColor Yellow
$pushAttempts = 3
$pushSuccess = $false

for ($i = 1; $i -le $pushAttempts; $i++) {
    if ($i -gt 1) {
        Write-Host "  Retry attempt $i/$pushAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
    
    pnpm db:push 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $pushSuccess = $true
        break
    }
}

if (-not $pushSuccess) {
    Write-Host "ERROR: Failed to push database schema after $pushAttempts attempts" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "  1. Check PostgreSQL logs: docker compose logs postgres" -ForegroundColor White
    Write-Host "  2. Restart PostgreSQL: docker compose restart postgres" -ForegroundColor White
    Write-Host "  3. Try manually: pnpm db:push" -ForegroundColor White
    Write-Host "  4. Reset everything: .\reset-dashboard.ps1" -ForegroundColor White
    exit 1
} else {
    Write-Host "[OK] Database schema pushed" -ForegroundColor Green
}
Write-Host ""

# Ask if user wants to seed data
Write-Host "Do you want to seed test data? (Y/N)" -ForegroundColor Yellow
$seedResponse = Read-Host
if ($seedResponse -eq "Y" -or $seedResponse -eq "y") {
    Write-Host "Seeding test data..." -ForegroundColor Yellow
    pnpm db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Test data seeded" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Failed to seed test data" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Display service URLs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Ready!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Green
Write-Host "  Dashboard:         http://localhost:3000" -ForegroundColor White
Write-Host "  Kafka UI:          http://localhost:8080" -ForegroundColor White
Write-Host "  pgAdmin:           http://localhost:5050" -ForegroundColor White
Write-Host "     Credentials:    admin@icattle.local / admin" -ForegroundColor Gray
Write-Host "  PostgreSQL:        localhost:5432" -ForegroundColor White
Write-Host "     Credentials:    icattle / icattle_dev_password" -ForegroundColor Gray
Write-Host ""

# Start development server
Write-Host "Starting iCattle Dashboard..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dashboard will open on:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the dashboard" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
pnpm dev
