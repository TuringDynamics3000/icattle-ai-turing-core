"""
International API Gateway
Unified endpoints supporting both US and Australian markets
Automatic market detection and routing
Developed by: TuringDynamics

Features:
- Single API endpoint for both markets
- Automatic market detection from tenant ID, coordinates, or animal ID
- Currency conversion
- Unit conversion
- Multi-standard grading support
- Turing Protocol enforcement
"""

from fastapi import FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime
import asyncio

# Import market-specific services
import sys
sys.path.append('/home/ubuntu/grading_system')

from domain.services_international import (
    detect_market_from_coordinates,
    detect_market_from_tenant_id,
    detect_market_from_animal_id,
    international_valuation_service,
    currency_converter,
    lbs_to_kg,
    kg_to_lbs,
    get_market_config,
    format_price_for_market,
    format_weight_for_market,
)

from infrastructure.market_pricing import us_pricing_service
from infrastructure.market_pricing_australia import australian_pricing_service


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="iCattle.ai International API",
    description="Unified livestock management API supporting US (USDA) and Australian (MSA) markets",
    version="2.0.0"
)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TuringProtocolHeaders(BaseModel):
    """Turing Protocol required headers"""
    x_tenant_id: str = Field(..., alias="X-Tenant-ID")
    x_request_id: str = Field(..., alias="X-Request-ID")
    x_user_id: str = Field(..., alias="X-User-ID")
    x_device_id: str = Field(..., alias="X-Device-ID")
    x_geo_location: str = Field(..., alias="X-Geo-Location")


class InternationalGradingRequest(BaseModel):
    """Unified grading request supporting both US and Australian standards"""
    animal_id: str
    market: Optional[Literal["US", "AU"]] = None  # Auto-detect if not provided
    
    # Weight (can provide in either unit, will convert)
    weight_kg: Optional[Decimal] = None
    weight_lbs: Optional[Decimal] = None
    
    # Grading (provide appropriate fields for market)
    quality_grade: Optional[str] = None  # USDA: Prime, Choice, Select, etc. OR MSA: 5 Star, 4 Star, etc.
    yield_grade: Optional[str] = None  # US only: 1-5
    marbling_score: Optional[int] = None  # USDA: 100-1000 OR AUS-MEAT: 0-9
    fat_score: Optional[str] = None  # AU only: 0-6
    
    # Additional measurements
    ribeye_area_sq_in: Optional[Decimal] = None  # US
    eye_muscle_area_sq_cm: Optional[Decimal] = None  # AU
    fat_thickness_in: Optional[Decimal] = None  # US
    
    notes: Optional[str] = None


class InternationalValuationRequest(BaseModel):
    """Unified valuation request"""
    animal_id: str
    market: Optional[Literal["US", "AU"]] = None
    
    # Weight
    weight_kg: Optional[Decimal] = None
    weight_lbs: Optional[Decimal] = None
    
    # Grading
    quality_grade: str
    
    # Location/Region
    region: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Pricing preferences
    preferred_currency: Optional[Literal["USD", "AUD"]] = "USD"


class MarketComparisonRequest(BaseModel):
    """Request to compare valuations across markets"""
    weight_kg: Decimal
    us_grade: str = "Choice"
    au_grade: str = "4 Star"
    us_region: str = "Kansas"
    au_region: str = "Queensland"


class InternationalMarketPricesResponse(BaseModel):
    """Unified market prices from both markets"""
    timestamp: datetime
    us_prices: dict
    au_prices: dict
    exchange_rate: dict


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def validate_turing_headers(
    x_tenant_id: str = Header(...),
    x_request_id: str = Header(...),
    x_user_id: str = Header(...),
    x_device_id: str = Header(...),
    x_geo_location: str = Header(...)
) -> dict:
    """Validate Turing Protocol headers"""
    return {
        "tenant_id": x_tenant_id,
        "request_id": x_request_id,
        "user_id": x_user_id,
        "device_id": x_device_id,
        "geo_location": x_geo_location,
    }


