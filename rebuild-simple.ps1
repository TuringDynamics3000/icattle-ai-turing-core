# Simple iCattle Database Rebuild
# ================================
# Just runs the TypeScript rebuild script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   iCattle Database Rebuild" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  - Drop and recreate the database" -ForegroundColor Yellow
Write-Host "  - Run all migrations" -ForegroundColor Yellow
Write-Host "  - Seed with 3 farmers" -ForegroundColor Yellow
Write-Host "  - Create 3,000 cattle (1,000 each)" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: ALL EXISTING DATA WILL BE DELETED!" -ForegroundColor Red -BackgroundColor Black
Write-Host ""

$confirmation = Read-Host "Type 'YES' to continue"

if ($confirmation -ne "YES") {
    Write-Host ""
    Write-Host "Rebuild cancelled." -ForegroundColor Yellow
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "Starting rebuild..." -ForegroundColor Green
Write-Host ""

# Run the TypeScript rebuild script
pnpm tsx scripts/rebuild-database.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   REBUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. pnpm dev          (start dev server)" -ForegroundColor White
    Write-Host "  2. Open http://localhost:3001" -ForegroundColor White
    Write-Host "  3. Check Dashboard shows '3 Total Clients'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   REBUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
