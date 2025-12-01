# Windows Integration Guide
## Adding Livestock Management to Your Existing iCattle.ai Project

**Target Environment:** Windows, PowerShell, C:\Projects\iCattle\icattle_ai

---

## 📋 Prerequisites

Your existing iCattle.ai project has:
- ✅ Production API running on port 8002 (`main_production.py`)
- ✅ WebSocket dashboard on port 8003 (`dashboard_server.py`)
- ✅ PostgreSQL on port 5433
- ✅ 6,000-animal simulation working (`simulate_with_dashboard.py`)
- ✅ Turing Protocol enforcement (5 required headers)

---

## 🚀 Step-by-Step Integration

### Step 1: Download Files from Sandbox

**Option A: Copy files individually**

```powershell
# From your Windows machine, copy each file from the sandbox
# (You'll need to transfer these files from the sandbox to your local machine)
```

**Option B: Download the complete package**

The complete system is available in:
```
/home/ubuntu/icattle_livestock_management_system.tar.gz
```

---

### Step 2: Create Directory Structure

```powershell
# Navigate to your project
cd C:\Projects\iCattle\icattle_ai

# Create new directories for livestock management
New-Item -ItemType Directory -Path "src\domain\livestock" -Force
New-Item -ItemType Directory -Path "src\infrastructure\pricing" -Force
New-Item -ItemType Directory -Path "database\migrations" -Force
New-Item -ItemType Directory -Path "tests\livestock" -Force
```

---

### Step 3: Copy Domain Files

```powershell
# Copy domain model
Copy-Item "livestock_management.py" -Destination "C:\Projects\iCattle\icattle_ai\src\domain\livestock\"

# Copy domain services
Copy-Item "services.py" -Destination "C:\Projects\iCattle\icattle_ai\src\domain\livestock\"

# Create __init__.py
New-Item -ItemType File -Path "src\domain\livestock\__init__.py"
```

**File locations:**
```
C:\Projects\iCattle\icattle_ai\
├── src\
│   └── domain\
│       └── livestock\
│           ├── __init__.py
│           ├── livestock_management.py
│           └── services.py
```

---

### Step 4: Copy Infrastructure Files

```powershell
# Copy market pricing service
Copy-Item "market_pricing.py" -Destination "C:\Projects\iCattle\icattle_ai\src\infrastructure\pricing\"

# Create __init__.py
New-Item -ItemType File -Path "src\infrastructure\pricing\__init__.py"
```

**File locations:**
```
C:\Projects\iCattle\icattle_ai\
├── src\
│   └── infrastructure\
│       └── pricing\
│           ├── __init__.py
│           └── market_pricing.py
```

---

### Step 5: Copy API Endpoints

```powershell
# Copy livestock endpoints
Copy-Item "livestock_endpoints.py" -Destination "C:\Projects\iCattle\icattle_ai\src\api\"
```

**File location:**
```
C:\Projects\iCattle\icattle_ai\
├── src\
│   └── api\
│       ├── main_production.py (existing)
│       └── livestock_endpoints.py (new)
```

---

### Step 6: Update Production API

Edit `C:\Projects\iCattle\icattle_ai\src\api\main_production.py`:

```python
# Add this import at the top
from .livestock_endpoints import router as livestock_router

# Add this after creating the FastAPI app
app = FastAPI(
    title="iCattle.ai Production API",
    description="Biometric livestock identification and management platform",
    version="2.0.0"
)

# Register livestock management endpoints
app.include_router(livestock_router)

# Your existing routes...
```

**Result:** Your API now has 8 new livestock management endpoints!

---

### Step 7: Run Database Migration

```powershell
# Copy database schema
Copy-Item "database_schema.sql" -Destination "C:\Projects\iCattle\icattle_ai\database\migrations\002_livestock_management.sql"

# Run migration (adjust connection details as needed)
psql -U postgres -d icattle_db -p 5433 -f "database\migrations\002_livestock_management.sql"
```

**Tables created:**
- `animal_grading_events`
- `physical_measurement_events`
- `health_assessment_events`
- `animal_location_events`
- `market_valuation_events`
- `animal_profiles` (read model)
- `location_history`
- `portfolio_valuations`