def auto_detect_market(
    request: InternationalGradingRequest,
    turing_context: dict
) -> str:
    """Automatically detect market from request data"""
    # If explicitly provided, use it
    if request.market:
        return request.market
    
    # Try to detect from animal ID
    market = detect_market_from_animal_id(request.animal_id)
    if market:
        return market
    
    # Try to detect from tenant ID
    market = detect_market_from_tenant_id(turing_context["tenant_id"])
    if market:
        return market
    
    # Try to detect from geo location
    try:
        lat, lon = turing_context["geo_location"].split(",")
        market = detect_market_from_coordinates(Decimal(lat), Decimal(lon))
        return market
    except:
        pass
    
    # Default to US
    return "US"


def normalize_weight(request: InternationalGradingRequest) -> Decimal:
    """Normalize weight to kg"""
    if request.weight_kg:
        return request.weight_kg
    elif request.weight_lbs:
        return lbs_to_kg(request.weight_lbs)
    else:
        raise HTTPException(status_code=400, detail="Weight must be provided (kg or lbs)")


# ============================================================================
# INTERNATIONAL ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """API root"""
    return {
        "service": "iCattle.ai International API",
        "version": "2.0.0",
        "markets": ["US", "AU"],
        "standards": {
            "US": "USDA grading, CME pricing, imperial units, USD",
            "AU": "MSA grading, EYCI pricing, metric units, AUD"
        }
    }


@app.get("/api/v1/markets")
async def get_supported_markets():
    """Get list of supported markets and their configurations"""
    return {
        "markets": {
            "US": get_market_config("US"),
            "AU": get_market_config("AU"),
        },
        "exchange_rates": {
            "USD_to_AUD": float(currency_converter.usd_to_aud),
            "AUD_to_USD": float(currency_converter.aud_to_usd),
        }
    }


@app.post("/api/v1/livestock/grading")
async def record_grading(
    request: InternationalGradingRequest,
    turing_context: dict = Header(None, include_in_schema=False)
):
    """
    Record animal grading (supports both US and Australian standards)
    
    Automatically detects market from:
    1. Explicit market parameter
    2. Animal ID format (NLIS = AU, other = US)
    3. Tenant ID prefix (AU- = AU, other = US)
    4. GPS coordinates
    
    Headers (Turing Protocol):
    - X-Tenant-ID: Tenant identifier
    - X-Request-ID: Unique request ID
    - X-User-ID: User performing grading
    - X-Device-ID: Device used for grading
    - X-Geo-Location: GPS coordinates (lat,lon)
    """
    # Validate Turing Protocol headers
    if not turing_context:
        turing_context = validate_turing_headers()
    
    # Auto-detect market
    market = auto_detect_market(request, turing_context)
    
    # Normalize weight to kg
    weight_kg = normalize_weight(request)
    
    # Create event based on market
    event = {
        "event_id": turing_context["request_id"],
        "market": market,
        "animal_id": request.animal_id,
        "quality_grade": request.quality_grade,
        "weight_kg": str(weight_kg),
        "weight_lbs": str(kg_to_lbs(weight_kg)),
        "timestamp": datetime.now(),
        **turing_context
    }
    
    if market == "US":
        event.update({
            "yield_grade": request.yield_grade,
            "marbling_score": request.marbling_score,
            "ribeye_area_sq_in": str(request.ribeye_area_sq_in) if request.ribeye_area_sq_in else None,
            "fat_thickness_in": str(request.fat_thickness_in) if request.fat_thickness_in else None,
        })
    else:  # AU
        event.update({
            "msa_grade": request.quality_grade,
            "marbling_score": str(request.marbling_score) if request.marbling_score else None,
            "fat_score": request.fat_score,
            "eye_muscle_area_sq_cm": str(request.eye_muscle_area_sq_cm) if request.eye_muscle_area_sq_cm else None,
        })
    
    return {
        "success": True,
        "event": event,
        "market_detected": market,
        "message": f"Grading recorded for {market} market"
    }


