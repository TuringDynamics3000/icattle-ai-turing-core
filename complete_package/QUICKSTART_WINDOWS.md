# iCattle.ai Windows Quick Start

**Get running in 5 minutes on Windows with PowerShell**

---

## 📦 What You Have

You've downloaded a complete package with:

```
complete_package/
├── Setup-iCattle.ps1              # Setup script (run this first)
├── deployment/
│   ├── Deploy-Australia.ps1       # Main deployment script
│   ├── docker-compose.australia.yml
│   ├── Dockerfile.australia
│   ├── .env.example
│   └── requirements.txt
├── domain/
│   ├── livestock_management_australia.py  # MSA grading
│   └── services.py
├── infrastructure/
│   ├── market_pricing_australia.py        # EYCI/NLRS pricing
│   └── database_schema.sql
└── api/
    └── livestock_endpoints.py             # FastAPI with Turing Protocol
```

---

## 🚀 5-Minute Setup

### Step 1: Extract Package

```powershell
# Extract to C:\icattle
Expand-Archive -Path icattle_windows_deployment.zip -DestinationPath C:\icattle

# Navigate to folder
cd C:\icattle\complete_package
```

### Step 2: Run Setup Script

```powershell
# Run setup (creates directory structure)
.\Setup-iCattle.ps1

# This creates:
# C:\icattle\grading_system\
#   ├── domain\
#   ├── infrastructure\
#   ├── api\
#   └── deployment\
```

### Step 3: Copy Files

```powershell
# Copy all files to the correct locations
cd C:\icattle\complete_package

# Copy deployment files
Copy-Item deployment\* C:\icattle\grading_system\deployment\ -Force

# Copy domain files
Copy-Item domain\* C:\icattle\grading_system\domain\ -Force

# Copy infrastructure files
Copy-Item infrastructure\* C:\icattle\grading_system\infrastructure\ -Force

# Copy API files
Copy-Item api\* C:\icattle\grading_system\api\ -Force

# Copy requirements
Copy-Item deployment\requirements.txt C:\icattle\grading_system\ -Force
```

### Step 4: Configure Environment

```powershell
cd C:\icattle\grading_system\deployment

# Create .env from template
Copy-Item .env.example .env

# Edit configuration
notepad .env
```

**Edit these values in .env:**

```ini
# Required changes:
DB_PASSWORD=YourSecurePassword123!
MLA_API_KEY=your-mla-api-key-here
NLRS_API_KEY=your-nlrs-api-key-here
API_SECRET_KEY=generate-a-secure-key-here

# Optional (for testing, can use demo keys):
MOCK_MARKET_DATA=true  # Use mock data for testing
```

### Step 5: Deploy!

```powershell
# Make sure Docker Desktop is running

# Deploy
.\Deploy-Australia.ps1 -Environment local

# Wait ~30 seconds for services to start
```

---

## ✅ Verify It's Working

```powershell
# Check health
Invoke-WebRequest -Uri http://localhost:8000/health

# Expected response:
# StatusCode: 200
# Content: {"status":"healthy","market":"AU","turing_protocol":"enforced"}

# Open API documentation
Start-Process "http://localhost:8000/docs"
```

---

## 🔐 Test Turing Protocol

```powershell
# Test 1: Without headers (should fail)
try {
    Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"animal_id": "982 000123456789", "weight_kg": 450.0}'
} catch {
    Write-Host "✓ Correctly rejected: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# Test 2: With Turing Protocol headers (should succeed)
$headers = @{
    "X-Tenant-ID" = "AU-QPIC12345"
    "X-Request-ID" = [guid]::NewGuid().ToString()
    "X-User-ID" = "grader_john"
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

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body

Write-Host "✓ Grading recorded successfully!" -ForegroundColor Green
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 📊 Common Commands

```powershell
# View logs
.\Deploy-Australia.ps1 -Environment logs

# Run tests
.\Deploy-Australia.ps1 -Environment test

# Stop services
.\Deploy-Australia.ps1 -Environment stop

# Restart
.\Deploy-Australia.ps1 -Environment local
```

---

## 🛠️ Troubleshooting

### Docker Not Running

```powershell
# Start Docker Desktop manually
# Or restart Docker service
Restart-Service docker
```

### Port 8000 Already in Use

```powershell
# Find process using port
netstat -ano | findstr :8000

# Kill process (replace <PID>)
Stop-Process -Id <PID> -Force
```

### Services Won't Start

```powershell
# Check logs
docker-compose -f docker-compose.australia.yml logs

# Clean restart
docker-compose -f docker-compose.australia.yml down -v
.\Deploy-Australia.ps1 -Environment local
```

---

## 📁 File Structure

After setup, you'll have:

```
C:\icattle\grading_system\
├── deployment\
│   ├── Deploy-Australia.ps1       ← Main script
│   ├── docker-compose.australia.yml
│   ├── Dockerfile.australia
│   ├── .env                       ← Your configuration
│   └── .env.example
├── domain\
│   ├── livestock_management_australia.py
│   └── services.py
├── infrastructure\
│   ├── market_pricing_australia.py
│   └── database_schema.sql
├── api\
│   └── livestock_endpoints.py
└── requirements.txt
```

---

## ✅ You're Ready!

**Your Australian livestock management system is now running!**

✅ MSA grading (5/4/3 Star)  
✅ EYCI/NLRS pricing  
✅ NLIS tag support  
✅ **Turing Protocol enforced (100%)**  
✅ Complete audit trail  

**Access:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Database: localhost:5432

**Next Steps:**
1. Grade your first animal (see API docs)
2. Calculate valuation
3. View audit trail in database

**Start grading cattle!** 🇦🇺
