# Setup-iCattle.ps1
# Complete setup script for iCattle.ai Australian deployment
# Run this script to create the complete file structure

param(
    [string]$BasePath = "C:\icattle"
)

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "║         iCattle.ai Setup Script                          ║" -ForegroundColor Green
Write-Host "║         Australian MSA Grading System                    ║" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Setting up iCattle.ai in: $BasePath`n" -ForegroundColor Yellow

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Yellow

$directories = @(
    "$BasePath\grading_system\domain",
    "$BasePath\grading_system\infrastructure",
    "$BasePath\grading_system\api",
    "$BasePath\grading_system\deployment",
    "$BasePath\grading_system\tests"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "✓ Created: $dir" -ForegroundColor Green
}

Write-Host "`nDirectory structure created successfully!`n" -ForegroundColor Green

# Instructions for next steps
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║         NEXT STEPS                                       ║" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "1. Copy the following files from the package to the deployment folder:" -ForegroundColor Yellow
Write-Host "   $BasePath\grading_system\deployment\`n" -ForegroundColor White

Write-Host "   Files to copy:" -ForegroundColor Yellow
Write-Host "   - Deploy-Australia.ps1" -ForegroundColor White
Write-Host "   - docker-compose.australia.yml" -ForegroundColor White
Write-Host "   - Dockerfile.australia" -ForegroundColor White
Write-Host "   - .env.example" -ForegroundColor White
Write-Host "   - requirements.txt`n" -ForegroundColor White

Write-Host "2. Copy domain files:" -ForegroundColor Yellow
Write-Host "   $BasePath\grading_system\domain\`n" -ForegroundColor White
Write-Host "   - livestock_management_australia.py" -ForegroundColor White
Write-Host "   - services.py`n" -ForegroundColor White

Write-Host "3. Copy infrastructure files:" -ForegroundColor Yellow
Write-Host "   $BasePath\grading_system\infrastructure\`n" -ForegroundColor White
Write-Host "   - market_pricing_australia.py" -ForegroundColor White
Write-Host "   - database_schema.sql`n" -ForegroundColor White

Write-Host "4. Copy API files:" -ForegroundColor Yellow
Write-Host "   $BasePath\grading_system\api\`n" -ForegroundColor White
Write-Host "   - livestock_endpoints.py`n" -ForegroundColor White

Write-Host "5. Configure environment:" -ForegroundColor Yellow
Write-Host "   cd $BasePath\grading_system\deployment" -ForegroundColor White
Write-Host "   Copy-Item .env.example .env" -ForegroundColor White
Write-Host "   notepad .env  # Edit with your API keys`n" -ForegroundColor White

Write-Host "6. Deploy:" -ForegroundColor Yellow
Write-Host "   .\Deploy-Australia.ps1 -Environment local`n" -ForegroundColor White

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "║         Setup Complete!                                  ║" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# Create a helper script to copy files
$copyScriptPath = "$BasePath\grading_system\Copy-Files.ps1"
$copyScriptContent = @'
# Copy-Files.ps1
# Helper script to copy files from download location

param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath
)

Write-Host "Copying files from: $SourcePath" -ForegroundColor Yellow

# Copy deployment files
Copy-Item "$SourcePath\Deploy-Australia.ps1" ".\deployment\" -Force
Copy-Item "$SourcePath\docker-compose.australia.yml" ".\deployment\" -Force
Copy-Item "$SourcePath\Dockerfile.australia" ".\deployment\" -Force
Copy-Item "$SourcePath\.env.example" ".\deployment\" -Force
Copy-Item "$SourcePath\requirements.txt" ".\" -Force

# Copy domain files
Copy-Item "$SourcePath\domain\*.py" ".\domain\" -Force

# Copy infrastructure files
Copy-Item "$SourcePath\infrastructure\*.py" ".\infrastructure\" -Force
Copy-Item "$SourcePath\infrastructure\*.sql" ".\infrastructure\" -Force

# Copy API files
Copy-Item "$SourcePath\api\*.py" ".\api\" -Force

Write-Host "`nFiles copied successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. cd deployment" -ForegroundColor White
Write-Host "2. Copy-Item .env.example .env" -ForegroundColor White
Write-Host "3. notepad .env  # Edit with your API keys" -ForegroundColor White
Write-Host "4. .\Deploy-Australia.ps1 -Environment local" -ForegroundColor White
'@

Set-Content -Path $copyScriptPath -Value $copyScriptContent
Write-Host "Created helper script: $copyScriptPath`n" -ForegroundColor Green

Write-Host "To copy files from your download location, run:" -ForegroundColor Yellow
Write-Host "cd $BasePath\grading_system" -ForegroundColor White
Write-Host ".\Copy-Files.ps1 -SourcePath 'C:\Path\To\Downloaded\Files'`n" -ForegroundColor White
