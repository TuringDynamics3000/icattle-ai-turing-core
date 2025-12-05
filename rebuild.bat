@echo off
echo ========================================
echo iCattle Database Rebuild
echo ========================================
echo.
echo This will rebuild your database with:
echo - 3 farmers
echo - 3,000 cattle (1,000 each)
echo.
echo WARNING: This will DELETE all existing data!
echo.
pause
echo.
echo Starting rebuild...
echo.
pnpm tsx scripts/rebuild-database.ts
echo.
echo ========================================
echo Rebuild complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start dev server: pnpm dev
echo 2. Open http://localhost:3001
echo 3. Check Dashboard shows "3 Total Clients"
echo.
pause
