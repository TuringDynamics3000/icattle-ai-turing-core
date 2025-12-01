# iCattle.ai International Platform

**Unified Livestock Management for Global Operations**

Supporting both **US (USDA/CME)** and **Australian (MSA/EYCI)** markets with automatic detection, routing, and conversion.

---

## 🌍 Overview

iCattle.ai International is a **multi-region, multi-standard** livestock management platform that seamlessly supports:

- ✅ **US Market** - USDA grading, CME pricing, imperial units, USD
- ✅ **Australian Market** - MSA grading, EYCI pricing, metric units, AUD
- ✅ **Automatic Market Detection** - From animal ID, tenant ID, or GPS coordinates
- ✅ **Unified API** - Single endpoint for both markets
- ✅ **Currency Conversion** - Real-time USD ↔ AUD conversion
- ✅ **Unit Conversion** - Automatic imperial ↔ metric conversion
- ✅ **Multi-Region Deployment** - US and Australian data centers
- ✅ **Turing Protocol** - Bank-grade auditability across all markets

---

## 🎯 Key Features

### 1. Automatic Market Detection

**No need to specify market - system auto-detects from:**

1. **Animal ID Format**
   - NLIS 16-digit (982 000XXXXXXXXX) → Australian market
   - Other formats → US market

2. **Tenant ID Prefix**
   - `AU-*`, `QPIC-*` → Australian market
   - `US-*`, `OWNER-*` → US market

3. **GPS Coordinates**
   - Australia (-10° to -44° lat, 113° to 154° lon) → Australian market
   - USA (24° to 49° lat, -125° to -66° lon) → US market

4. **Explicit Parameter** (optional)
   - `"market": "US"` or `"market": "AU"`

### 2. Unified API Endpoints

**Single API for both markets:**

```http
POST /api/v1/livestock/grading
```

**Request (works for both markets):**
```json
{
  "animal_id": "982 000123456789",  // NLIS tag (AU detected)
  "weight_kg": 450.0,
  "quality_grade": "4 Star",
  "marbling_score": 7,
  "fat_score": "3"
}
```

**OR:**

```json
{
  "animal_id": "muzzle_hash_001",  // US detected
  "weight_lbs": 1350.0,
  "quality_grade": "Choice",
  "marbling_score": 550,
  "yield_grade": "2"
}
```

**Response includes both unit systems:**
```json
{
  "success": true,
  "market_detected": "AU",
  "event": {
    "weight_kg": "450.0",
    "weight_lbs": "992.1",
    "value_usd": 1650.00,
    "value_aud": 2508.00
  }
}
```

### 3. Market Comparison

**Compare valuations across markets:**

```http
POST /api/v1/livestock/compare-markets
```

**Request:**
```json
{
  "weight_kg": 450.0,
  "us_grade": "Choice",
  "au_grade": "4 Star",
  "us_region": "Kansas",
  "au_region": "Queensland"
}
```

**Response:**
```json
{
  "us_valuation": {
    "value_usd": 1850.00,
    "value_aud": 2812.00,
    "price_per_cwt_usd": 185.00
  },
  "au_valuation": {
    "value_aud": 2508.00,
    "value_usd": 1650.00,
    "price_per_kg_aud": 5.30
  },
  "better_market": "US",
  "percentage_difference": 12.1,
  "recommendation": "Sell in US market for 12.1% higher value"
}
```

### 4. International Market Prices

**Get prices from both markets simultaneously:**

```http
GET /api/v1/livestock/market/prices
```

**Response:**
```json
{
  "us_market": {
    "price_per_cwt_usd": 185.00,
    "price_per_kg_usd": 4.08,
    "price_per_kg_aud": 6.20,
    "source": "CME Live Cattle Futures"
  },
  "au_market": {
    "price_per_kg_aud": 4.80,
    "price_per_kg_usd": 3.16,
    "price_per_cwt_usd": 143.20,
    "source": "EYCI"
  },
  "exchange_rates": {
    "USD_to_AUD": 1.52,
    "AUD_to_USD": 0.658
  },
  "arbitrage_opportunity": {
    "exists": true,
    "note": "Price difference > $0.50/kg may indicate export opportunity"
  }
}
```

---

## 📊 Market Comparison