@app.post("/api/v1/livestock/valuation")
async def calculate_valuation(
    request: InternationalValuationRequest,
    turing_context: dict = Header(None, include_in_schema=False)
):
    """
    Calculate market valuation (supports both US and Australian markets)
    
    Returns value in both USD and AUD with market-specific breakdown
    """
    # Validate Turing Protocol headers
    if not turing_context:
        turing_context = validate_turing_headers()
    
    # Auto-detect market
    market = request.market
    if not market:
        if request.latitude and request.longitude:
            market = detect_market_from_coordinates(request.latitude, request.longitude)
        else:
            market = detect_market_from_tenant_id(turing_context["tenant_id"])
    
    # Normalize weight
    weight_kg = request.weight_kg if request.weight_kg else lbs_to_kg(request.weight_lbs)
    
    # Get current market price
    if market == "US":
        price_data = await us_pricing_service.get_current_price(
            market_class="Fed Cattle",
            region=request.region or "Kansas"
        )
        base_price_per_kg = price_data.price_per_cwt / Decimal("45.3592")
    else:  # AU
        price_data = await australian_pricing_service.get_current_price(
            market_class="Trade Cattle",
            region=request.region or "Queensland"
        )
        base_price_per_kg = price_data.price_per_kg_aud
    
    # Calculate valuation
    valuation = international_valuation_service.calculate_value(
        market=market,
        weight_kg=weight_kg,
        grade=request.quality_grade,
        region=request.region or ("Kansas" if market == "US" else "Queensland"),
        base_price_per_kg=base_price_per_kg,
        currency=request.preferred_currency
    )
    
    return {
        "success": True,
        "market": market,
        "valuation": valuation,
        "price_source": price_data.source,
        "timestamp": datetime.now()
    }


@app.post("/api/v1/livestock/compare-markets")
async def compare_markets(request: MarketComparisonRequest):
    """
    Compare valuations across US and Australian markets
    
    Useful for export decision-making and arbitrage opportunities
    """
    # Get current prices from both markets
    us_price_data = await us_pricing_service.get_current_price(
        market_class="Fed Cattle",
        region=request.us_region
    )
    
    au_price_data = await australian_pricing_service.get_current_price(
        market_class="Trade Cattle",
        region=request.au_region
    )
    
    # Compare valuations
    comparison = international_valuation_service.compare_markets(
        weight_kg=request.weight_kg,
        us_grade=request.us_grade,
        au_grade=request.au_grade,
        us_price_per_cwt=us_price_data.price_per_cwt,
        au_price_per_kg=au_price_data.price_per_kg_aud
    )
    
    return {
        "success": True,
        "comparison": comparison,
        "recommendation": f"Sell in {comparison['better_market']} market for {comparison['percentage_difference']:.1f}% higher value",
        "timestamp": datetime.now()
    }


