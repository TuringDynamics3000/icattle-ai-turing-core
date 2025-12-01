# iCattle.ai Australia - Quick Start Guide

**Get your Australian livestock management system running in 5 minutes!**

---

## 🇦🇺 What's Different for Australia?

This is the **Australian version** of iCattle.ai with:

- ✅ **MSA Grading** (not USDA)
- ✅ **EYCI Pricing** (not CME)
- ✅ **Metric Units** (kg, cm, °C)
- ✅ **AUD Currency** (not USD)
- ✅ **NLIS Tags** (16-digit format)
- ✅ **Australian Regions** (QLD, NSW, VIC, SA, WA, NT, TAS)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Review the Australian Files

```bash
cd /home/ubuntu/grading_system

# Australian domain model (MSA grading)
cat domain/livestock_management_australia.py

# Australian market pricing (EYCI, NLRS)
cat infrastructure/market_pricing_australia.py

# Australian documentation
cat README_AUSTRALIA.md
```

### Step 2: Understand MSA Grading

**MSA (Meat Standards Australia) Grades:**
- **5 Star** - Premium (+$0.80/kg)
- **4 Star** - High quality (+$0.50/kg)
- **3 Star** - Good quality (+$0.20/kg)
- **Ungraded** - Standard (baseline)

**AUS-MEAT Scores:**
- **Marbling:** 0-9 scale (0=Nil, 9=Very Abundant)
- **Fat Score:** 0-6 scale (0=Nil, 6=20mm+)

### Step 3: Understand Australian Pricing

**EYCI (Eastern Young Cattle Indicator):**
- Benchmark for young cattle (200-400kg)
- Current: ~$4.80/kg (480 cents/kg)
- Updated daily

**Market Classes:**
```
Trade Cattle (200-400kg): $4.80/kg
Heavy Steers (400-600kg): $4.50/kg
Export Cattle (600kg+): $4.20/kg
Feeder Cattle: $5.20/kg
Breeding Stock: $3.80/kg
Cull Cattle: $2.50/kg
```

**Regional Adjustments:**
```
Queensland: +$0.10/kg
NSW: +$0.05/kg
Victoria: $0.00/kg (baseline)
SA: -$0.05/kg
WA: -$0.10/kg
NT: -$0.15/kg
Tasmania: +$0.05/kg
```

---

## 💰 Example Valuation (Australian)

### Premium MSA 5 Star Steer

**Animal Details:**
- NLIS Tag: 982 000123456789
- Weight: 450kg
- MSA Grade: 5 Star
- Marbling: 7 (Moderately Abundant)
- Fat Score: 3 (5mm)
- Region: Queensland
- Market Class: Trade Cattle

**Pricing Calculation:**
```
Base Price (Trade Cattle): $4.80/kg
MSA 5 Star Premium: +$0.80/kg
Queensland Regional: +$0.10/kg
─────────────────────────────────
Final Price: $5.70/kg

Total Value: 450kg × $5.70/kg = $2,565 AUD
```

**Comparison to Ungraded:**
```
Ungraded Price: $4.90/kg
Ungraded Value: 450kg × $4.90 = $2,205 AUD

MSA Premium Benefit: $2,565 - $2,205 = $360 AUD (+16.3%)
```

---

## 📊 Key Differences from US Version

| Feature | US Version | Australian Version |
|---------|-----------|-------------------|
| Grading | USDA (Prime, Choice, Select) | MSA (5 Star, 4 Star, 3 Star) |
| Marbling | 100-1000 scale | AUS-MEAT 0-9 |
| Weight | Pounds (lbs) | Kilograms (kg) |
| Height | Inches | Centimeters (cm) |
| Temperature | Fahrenheit (°F) | Celsius (°C) |
| Currency | USD | AUD |
| Pricing | $/cwt | $/kg |
| Market Data | CME, USDA | EYCI, NLRS, MLA |
| ID System | EID tags | NLIS (16-digit) |
| Property ID | Ranch name | PIC code |
| Certification | USDA | LPA |
| Regions | TX, KS, NE, etc. | QLD, NSW, VIC, etc. |

