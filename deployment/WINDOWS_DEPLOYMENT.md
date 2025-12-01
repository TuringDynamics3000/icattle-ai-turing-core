# Windows Deployment Guide

**iCattle.ai Australian Deployment for Windows/PowerShell**

---

## 🎯 Quick Start (Windows)

### Prerequisites

1. **Install Docker Desktop for Windows**
   ```powershell
   # Download from: https://www.docker.com/products/docker-desktop
   # Or use winget:
   winget install Docker.DockerDesktop
   ```

2. **Install Git for Windows** (optional)
   ```powershell
   winget install Git.Git
   ```

3. **Enable WSL 2** (required for Docker)
   ```powershell
   # Run as Administrator
   wsl --install
   # Restart computer
   ```

---

## 🚀 Deployment Steps

### Step 1: Download Package

```powershell
# Extract the deployment package
Expand-Archive -Path icattle_australia_deployment.tar.gz -DestinationPath C:\icattle

# Navigate to deployment folder
cd C:\icattle\grading_system\deployment
```

### Step 2: Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit with Notepad
notepad .env

# Or use VS Code
code .env
```

**Required Changes in .env:**
```ini
# Change these values:
DB_PASSWORD=YourSecurePassword123!
MLA_API_KEY=your-mla-api-key-here
NLRS_API_KEY=your-nlrs-api-key-here
API_SECRET_KEY=generate-a-secure-random-key-here
```

### Step 3: Deploy Locally

```powershell
# Make sure Docker Desktop is running

# Deploy
.\Deploy-Australia.ps1 -Environment local

# Wait for services to start (~30 seconds)
```

### Step 4: Verify Deployment

```powershell
# Check health
Invoke-WebRequest -Uri http://localhost:8000/health

# Expected response:
# StatusCode: 200
# Content: {"status":"healthy","market":"AU","turing_protocol":"enforced"}

# Open API documentation in browser
Start-Process "http://localhost:8000/docs"
```

### Step 5: Test Turing Protocol

```powershell
# Test without headers (should fail with 400)
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"animal_id": "982 000123456789", "weight_kg": 450.0}'

# Test with Turing Protocol headers (should succeed with 200)
$headers = @{
    "X-Tenant-ID" = "AU-TEST-001"
    "X-Request-ID" = [guid]::NewGuid().ToString()
    "X-User-ID" = "test_user"
    "X-Device-ID" = "WINDOWS-001"
    "X-Geo-Location" = "-27.4705,153.0260"
}

$body = @{
    animal_id = "982 000123456789"
    weight_kg = 450.0
    quality_grade = "4 Star"
    marbling_score = 7
    fat_score = "3"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

---

## 📊 PowerShell Commands

### Deployment

```powershell
# Deploy locally
.\Deploy-Australia.ps1 -Environment local

# Run tests
.\Deploy-Australia.ps1 -Environment test

# View logs
.\Deploy-Australia.ps1 -Environment logs

# Stop services
.\Deploy-Australia.ps1 -Environment stop

# Deploy to AWS production
.\Deploy-Australia.ps1 -Environment production
```

### Docker Management

```powershell
# View running containers
docker ps

# View all containers
docker-compose -f docker-compose.australia.yml ps

# View logs
docker-compose -f docker-compose.australia.yml logs api
docker-compose -f docker-compose.australia.yml logs postgres
docker-compose -f docker-compose.australia.yml logs kafka

# Restart services
docker-compose -f docker-compose.australia.yml restart

# Stop all services
docker-compose -f docker-compose.australia.yml down

# Remove all data (WARNING: deletes database)
docker-compose -f docker-compose.australia.yml down -v
```

### Database Access

```powershell
# Connect to PostgreSQL
docker-compose -f docker-compose.australia.yml exec postgres `
    psql -U admin -d icattle_au

# Run SQL query
docker-compose -f docker-compose.australia.yml exec postgres `
    psql -U admin -d icattle_au -c "SELECT * FROM audit_log LIMIT 5;"

# Backup database
docker-compose -f docker-compose.australia.yml exec postgres `
    pg_dump -U admin icattle_au > "backup_$(Get-Date -Format 'yyyyMMdd').sql"

# Restore database
Get-Content backup_20250101.sql | docker-compose -f docker-compose.australia.yml exec -T postgres `
    psql -U admin icattle_au
```

---

## 🔐 Turing Protocol Testing (PowerShell)

### Complete Test Script

```powershell
# Test-TuringProtocol.ps1

# Test 1: No headers (should fail)
Write-Host "`nTest 1: Request without Turing Protocol headers" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"animal_id": "982 000123456789", "weight_kg": 450.0}' `
        -ErrorAction Stop
    Write-Host "FAILED: Expected 400, got $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "PASSED: Correctly rejected (400)" -ForegroundColor Green
    }
}

# Test 2: With headers (should succeed)
Write-Host "`nTest 2: Request with Turing Protocol headers" -ForegroundColor Yellow
$headers = @{
    "X-Tenant-ID" = "AU-QPIC12345"
    "X-Request-ID" = [guid]::NewGuid().ToString()
    "X-User-ID" = "grader_john"
    "X-Device-ID" = "TABLET-001"
    "X-Geo-Location" = "-27.4705,153.0260"
}

