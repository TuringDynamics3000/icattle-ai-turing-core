# Diagnostic Script - Show actual errors

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Diagnostic Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test PostgreSQL connection
Write-Host "1. Testing PostgreSQL connection..." -ForegroundColor Yellow
docker exec icattle-postgres psql -U icattle -d icattle -c "SELECT version();"
Write-Host ""

# Show database list
Write-Host "2. Showing databases..." -ForegroundColor Yellow
docker exec icattle-postgres psql -U icattle -d icattle -c "\l"
Write-Host ""

# Show tables
Write-Host "3. Showing tables..." -ForegroundColor Yellow
docker exec icattle-postgres psql -U icattle -d icattle -c "\dt"
Write-Host ""

# Test drizzle-kit push with full output
Write-Host "4. Testing drizzle-kit push (full output)..." -ForegroundColor Yellow
Write-Host ""
pnpm db:push
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnostic Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