---

## 🗺️ Australian Regions & Coordinates

**Coordinate Ranges:**
- Latitude: -10° to -44° (North to South)
- Longitude: 113° to 154° (West to East)

**Major Cattle Regions:**

| Region | Coordinates | Primary Market |
|--------|-------------|----------------|
| Roma, QLD | -26.57, 148.79 | Trade Cattle |
| Wagga Wagga, NSW | -35.11, 147.37 | Heavy Steers |
| Ballarat, VIC | -37.56, 143.85 | Export Cattle |
| Mount Gambier, SA | -37.83, 140.78 | Trade Cattle |
| Katherine, NT | -14.46, 132.26 | Export Cattle |

---

## 🔐 Australian Compliance

### NLIS (National Livestock Identification System)

**Required for all cattle:**
- 16-digit NLIS tag: 982 000XXXXXXXXX
- Movement records within 7 days
- Lifetime traceability
- Mandatory

**iCattle.ai Support:**
```python
# NLIS tag as identifier
nlis_tag: "982 000123456789"

# Automatic movement tracking
property_pic: "QPIC12345"
state: "Queensland"
timestamp: datetime
```

### LPA (Livestock Production Assurance)

**Food safety certification:**
- Vaccination records
- Chemical usage tracking
- Export eligibility

**iCattle.ai Support:**
```python
lpa_compliant: bool
vaccination_current: bool
nlis_registered: bool
```

### PIC (Property Identification Code)

**Property registration:**
- State-specific codes
- QPIC (Queensland)
- NPIC (NSW)
- etc.

**iCattle.ai Support:**
```python
property_pic: "QPIC12345"
```

---

## 🎯 Demo Script (5 Minutes)

### 1. Show Market Prices (1 min)

```python
from infrastructure.market_pricing_australia import australian_pricing_service

# Get EYCI data
eyci = await australian_pricing_service.get_eyci()
print(f"EYCI: ${eyci.price_cents_per_kg / 100:.2f}/kg")

# Get current price for Trade Cattle in Queensland
price = await australian_pricing_service.get_current_price(
    market_class="Trade Cattle",
    region="Queensland"
)
print(f"Trade Cattle (QLD): ${price.price_per_kg_aud:.2f}/kg")
```

**Expected Output:**
```
EYCI: $4.80/kg
Trade Cattle (QLD): $4.90/kg
```

### 2. Record MSA Grading (2 min)

```python
from domain.livestock_management_australia import (
    RecordMSAGrading,
    MSAGrade,
    AUSMEATMarbling,
    AUSMEATFatScore
)

# Create MSA grading command
command = RecordMSAGrading(
    aggregate_id="982 000123456789",
    msa_grade=MSAGrade.MSA_5_STAR,
    marbling_score=AUSMEATMarbling.MARBLING_7,
    fat_score=AUSMEATFatScore.FAT_3,
    eye_muscle_area_sq_cm=Decimal("85.0"),
    hump_height_mm=Decimal("45.0"),
    hot_standard_carcass_weight_kg=Decimal("245.0"),
    ossification_score=150,
    ph_ultimate=Decimal("5.6"),
    timestamp=datetime.now(),
    grader_notes="Premium MSA 5 Star assessment"
)

# Process command → create event
# (Implementation would call domain service)
```

### 3. Calculate Market Value (2 min)

```python
from domain.livestock_management_australia import (
    CalculateMarketValue,
    AustralianMarketClass,
    AustralianRegion
)

# Calculate value command
command = CalculateMarketValue(
    aggregate_id="982 000123456789",
    market_class=AustralianMarketClass.TRADE_CATTLE,
    live_weight_kg=Decimal("450.0"),
    msa_grade=MSAGrade.MSA_5_STAR,
    region=AustralianRegion.QUEENSLAND,
    timestamp=datetime.now()
)

# Expected result:
# Base: $4.80/kg
# MSA 5 Star: +$0.80/kg
# Queensland: +$0.10/kg
# Final: $5.70/kg
# Value: 450kg × $5.70 = $2,565 AUD
```