| Feature | US Market | Australian Market |
|---------|-----------|-------------------|
| **Grading System** | USDA (Prime, Choice, Select) | MSA (5 Star, 4 Star, 3 Star) |
| **Marbling Scale** | 100-1000 | AUS-MEAT 0-9 |
| **Weight Units** | Pounds (lbs) | Kilograms (kg) |
| **Height Units** | Inches | Centimeters (cm) |
| **Temperature** | Fahrenheit (°F) | Celsius (°C) |
| **Currency** | USD | AUD |
| **Pricing Unit** | $/cwt (hundredweight) | $/kg |
| **Market Data** | CME Futures, USDA AMS | EYCI, NLRS, MLA |
| **ID System** | EID tags, muzzle hash | NLIS (16-digit) |
| **Property ID** | Ranch/Farm name | PIC code |
| **Certification** | USDA inspection | LPA |
| **Regions** | TX, KS, NE, IA, CA | QLD, NSW, VIC, SA, WA |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install fastapi uvicorn pydantic aiohttp
```

### 2. Start International API

```bash
cd /home/ubuntu/grading_system
python api/international_gateway.py
```

**API will be available at:**
- http://localhost:8002 (unified endpoint)
- http://localhost:8002/docs (interactive API docs)

### 3. Test Market Detection

**Test with Australian animal:**
```bash
curl -X POST http://localhost:8002/api/v1/livestock/grading \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: AU-QPIC12345" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "X-User-ID: grader_john" \
  -H "X-Device-ID: DEVICE-001" \
  -H "X-Geo-Location: -27.47,153.03" \
  -d '{
    "animal_id": "982 000123456789",
    "weight_kg": 450.0,
    "quality_grade": "4 Star",
    "marbling_score": 7
  }'
```

**Response:**
```json
{
  "success": true,
  "market_detected": "AU",
  "message": "Grading recorded for AU market"
}
```

**Test with US animal:**
```bash
curl -X POST http://localhost:8002/api/v1/livestock/grading \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: OWNER-001" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "X-User-ID: grader_john" \
  -H "X-Device-ID: DEVICE-001" \
  -H "X-Geo-Location: 39.04,-95.67" \
  -d '{
    "animal_id": "muzzle_hash_001",
    "weight_lbs": 1350.0,
    "quality_grade": "Choice",
    "marbling_score": 550
  }'
```

**Response:**
```json
{
  "success": true,
  "market_detected": "US",
  "message": "Grading recorded for US market"
}
```

---

## 🌐 API Endpoints

### Core Endpoints

#### 1. Record Grading (Unified)
```http
POST /api/v1/livestock/grading
```
- Supports both USDA and MSA grading
- Auto-detects market
- Accepts weight in kg or lbs
- Returns data in both unit systems

#### 2. Calculate Valuation (Unified)
```http
POST /api/v1/livestock/valuation
```
- Fetches appropriate market prices (CME or EYCI)
- Calculates value in both USD and AUD
- Applies market-specific premiums

#### 3. Compare Markets
```http
POST /api/v1/livestock/compare-markets
```
- Compare valuations across US and AU
- Identify arbitrage opportunities
- Export decision support

#### 4. Get International Prices
```http
GET /api/v1/livestock/market/prices
```
- Real-time prices from both markets
- Currency conversion
- Arbitrage detection

#### 5. Get Animal Profile
```http
GET /api/v1/livestock/{animal_id}/profile
```
- Auto-detects market from animal ID
- Returns data in both unit systems
- Complete history

#### 6. Convert Units
```http
GET /api/v1/livestock/convert?value=450&from_unit=kg&to_unit=lbs
```
- Utility endpoint for conversions
- Supports: lbs/kg, cwt/kg, °F/°C, inches/cm

### Market Information

#### 7. Get Supported Markets
```http
GET /api/v1/markets
```
- List of supported markets
- Market configurations
- Exchange rates

#### 8. Health Check
```http
GET /health
```
- Service status
- Market availability

---

## 💱 Currency & Unit Conversion

### Automatic Conversion

**All data stored and returned in both systems:**

```json
{
  "weight": {
    "kg": 450.0,
    "lbs": 992.1,
    "cwt": 9.92
  },
  "temperature": {
    "celsius": 38.5,
    "fahrenheit": 101.3
  },
  "value": {
    "usd": 1850.00,
    "aud": 2812.00
  },
  "price": {
    "usd_per_cwt": 185.00,
    "usd_per_kg": 4.08,
    "aud_per_kg": 6.20
  }
}
```

### Exchange Rates

**Real-time FX rates (production):**
- Source: Reserve Bank of Australia + Federal Reserve
- Update: Every 15 minutes
- Fallback: Static rates if API unavailable

**Demo rates (2025):**
- 1 USD = 1.52 AUD
- 1 AUD = 0.658 USD

---

## 🗺️ Multi-Region Deployment

### Geographic Distribution

**US Region:**
- Data Center: Iowa (us-central1)
- Coverage: USA, Canada, Mexico
- Services: USDA grading, CME pricing

**Australian Region:**
- Data Center: Sydney (ap-southeast-2)
- Coverage: Australia, New Zealand, Pacific
- Services: MSA grading, EYCI pricing

### Routing

**Automatic GeoDNS routing:**
- US requests → US data center
- AU requests → AU data center
- Cross-region queries supported

**Latency targets:**
- Same-region: <50ms
- Cross-region: <200ms

---

## 🔐 Security & Compliance

### Turing Protocol (Both Markets)

**All requests require 5 headers:**
```
X-Tenant-ID: Tenant identifier
X-Request-ID: Unique request ID (UUID)
X-User-ID: User performing action
X-Device-ID: Device identifier
X-Geo-Location: GPS coordinates (lat,lon)
```

### Data Residency

**US Data:**
- Stored in US data centers only
- Complies with US data protection laws
- USDA regulatory compliance

**Australian Data:**
- Stored in Australian data centers only
- Complies with Australian Privacy Act
- NLIS/LPA regulatory compliance

---

## 📈 Use Cases

### 1. International Livestock Trading

**Scenario:** Exporter wants to determine best market

```python
# Compare markets for 450kg animal
comparison = await compare_markets(
    weight_kg=450.0,
    us_grade="Choice",
    au_grade="4 Star",
    us_region="Kansas",
    au_region="Queensland"
)