---

### Step 8: Copy Test Suite

```powershell
# Copy test file
Copy-Item "test_livestock_management.py" -Destination "C:\Projects\iCattle\icattle_ai\tests\livestock\"
```

---

### Step 9: Install Additional Dependencies

```powershell
# Your project likely already has these, but just in case:
pip install aiohttp asyncio
```

---

### Step 10: Test the Integration

**Start your production API:**

```powershell
cd C:\Projects\iCattle\icattle_ai
python src\api\main_production.py
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8002
```

**Test the new endpoints:**

```powershell
# Test market prices endpoint (no auth required)
curl http://localhost:8002/api/v1/livestock/market/prices

# Should return:
# [
#   {
#     "price_per_cwt": 185.00,
#     "source": "CME Live Cattle Futures (Simulated)",
#     "market_class": "Fed Cattle",
#     ...
#   }
# ]
```

---

### Step 11: Run Comprehensive Tests

```powershell
cd C:\Projects\iCattle\icattle_ai
python tests\livestock\test_livestock_management.py
```

**Expected output:**
```
╔══════════════════════════════════════════════════════════╗
║     iCattle.ai - Comprehensive Livestock Management      ║
╚══════════════════════════════════════════════════════════╝

📊 TEST 1: Fetching Live Cattle Market Prices
✅ Retrieved 4 market price quotes

🐄 TEST 2: Processing Animals for Smith Ranch (OWNER-001)
✅ Grading recorded: Choice grade
✅ Measurements recorded: 1350.0 lbs
...

💰 TEST 4: Portfolio Valuations by Owner
📊 TOTAL PORTFOLIO VALUE (All Owners): $15,750,000.00

✅ All Tests Completed!
```

---

## 🔌 API Endpoints Now Available

Your production API (port 8002) now has these new endpoints:

### Write Operations
1. `POST /api/v1/livestock/grading` - Record USDA grading
2. `POST /api/v1/livestock/measurements` - Record weight/measurements
3. `POST /api/v1/livestock/health` - Record health assessment
4. `POST /api/v1/livestock/location` - Update GPS location
5. `POST /api/v1/livestock/valuation` - Calculate market value

### Read Operations
6. `GET /api/v1/livestock/market/prices` - Get current market prices
7. `GET /api/v1/livestock/{muzzle_hash}/profile` - Get animal profile
8. `GET /api/v1/livestock/portfolio/{tenant_id}` - Get portfolio valuation

**All endpoints enforce Turing Protocol** (5 required headers)

---

## 📊 Update Your Dashboard

### Add New WebSocket Events

Edit `C:\Projects\iCattle\icattle_ai\dashboard_server.py`:

```python
# Add new event types
async def broadcast_grading_event(event_data):
    """Broadcast animal grading event to dashboard"""
    await broadcast_to_dashboard({
        "type": "grading_recorded",
        "data": event_data
    })

async def broadcast_valuation_event(event_data):
    """Broadcast market valuation event to dashboard"""
    await broadcast_to_dashboard({
        "type": "valuation_calculated",
        "data": event_data
    })

async def broadcast_location_event(event_data):
    """Broadcast location update to dashboard"""
    await broadcast_to_dashboard({
        "type": "location_updated",
        "data": event_data
    })
```

### Add Dashboard Panels

Create new HTML panels in your dashboard:

**Market Prices Panel:**
```html
<div class="panel">
    <h3>Live Market Prices</h3>
    <div id="market-prices">
        <div class="price-item">
            <span class="market-class">Fed Cattle</span>
            <span class="price">$185.00/cwt</span>
        </div>
        <!-- More price items -->
    </div>
</div>
```

**Portfolio Valuation Panel:**
```html
<div class="panel">
    <h3>Portfolio Valuation</h3>
    <div id="portfolio-summary">
        <div class="stat">
            <label>Total Animals:</label>
            <span id="total-animals">1,500</span>
        </div>
        <div class="stat">
            <label>Total Value:</label>
            <span id="total-value">$3,937,500</span>
        </div>
        <div class="stat">
            <label>Avg Value/Head:</label>
            <span id="avg-value">$2,625</span>
        </div>
    </div>
</div>
```

