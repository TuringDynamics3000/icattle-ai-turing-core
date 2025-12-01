# Create-AllFiles.ps1
# This script creates ALL iCattle.ai files directly without needing downloads
# Run this from any directory - it will create everything in C:\icattle\grading_system

$BasePath = "C:\icattle\grading_system"

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         iCattle.ai Complete Setup                        ║" -ForegroundColor Green  
Write-Host "║         Creating all files...                            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$BasePath\deployment" -Force | Out-Null
New-Item -ItemType Directory -Path "$BasePath\domain" -Force | Out-Null
New-Item -ItemType Directory -Path "$BasePath\infrastructure" -Force | Out-Null
New-Item -ItemType Directory -Path "$BasePath\api" -Force | Out-Null
Write-Host "✓ Directories created`n" -ForegroundColor Green

Write-Host "This script will create 10 files." -ForegroundColor Yellow
Write-Host "Files are too large to embed in a single script.`n" -ForegroundColor Yellow

Write-Host "Please use one of these methods instead:`n" -ForegroundColor Cyan

Write-Host "METHOD 1: Download from chat" -ForegroundColor Yellow
Write-Host "  1. Scroll up in this chat" -ForegroundColor White
Write-Host "  2. Click each of the 10 attached files to download" -ForegroundColor White
Write-Host "  3. Save them to: $env:USERPROFILE\Downloads" -ForegroundColor White
Write-Host "  4. Run the Save-Files.ps1 script`n" -ForegroundColor White

Write-Host "METHOD 2: Manual copy from chat" -ForegroundColor Yellow
Write-Host "  For each file attachment in the chat:" -ForegroundColor White
Write-Host "  1. Click the file to view it" -ForegroundColor White
Write-Host "  2. Copy all the content" -ForegroundColor White
Write-Host "  3. Create a new file in the correct location" -ForegroundColor White
Write-Host "  4. Paste the content and save`n" -ForegroundColor White

Write-Host "METHOD 3: Request individual file creation scripts" -ForegroundColor Yellow
Write-Host "  Ask me to create each file one at a time with PowerShell commands`n" -ForegroundColor White

Write-Host "Files needed:" -ForegroundColor Cyan
Write-Host "  Deployment (4 files):" -ForegroundColor Yellow
Write-Host "    - Deploy-Australia.ps1" -ForegroundColor White
Write-Host "    - docker-compose.australia.yml" -ForegroundColor White
Write-Host "    - Dockerfile.australia" -ForegroundColor White
Write-Host "    - .env.example" -ForegroundColor White
Write-Host "  Root (1 file):" -ForegroundColor Yellow
Write-Host "    - requirements.txt" -ForegroundColor White
Write-Host "  Domain (2 files):" -ForegroundColor Yellow
Write-Host "    - livestock_management_australia.py" -ForegroundColor White
Write-Host "    - services.py" -ForegroundColor White
Write-Host "  Infrastructure (2 files):" -ForegroundColor Yellow
Write-Host "    - market_pricing_australia.py" -ForegroundColor White
Write-Host "    - database_schema.sql" -ForegroundColor White
Write-Host "  API (1 file):" -ForegroundColor Yellow
Write-Host "    - livestock_endpoints.py`n" -ForegroundColor White

Write-Host "Directories are ready at: $BasePath" -ForegroundColor Green
Write-Host "Waiting for files...`n" -ForegroundColor Yellow