if comparison["better_market"] == "US":
    print(f"Export to US for {comparison['percentage_difference']:.1f}% premium")
else:
    print(f"Sell in AU market for {comparison['percentage_difference']:.1f}% premium")
```

### 2. Multi-National Operations

**Scenario:** Company operates ranches in both US and Australia

```python
# Single API for both operations
us_animals = grade_animals(market="US", animals=us_herd)
au_animals = grade_animals(market="AU", animals=au_herd)

# Consolidated portfolio in USD
total_value_usd = sum([
    animal["value_usd"] for animal in us_animals + au_animals
])
```

### 3. Market Arbitrage

**Scenario:** Identify price differences between markets

```python
# Get prices from both markets
prices = await get_international_prices()

if prices["arbitrage_opportunity"]["exists"]:
    print("Export opportunity detected!")
    print(f"US: ${prices['us_market']['price_per_kg_usd']:.2f}/kg")
    print(f"AU: ${prices['au_market']['price_per_kg_usd']:.2f}/kg")
```

---

## 🎯 Benefits of International Platform

### Operational

✅ **Single API** - One integration for both markets  
✅ **Automatic Detection** - No manual market selection  
✅ **Unified Data Model** - Consistent across markets  
✅ **Real-time Conversion** - Currency and units  

### Financial

✅ **Market Comparison** - Identify best selling market  
✅ **Arbitrage Detection** - Export opportunities  
✅ **Multi-Currency** - Portfolio in USD or AUD  
✅ **Hedging Support** - FX risk management  

### Compliance

✅ **Multi-Standard** - USDA and MSA compliant  
✅ **Data Residency** - Regional data storage  
✅ **Audit Trail** - Turing Protocol across all markets  
✅ **Regulatory** - US and AU regulations  

---

## 📊 Performance

### Latency Targets

| Operation | Same-Region | Cross-Region |
|-----------|-------------|--------------|
| Grading | <50ms | <200ms |
| Valuation | <100ms | <300ms |
| Market Prices | <150ms | <400ms |
| Comparison | <200ms | <500ms |

### Throughput

- **API Gateway:** 1,000 requests/second per region
- **Event Processing:** 500 events/second per region
- **Database:** 10,000 queries/second per region

---

## 💰 Pricing

### API Usage

**Free Tier:**
- 10,000 API calls/month
- Both markets included
- Basic support

**Professional:**
- $500/month
- 1,000,000 API calls/month
- Priority support
- SLA: 99.9% uptime

**Enterprise:**
- Custom pricing
- Unlimited API calls
- Dedicated support
- SLA: 99.99% uptime
- Custom deployment

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build international gateway
docker build -t icattle-international:latest .

# Run with environment variables
docker run -p 8002:8002 \
  -e US_PRICING_API_KEY=xxx \
  -e AU_PRICING_API_KEY=xxx \
  -e FX_API_KEY=xxx \
  icattle-international:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: icattle-international
spec:
  replicas: 4
  selector:
    matchLabels:
      app: icattle-international
  template:
    metadata:
      labels:
        app: icattle-international
    spec:
      containers:
      - name: api
        image: icattle-international:latest
        ports:
        - containerPort: 8002
        env:
        - name: US_PRICING_API_KEY
          valueFrom:
            secretKeyRef:
              name: icattle-secrets
              key: us-pricing-key
        - name: AU_PRICING_API_KEY
          valueFrom:
            secretKeyRef:
              name: icattle-secrets
              key: au-pricing-key
```

---

## 📚 Additional Resources

**Documentation:**
- [US Market Guide](README.md)
- [Australian Market Guide](README_AUSTRALIA.md)
- [Deployment Architecture](deployment/international_architecture.md)
- [API Reference](https://docs.icattle.ai)

**Support:**
- Email: support@turingdynamics.com
- US Support: +1 (XXX) XXX-XXXX
- AU Support: +61 (0)2 XXXX XXXX

---

## ✅ Checklist

### Development
- [x] Unified domain services
- [x] International API gateway
- [x] Automatic market detection
- [x] Currency conversion
- [x] Unit conversion
- [x] Market comparison

### Deployment
- [ ] US data center setup
- [ ] AU data center setup
- [ ] Global load balancer
- [ ] DNS configuration
- [ ] SSL certificates
- [ ] Monitoring setup

### Integration
- [ ] CME API credentials (US)
- [ ] USDA AMS integration (US)
- [ ] MLA API subscription (AU)
- [ ] NLRS data feed (AU)
- [ ] FX rate API
- [ ] Testing across both markets

---

**Built with ❤️ by TuringDynamics**

*Transforming global livestock management through unified biometric identification, multi-standard grading, and real-time international pricing.*