**Geolocation Map Panel:**
```html
<div class="panel">
    <h3>Herd Location Map</h3>
    <div id="location-map">
        <!-- Integrate with Google Maps or Leaflet.js -->
    </div>
</div>
```

---

## 🎯 Enhanced Simulation Script

### Update Your Existing Simulation

Edit `C:\Projects\iCattle\icattle_ai\simulate_with_dashboard.py`:

```python
# Add livestock management to simulation

async def simulate_animal_with_livestock_data(animal_data, owner_id):
    """Simulate complete animal processing with livestock management"""
    
    # 1. Existing biometric capture
    await capture_biometric(animal_data)
    
    # 2. NEW: Record grading
    await record_grading(animal_data, owner_id)
    
    # 3. NEW: Record measurements
    await record_measurements(animal_data, owner_id)
    
    # 4. NEW: Record health
    await record_health(animal_data, owner_id)
    
    # 5. NEW: Update location
    await update_location(animal_data, owner_id)
    
    # 6. NEW: Calculate valuation
    await calculate_valuation(animal_data, owner_id)
```

### Run Enhanced Simulation

```powershell
# Start dashboard
python dashboard_server.py

# In another terminal, run enhanced simulation
python simulate_with_dashboard.py
```

**Result:** Dashboard now shows:
- Biometric captures (existing)
- Grading events (new)
- Weight measurements (new)
- Health assessments (new)
- Location updates (new)
- Market valuations (new)

---

## 📈 Database Queries

### Query Animal Profiles

```sql
-- Get all animals with their latest data
SELECT 
    muzzle_hash,
    tenant_id,
    quality_grade,
    weight_lbs,
    health_status,
    estimated_value_usd,
    last_valued
FROM animal_profiles
WHERE tenant_id = 'OWNER-001'
ORDER BY estimated_value_usd DESC;
```

### Query Portfolio Valuation

```sql
-- Get portfolio summary by owner
SELECT 
    tenant_id,
    COUNT(*) as total_animals,
    SUM(estimated_value_usd) as total_value,
    AVG(estimated_value_usd) as avg_value_per_head,
    SUM(weight_lbs) as total_weight
FROM animal_profiles
GROUP BY tenant_id;
```

### Query Location History

```sql
-- Get movement history for an animal
SELECT 
    muzzle_hash,
    latitude,
    longitude,
    property_id,
    pasture_id,
    timestamp
FROM location_history
WHERE muzzle_hash = 'muzzle_hash_001'
ORDER BY timestamp DESC
LIMIT 100;
```

---

## 🔐 Turing Protocol Enforcement

### All New Endpoints Require Headers

```powershell
# Example: Record grading with Turing Protocol headers
curl -X POST http://localhost:8002/api/v1/livestock/grading `
  -H "X-Tenant-ID: OWNER-001" `
  -H "X-Request-ID: $(New-Guid)" `
  -H "X-User-ID: grader_john_smith" `
  -H "X-Device-ID: GRADING-DEVICE-001" `
  -H "X-Geo-Location: 39.7392,-104.9903" `
  -H "Content-Type: application/json" `
  -d '{
    "muzzle_hash": "muzzle_hash_001",
    "quality_grade": "Choice",
    "yield_grade": "2",
    "marbling_score": 550,
    "ribeye_area_sq_in": 13.5,
    "fat_thickness_in": 0.45
  }'
```

### Test Header Validation

```powershell
# Request WITHOUT headers (should fail)
curl -X POST http://localhost:8002/api/v1/livestock/grading `
  -H "Content-Type: application/json" `
  -d '{"muzzle_hash": "test"}'

# Expected: HTTP 422 Unprocessable Entity
```

---

## 📊 OpenAPI Documentation

### View Interactive API Docs

**Swagger UI:**
```
http://localhost:8002/docs
```

**ReDoc:**
```
http://localhost:8002/redoc
```

**Result:** All 8 new livestock endpoints are documented with:
- Request schemas
- Response schemas
- Required headers
- Example payloads
- Error responses

---

## 🎯 Demo Preparation

### Create Demo Data