@app.get("/api/v1/livestock/market/prices")
async def get_international_prices():
    """
    Get current market prices from both US and Australian markets
    
    Returns prices in both USD and AUD with exchange rates
    """
    # Fetch prices from both markets concurrently
    us_prices_task = us_pricing_service.get_current_price("Fed Cattle", "Kansas")
    au_prices_task = australian_pricing_service.get_current_price("Trade Cattle", "Queensland")
    
    us_prices, au_prices = await asyncio.gather(us_prices_task, au_prices_task)
    
    return {
        "timestamp": datetime.now(),
        "us_market": {
            "price_per_cwt_usd": float(us_prices.price_per_cwt),
            "price_per_kg_usd": float(us_prices.price_per_cwt / Decimal("45.3592")),
            "price_per_kg_aud": float(currency_converter.usd_per_cwt_to_aud_per_kg(us_prices.price_per_cwt)),
            "source": us_prices.source,
            "market_class": us_prices.market_class,
            "region": "Kansas"
        },
        "au_market": {
            "price_per_kg_aud": float(au_prices.price_per_kg_aud),
            "price_per_kg_usd": float(au_prices.price_per_kg_aud * currency_converter.aud_to_usd),
            "price_per_cwt_usd": float(currency_converter.aud_per_kg_to_usd_per_cwt(au_prices.price_per_kg_aud)),
            "source": au_prices.source,
            "market_class": au_prices.market_class,
            "region": "Queensland"
        },
        "exchange_rates": {
            "USD_to_AUD": float(currency_converter.usd_to_aud),
            "AUD_to_USD": float(currency_converter.aud_to_usd),
            "note": "Demo rates - use real-time FX in production"
        },
        "arbitrage_opportunity": {
            "exists": abs(float(us_prices.price_per_cwt / Decimal("45.3592") - au_prices.price_per_kg_aud * currency_converter.aud_to_usd)) > 0.50,
            "note": "Price difference > $0.50/kg may indicate export opportunity"
        }
    }


@app.get("/api/v1/livestock/{animal_id}/profile")
async def get_animal_profile(
    animal_id: str,
    turing_context: dict = Header(None, include_in_schema=False)
):
    """
    Get complete animal profile (auto-detects market from animal ID)
    
    Returns data in both US and Australian units for comparison
    """
    # Validate Turing Protocol
    if not turing_context:
        turing_context = validate_turing_headers()
    
    # Detect market from animal ID
    market = detect_market_from_animal_id(animal_id)
    
    # In production, would query database for actual animal data
    # For demo, return sample profile
    return {
        "animal_id": animal_id,
        "market": market,
        "market_config": get_market_config(market),
        "profile": {
            "weight": format_weight_for_market(Decimal("450"), market),
            "grade": "Choice" if market == "US" else "4 Star",
            "estimated_value_usd": 1850.00 if market == "US" else 1650.00,
            "estimated_value_aud": 2812.00 if market == "US" else 2508.00,
        },
        "note": "Demo data - connect to database for real profiles"
    }


@app.get("/api/v1/livestock/convert")
async def convert_units(
    value: Decimal = Query(..., description="Value to convert"),
    from_unit: str = Query(..., description="Source unit (lbs, kg, cwt, fahrenheit, celsius, etc.)"),
    to_unit: str = Query(..., description="Target unit")
):
    """
    Utility endpoint for unit conversion
    
    Supports: lbs/kg, cwt/kg, fahrenheit/celsius, inches/cm, usd/aud
    """
    from domain.services_international import (
        lbs_to_kg, kg_to_lbs, cwt_to_kg, kg_to_cwt,
        fahrenheit_to_celsius, celsius_to_fahrenheit,
        inches_to_cm, cm_to_inches
    )
    
    conversions = {
        ("lbs", "kg"): lbs_to_kg,
        ("kg", "lbs"): kg_to_lbs,
        ("cwt", "kg"): cwt_to_kg,
        ("kg", "cwt"): kg_to_cwt,
        ("fahrenheit", "celsius"): fahrenheit_to_celsius,
        ("celsius", "fahrenheit"): celsius_to_fahrenheit,
        ("inches", "cm"): inches_to_cm,
        ("cm", "inches"): cm_to_inches,
    }
    
    key = (from_unit.lower(), to_unit.lower())
    if key not in conversions:
        raise HTTPException(status_code=400, detail=f"Unsupported conversion: {from_unit} to {to_unit}")
    
    result = conversions[key](value)
    
    return {
        "input": {
            "value": float(value),
            "unit": from_unit
        },
        "output": {
            "value": float(result),
            "unit": to_unit
        }
    }


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "iCattle.ai International API",
        "markets": ["US", "AU"],
        "timestamp": datetime.now()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
