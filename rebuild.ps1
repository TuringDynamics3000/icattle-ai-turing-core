# iCattle Database Rebuild Script
# ================================
# Rebuilds PostgreSQL database with 3 farmers and 3,000 cattle

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "iCattle Database Rebuild" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will rebuild your database with:" -ForegroundColor Yellow
Write-Host "  - 3 farmers (Riverside, Highland, Golden Plains)" -ForegroundColor Yellow
Write-Host "  - 3,000 cattle (1,000 per farmer)" -ForegroundColor Yellow
Write-Host "  - All status fields set to 'active'" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This will DELETE all existing data!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Type 'yes' to continue"

if ($confirmation -ne "yes") {
    Write-Host "Rebuild cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting rebuild..." -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$DATABASE_URL = $env:DATABASE_URL

if (-Not $DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL: $DATABASE_URL" -ForegroundColor Gray
Write-Host ""

# Parse database URL
$dbUrl = [System.Uri]$DATABASE_URL
$dbName = $dbUrl.AbsolutePath.TrimStart('/')
$dbUser = $dbUrl.UserInfo.Split(':')[0]
$dbPassword = $dbUrl.UserInfo.Split(':')[1]
$dbHost = $dbUrl.Host
$dbPort = $dbUrl.Port

Write-Host "Database: $dbName" -ForegroundColor Gray
Write-Host "Host: ${dbHost}:${dbPort}" -ForegroundColor Gray
Write-Host ""

# Admin connection string (to postgres database)
$adminDbUrl = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres"

# Step 1: Drop and recreate database
Write-Host "Step 1: Dropping and recreating database..." -ForegroundColor Cyan

try {
    # Terminate existing connections
    Write-Host "  Terminating existing connections..." -ForegroundColor Gray
    $terminateQuery = @"
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$dbName'
  AND pid <> pg_backend_pid();
"@
    
    $env:PGPASSWORD = $dbPassword
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c $terminateQuery 2>&1 | Out-Null
    
    # Drop database
    Write-Host "  Dropping database..." -ForegroundColor Gray
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE IF EXISTS $dbName;" 2>&1 | Out-Null
    
    # Create database
    Write-Host "  Creating fresh database..." -ForegroundColor Gray
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;" 2>&1 | Out-Null
    
    Write-Host "  Database recreated successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to drop/create database!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Run migrations
Write-Host "Step 2: Running Drizzle migrations..." -ForegroundColor Cyan

try {
    pnpm drizzle-kit push
    if ($LASTEXITCODE -ne 0) {
        throw "Drizzle migration failed"
    }
    Write-Host "  Migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to run migrations!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 3: Seed database
Write-Host "Step 3: Seeding database with 3 farmers and 3,000 cattle..." -ForegroundColor Cyan

try {
    pnpm tsx scripts/seed-3-farmers-3000-cattle.ts
    if ($LASTEXITCODE -ne 0) {
        throw "Seeding failed"
    }
    Write-Host "  Seeding completed successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to seed database!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 4: Verify
Write-Host "Step 4: Verifying database..." -ForegroundColor Cyan

try {
    $clientCount = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c "SELECT COUNT(*) FROM clients WHERE status = 'active';"
    $cattleCount = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c "SELECT COUNT(*) FROM cattle WHERE status = 'active';"
    $totalValue = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c "SELECT SUM(current_valuation) FROM cattle WHERE status = 'active';"
    
    $clientCount = $clientCount.Trim()
    $cattleCount = $cattleCount.Trim()
    $totalValue = [math]::Round([decimal]$totalValue.Trim() / 100, 2)
    
    Write-Host "  Active clients: $clientCount" -ForegroundColor Green
    Write-Host "  Active cattle: $cattleCount" -ForegroundColor Green
    Write-Host "  Total portfolio value: `$$($totalValue.ToString('N2'))" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "WARNING: Could not verify database" -ForegroundColor Yellow
    Write-Host ""
}

# Success!
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REBUILD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start dev server: pnpm dev" -ForegroundColor White
Write-Host "  2. Open http://localhost:3001" -ForegroundColor White
Write-Host "  3. Check Dashboard shows '3 Total Clients'" -ForegroundColor White
Write-Host "  4. Verify Bank View shows proper diversification" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