$body = @{
    animal_id = "982 000123456789"
    weight_kg = 450.0
    quality_grade = "4 Star"
    marbling_score = 7
    fat_score = "3"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "PASSED: Request succeeded (200)" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verify audit log
Write-Host "`nTest 3: Verify audit trail" -ForegroundColor Yellow
docker-compose -f docker-compose.australia.yml exec postgres `
    psql -U admin -d icattle_au -c `
    "SELECT tenant_id, user_id, endpoint, status_code, timestamp FROM audit_log ORDER BY timestamp DESC LIMIT 5;"
```

---

## 🧪 Testing

### Run All Tests

```powershell
.\Deploy-Australia.ps1 -Environment test
```

### Manual API Testing

```powershell
# Grade an animal
$headers = @{
    "X-Tenant-ID" = "AU-QPIC12345"
    "X-Request-ID" = [guid]::NewGuid().ToString()
    "X-User-ID" = "grader_john"
    "X-Device-ID" = "TABLET-001"
    "X-Geo-Location" = "-27.4705,153.0260"
}

$grading = @{
    animal_id = "982 000123456789"
    weight_kg = 450.0
    quality_grade = "4 Star"
    marbling_score = 7
    fat_score = "3"
    eye_muscle_area_sq_cm = 85.0
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $grading

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Calculate valuation
$valuation = @{
    animal_id = "982 000123456789"
    weight_kg = 450.0
    quality_grade = "4 Star"
    region = "Queensland"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/valuation" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $valuation

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 🛠️ Troubleshooting (Windows)

### Docker Desktop Not Starting

```powershell
# Check WSL 2 is installed
wsl --list --verbose

# Update WSL
wsl --update

# Restart Docker Desktop
Restart-Service docker
```

### Port Already in Use

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
Stop-Process -Id <PID> -Force

# Or change port in docker-compose.australia.yml
# ports:
#   - "8001:8000"  # Use 8001 instead
```

### Services Won't Start

```powershell
# Check Docker logs
docker-compose -f docker-compose.australia.yml logs

# Restart Docker Desktop
# Right-click Docker icon in system tray > Restart

# Clean up and restart
docker-compose -f docker-compose.australia.yml down
docker system prune -f
.\Deploy-Australia.ps1 -Environment local
```

### Database Connection Failed

```powershell
# Check PostgreSQL is running
docker-compose -f docker-compose.australia.yml ps postgres

# View PostgreSQL logs
docker-compose -f docker-compose.australia.yml logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.australia.yml restart postgres
```

---

## 📁 Windows File Paths

### Project Structure

```
C:\icattle\
└── grading_system\
    ├── deployment\
    │   ├── Deploy-Australia.ps1          # PowerShell deployment script
    │   ├── docker-compose.australia.yml  # Docker Compose config
    │   ├── Dockerfile.australia          # Docker image
    │   ├── .env.example                  # Environment template
    │   └── .env                          # Your configuration
    ├── domain\
    │   ├── livestock_management_australia.py
    │   └── services.py
    ├── infrastructure\
    │   ├── market_pricing_australia.py
    │   └── database_schema.sql
    └── api\
        └── livestock_endpoints.py
```

### Log Files

```powershell
# API logs
docker-compose -f docker-compose.australia.yml logs api > C:\icattle\logs\api.log

# Database logs
docker-compose -f docker-compose.australia.yml logs postgres > C:\icattle\logs\postgres.log

# All logs
docker-compose -f docker-compose.australia.yml logs > C:\icattle\logs\all.log
```

---

## 🔒 Security (Windows)

### Generate Secure Keys

```powershell
# Generate API secret key
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$apiKey = [Convert]::ToBase64String($bytes)
Write-Host "API_SECRET_KEY=$apiKey"

# Generate database password
Add-Type -AssemblyName 'System.Web'
$dbPassword = [System.Web.Security.Membership]::GeneratePassword(16, 4)
Write-Host "DB_PASSWORD=$dbPassword"
```

### Firewall Rules

```powershell
# Allow Docker ports (run as Administrator)
New-NetFirewallRule -DisplayName "iCattle API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "iCattle PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

---

## 📊 Monitoring (Windows)

### Health Checks

```powershell
# API health
Invoke-WebRequest -Uri http://localhost:8000/health | Select-Object StatusCode, Content

# Database health
docker-compose -f docker-compose.australia.yml exec postgres pg_isready -U admin -d icattle_au

# All services
docker-compose -f docker-compose.australia.yml ps
```

### Performance Monitoring

```powershell
# Container stats
docker stats

# Specific container
docker stats icattle-au-api

# Resource usage
docker-compose -f docker-compose.australia.yml top
```

---

## 💰 Cost Estimate (Windows Development)

### Local Development
- **Free** (runs on your Windows machine)
- Docker Desktop: Free for personal use

### AWS Production
- Same as Linux deployment: ~$2,370/month AUD

---

## ✅ Windows Deployment Checklist

### Prerequisites
- [ ] Windows 10/11 Pro or Enterprise
- [ ] WSL 2 enabled
- [ ] Docker Desktop installed
- [ ] PowerShell 5.1 or higher

### Deployment
- [ ] Package extracted to C:\icattle
- [ ] .env file configured
- [ ] Docker Desktop running
- [ ] Services started
- [ ] Health check passing
- [ ] Turing Protocol enforced

### Testing
- [ ] API accessible at http://localhost:8000
- [ ] Documentation at http://localhost:8000/docs
- [ ] Turing Protocol tests passing
- [ ] MSA grading working
- [ ] Audit log capturing requests

---

## 🎉 You're Ready!

**Your Australian livestock management system is running on Windows!**

✅ MSA grading system  
✅ EYCI/NLRS pricing  
✅ NLIS tag support  
✅ **Turing Protocol enforcement (100%)**  
✅ Complete audit trail  
✅ Windows PowerShell support  

**Next Steps:**
1. Open API docs: http://localhost:8000/docs
2. Test Turing Protocol enforcement
3. Grade your first animal
4. View audit trail

**Start grading cattle!** 🇦🇺