---

## 📚 Documentation

**Australian-Specific:**
- `README_AUSTRALIA.md` - Complete Australian guide
- `AUSTRALIA_SUMMARY.md` - System summary and delivery
- `QUICKSTART_AUSTRALIA.md` - This guide

**General (applies to both):**
- `README.md` - Platform overview
- `SYSTEM_SUMMARY.md` - Complete system details
- `DELIVERABLES.txt` - Delivery summary

---

## 🚀 Integration with Your Project

### Copy Australian Files

```bash
# From sandbox to your Windows project
# C:\Projects\iCattle\icattle_ai\

# Copy Australian domain model
cp domain/livestock_management_australia.py → src\domain\livestock\

# Copy Australian pricing service
cp infrastructure/market_pricing_australia.py → src\infrastructure\pricing\

# Copy documentation
cp README_AUSTRALIA.md → docs\
cp AUSTRALIA_SUMMARY.md → docs\
```

### Register Australian Endpoints

```python
# In your main_production.py

from src.domain.livestock.livestock_management_australia import *
from src.infrastructure.pricing.market_pricing_australia import australian_pricing_service

# Add Australian routes
@app.get("/api/v1/livestock/au/market/eyci")
async def get_eyci():
    """Get Eastern Young Cattle Indicator"""
    eyci = await australian_pricing_service.get_eyci()
    return {
        "price_cents_per_kg": float(eyci.price_cents_per_kg),
        "price_aud_per_kg": float(eyci.price_cents_per_kg / 100),
        "change_cents": float(eyci.change_cents),
        "date": eyci.date.isoformat(),
        "volume_head": eyci.volume_head
    }
```

---

## 💡 Key Selling Points (Australian Market)

### For Producers
- "Know the exact MSA grade and value of every animal"
- "Capture MSA premiums: +$0.20 to +$0.80/kg"
- "NLIS compliance automated"
- "LPA certification tracking"

### For Processors
- "Verified MSA grades before purchase"
- "Complete NLIS traceability"
- "LPA certification confirmed"
- "Export documentation ready"

### For Lenders/Insurers
- "Real-time EYCI-based valuations"
- "Complete audit trail (Turing Protocol)"
- "NLIS movement verification"
- "Portfolio analytics by PIC"

---

## 🎯 Next Steps

### Immediate
1. ✅ Review Australian domain model
2. ✅ Understand MSA grading system
3. ✅ Test EYCI pricing
4. ✅ Validate NLIS tag format

### Short-term
1. Subscribe to MLA Market Information
2. Set up NLRS data feed
3. Register for NLIS database access
4. Configure LPA tracking

### Medium-term
1. Integrate AuctionsPlus
2. Deploy to Australian data center (Sydney)
3. Mobile app for field operations
4. Saleyard price aggregation

---

## 📞 Support

**Australian Support:**
- Email: australia@turingdynamics.com
- Documentation: README_AUSTRALIA.md
- API Docs: https://docs.icattle.ai/au

---

## ✅ Checklist

Before going to production:

- [ ] Review all Australian files
- [ ] Understand MSA grading (3-5 stars)
- [ ] Understand EYCI pricing
- [ ] Validate NLIS tag format (16-digit)
- [ ] Configure Australian regions (QLD, NSW, VIC, etc.)
- [ ] Set up metric units (kg, cm, °C)
- [ ] Configure AUD currency
- [ ] Subscribe to MLA Market Information
- [ ] Set up NLRS data feed
- [ ] Register for NLIS access
- [ ] Deploy to Australian data center

---

**Built with ❤️ by TuringDynamics for the Australian livestock industry**

*Transforming Australian livestock management through biometric identification, MSA grading, and real-time EYCI pricing.*