```powershell
# Run this script to populate demo data
python tests\livestock\test_livestock_management.py
```

**Creates:**
- 15 animals across 4 owners
- Complete profiles (grading, measurements, health, location, valuation)
- Portfolio valuations totaling $15.75M

### Demo Flow (5 minutes)

1. **Show Dashboard** (30 sec)
   - Real-time animal processing
   - Live market prices
   - Portfolio valuations

2. **API Demo** (2 min)
   - Show OpenAPI docs
   - Execute grading endpoint
   - Show Turing Protocol headers

3. **Database Query** (1 min)
   - Query animal profiles
   - Show portfolio summary

4. **Market Pricing** (1 min)
   - Show live CME prices
   - Explain quality premiums
   - Calculate animal value

5. **Geolocation** (30 sec)
   - Show location history
   - Explain geofencing (future)

---

## 🚀 Production Deployment Checklist

- [ ] All files copied to project
- [ ] Database migration completed
- [ ] API endpoints registered
- [ ] Tests passing
- [ ] Dashboard updated
- [ ] Demo data created
- [ ] Documentation reviewed
- [ ] CME API credentials (production)
- [ ] USDA AMS integration (production)
- [ ] Monitoring configured
- [ ] Backups configured

---

## 📁 Final Project Structure

```
C:\Projects\iCattle\icattle_ai\
│
├── src\
│   ├── api\
│   │   ├── main_production.py (updated)
│   │   └── livestock_endpoints.py (new)
│   │
│   ├── domain\
│   │   └── livestock\
│   │       ├── __init__.py
│   │       ├── livestock_management.py (new)
│   │       └── services.py (new)
│   │
│   └── infrastructure\
│       └── pricing\
│           ├── __init__.py
│           └── market_pricing.py (new)
│
├── database\
│   └── migrations\
│       └── 002_livestock_management.sql (new)
│
├── tests\
│   └── livestock\
│       └── test_livestock_management.py (new)
│
├── dashboard_server.py (updated)
└── simulate_with_dashboard.py (updated)
```

---

## 💡 Tips & Best Practices

### Development
- Use `http://localhost:8002/docs` for API testing
- Check PostgreSQL logs for query performance
- Monitor WebSocket connections in dashboard

### Testing
- Run tests after each code change
- Verify Turing Protocol headers
- Check database triggers are working

### Production
- Configure CME API credentials
- Set up USDA AMS integration
- Enable SSL/TLS on API gateway
- Configure monitoring and alerting

---

## 🐛 Troubleshooting

### Issue: Import errors

**Solution:**
```powershell
# Ensure __init__.py files exist
New-Item -ItemType File -Path "src\domain\livestock\__init__.py"
New-Item -ItemType File -Path "src\infrastructure\pricing\__init__.py"
```

### Issue: Database connection errors

**Solution:**
```powershell
# Check PostgreSQL is running on port 5433
netstat -an | findstr 5433

# Test connection
psql -U postgres -d icattle_db -p 5433
```

### Issue: API endpoints not found

**Solution:**
```python
# Verify router is registered in main_production.py
from .livestock_endpoints import router as livestock_router
app.include_router(livestock_router)
```

### Issue: Turing Protocol validation failing

**Solution:**
```powershell
# Ensure all 5 headers are present
X-Tenant-ID
X-Request-ID
X-User-ID
X-Device-ID
X-Geo-Location
```

---

## 📞 Support

**Questions?** Review the documentation:
- `README.md` - Complete platform guide
- `SYSTEM_SUMMARY.md` - Architecture overview
- `QUICKSTART.md` - Quick start guide

**Need Help?**
- Email: support@turingdynamics.com
- Docs: https://docs.icattle.ai

---

## ✅ Success Criteria

You'll know integration is successful when:

✅ Production API starts without errors  
✅ All 8 livestock endpoints appear in `/docs`  
✅ Test suite passes (15 animals, 4 owners)  
✅ Database has all new tables  
✅ Market prices endpoint returns data  
✅ Turing Protocol validation works  
✅ Dashboard shows new events  

---

**Built with ❤️ by TuringDynamics**

*Ready to transform your livestock management platform!*
