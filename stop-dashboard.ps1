# iCattle Dashboard - PowerShell Stop Script
# Run this script to stop all services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iCattle Dashboard - Stop Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "ERROR: Please run this script from the icattle-ai-turing-core directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Stop Docker services
Write-Host "Stopping Docker services..." -ForegroundColor Yellow
docker compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] All services stopped" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to stop services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All services have been stopped." -ForegroundColor Green
Write-Host ""
