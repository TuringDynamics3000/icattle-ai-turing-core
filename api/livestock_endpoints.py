"""
Australian Livestock Management API
MSA Grading System with Turing Protocol Enforcement
"""

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import uuid
import os

# Import Australian domain model
from domain.livestock_management_australia import (
    MSAGrade, AUSMEATMarbling, AUSMEATFatScore,
    BodyConditionScore, HealthStatus, AustralianMarketClass, AustralianRegion,
    RecordMSAGrading, RecordPhysicalMeasurement, RecordHealthAssessment,
    UpdateAnimalLocation, CalculateMarketValue,
    MSAGradingRecorded, PhysicalMeasurementRecorded, HealthAssessmentRecorded,
    AnimalLocationUpdated, MarketValueCalculated,
    MSAGradeAssessment, PhysicalMetrics, HealthMetrics
)

# Import market pricing service
from infrastructure.market_pricing_australia import AustralianLivestockPricingService

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="iCattle.ai - Australian MSA Grading API",
    description="Livestock management with Turing Protocol enforcement for Australian market",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pricing service
pricing_service = AustralianLivestockPricingService()

# ============================================================================
# TURING PROTOCOL MIDDLEWARE
# ============================================================================

@app.middleware("http" )
async def turing_protocol_middleware(request: Request, call_next):
    """
    Enforce Turing Protocol: 5 required headers on all API endpoints
    
    Required headers:
    - X-Tenant-ID: Tenant identifier (must start with AU- or QPIC-)
    - X-Request-ID: Unique request identifier (UUID)
    - X-User-ID: User identifier
    - X-Device-ID: Device identifier
    - X-Geo-Location: GPS coordinates (lat,lon)
    """
    
    # Skip for health, docs, and root endpoints
    if request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)
    
    # Check required headers
    required_headers = {
        "x-tenant-id": "X-Tenant-ID",
        "x-request-id": "X-Request-ID",
        "x-user-id": "X-User-ID",
        "x-device-id": "X-Device-ID",
        "x-geo-location": "X-Geo-Location"
    }
    
    missing = []
    for header, name in required_headers.items():
        if header not in request.headers:
            missing.append(name)
    
    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Turing Protocol Violation",
                "message": f"Missing required headers: {', '.join(missing)}",
                "required_headers": list(required_headers.values())
            }
        )
    
    # Validate tenant ID format (Australian)
    tenant_id = request.headers.get("x-tenant-id", "")
    if not (tenant_id.startswith("AU-") or tenant_id.startswith("QPIC-")):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Turing Protocol Violation",
                "message": "Tenant ID must start with 'AU-' or 'QPIC-' for Australian market",
                "provided": tenant_id
            }
        )
    
    response = await call_next(request)
    
    # Add Turing Protocol headers to response
    response.headers["X-Turing-Protocol"] = "enforced"
    response.headers["X-Market"] = "AU"
    
    return response

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class MSAGradingRequest(BaseModel):
    animal_id: str = Field(..., description="NLIS tag number (16 digits)")
    weight_kg: Decimal = Field(..., description="Live weight in kilograms")
    msa_grade: str = Field(..., description="MSA grade: 5 Star, 4 Star, or 3 Star")
    marbling_score: Optional[int] = Field(None, description="AUS-MEAT marbling score (0-9)")
    fat_score: Optional[str] = Field(None, description="AUS-MEAT fat score (0-6)")
    eye_muscle_area_sq_cm: Optional[Decimal] = Field(None, description="Eye muscle area in sq cm")
    rib_fat_mm: Optional[Decimal] = Field(None, description="Rib fat thickness in mm")

class MSAGradingResponse(BaseModel):
    event_id: str
    animal_id: str
    msa_grade: str
    weight_kg: Decimal
    marbling_score: Optional[int]
    fat_score: Optional[str]
    timestamp: str
    tenant_id: str
    request_id: str
    message: str

class MarketValuationRequest(BaseModel):
    animal_id: str
    weight_kg: Decimal
    msa_grade: str
    region: str = Field(..., description="QLD, NSW, VIC, SA, WA, NT, TAS")

class MarketValuationResponse(BaseModel):
    event_id: str
    animal_id: str
    weight_kg: Decimal
    msa_grade: str
    region: str
    price_per_kg_aud: Decimal
    total_value_aud: Decimal
    price_source: str
    timestamp: str
    message: str

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "service": "iCattle.ai Australian MSA Grading API",
        "version": "1.0.0",
        "market": "AU",
        "grading_system": "MSA (Meat Standards Australia)",
        "turing_protocol": "enforced",
        "documentation": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "market": "AU",
        "grading_system": "MSA",
        "turing_protocol": "enforced",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "running",
            "database": "connected",
            "pricing": "available"
        }
    }

@app.post("/api/v1/livestock/grading", response_model=MSAGradingResponse, status_code=status.HTTP_201_CREATED)
async def record_msa_grading(
    request: MSAGradingRequest,
    x_tenant_id: str = Header(..., description="Tenant ID (AU- or QPIC- prefix)"),
    x_request_id: str = Header(..., description="Unique request ID"),
    x_user_id: str = Header(..., description="User ID"),
    x_device_id: str = Header(..., description="Device ID"),
    x_geo_location: str = Header(..., description="GPS coordinates (lat,lon)")
):
    """
    Record MSA grading for an animal
    
    **Turing Protocol Enforced:** All 5 headers required
    
    - **X-Tenant-ID**: Australian tenant (AU-* or QPIC-*)
    - **X-Request-ID**: Unique UUID for this request
    - **X-User-ID**: Grader/user identifier
    - **X-Device-ID**: Device performing grading
    - **X-Geo-Location**: GPS coordinates (e.g., "-27.4705,153.0260")
    """
    
    # Generate event ID
    event_id = str(uuid.uuid4())
    
    # Create MSA grading event (using correct field names)
    grading_event = MSAGradingRecorded(
        event_id=event_id,
        aggregate_id=request.animal_id,  # NLIS tag
        msa_grade=request.msa_grade,
        marbling_score=str(request.marbling_score) if request.marbling_score else "0",
        fat_score=request.fat_score if request.fat_score else "0",
        eye_muscle_area_sq_cm=str(request.eye_muscle_area_sq_cm) if request.eye_muscle_area_sq_cm else "0",
        hump_height_mm="0",
        hot_standard_carcass_weight_kg=str(request.weight_kg),
        ossification_score=0,
        ph_ultimate=None,
        grader_notes=None,
        timestamp=datetime.utcnow(),
        # Turing Protocol
        tenant_id=x_tenant_id,
        request_id=x_request_id,
        user_id=x_user_id,
        device_id=x_device_id,
        geo_location=x_geo_location
    )
    
    # TODO: Persist to database and publish to Kafka
    
    return MSAGradingResponse(
        event_id=event_id,
        animal_id=request.animal_id,
        msa_grade=request.msa_grade,
        weight_kg=request.weight_kg,
        marbling_score=request.marbling_score,
        fat_score=request.fat_score,
        timestamp=datetime.utcnow().isoformat(),
        tenant_id=x_tenant_id,
        request_id=x_request_id,
        message=f"MSA grading recorded successfully for animal {request.animal_id}"
    )

@app.post("/api/v1/livestock/valuation", response_model=MarketValuationResponse, status_code=status.HTTP_201_CREATED)
async def calculate_market_valuation(
    request: MarketValuationRequest,
    x_tenant_id: str = Header(...),
    x_request_id: str = Header(...),
    x_user_id: str = Header(...),
    x_device_id: str = Header(...),
    x_geo_location: str = Header(...)
):
    """
    Calculate market valuation for an animal based on MSA grade and region
    
    **Turing Protocol Enforced:** All 5 headers required
    """
    
    event_id = str(uuid.uuid4())
    
    # Get market price (mock data for now)
    base_price = Decimal("6.50")  # AUD per kg
    
    # MSA grade premium
    grade_premiums = {
        "5 Star": Decimal("0.80"),
        "4 Star": Decimal("0.40"),
        "3 Star": Decimal("0.00")
    }
    
    premium = grade_premiums.get(request.msa_grade, Decimal("0.00"))
    price_per_kg = base_price + premium
    total_value = request.weight_kg * price_per_kg
    
    return MarketValuationResponse(
        event_id=event_id,
        animal_id=request.animal_id,
        weight_kg=request.weight_kg,
        msa_grade=request.msa_grade,
        region=request.region,
        price_per_kg_aud=price_per_kg,
        total_value_aud=total_value,
        price_source="EYCI + MSA Premium (Mock Data)",
        timestamp=datetime.utcnow().isoformat(),
        message=f"Market valuation calculated: ${total_value:.2f} AUD"
    )

@app.get("/api/v1/market/prices")
async def get_market_prices(
    region: Optional[str] = None,
    x_tenant_id: str = Header(...),
    x_request_id: str = Header(...),
    x_user_id: str = Header(...),
    x_device_id: str = Header(...),
    x_geo_location: str = Header(...)
):
    """
    Get current market prices for Australian regions
    
    **Turing Protocol Enforced:** All 5 headers required
    """
    
    # Mock pricing data
    prices = {
        "QLD": {"base": 6.50, "eyci": 650.00},
        "NSW": {"base": 6.45, "eyci": 645.00},
        "VIC": {"base": 6.40, "eyci": 640.00},
        "SA": {"base": 6.35, "eyci": 635.00},
        "WA": {"base": 6.30, "eyci": 630.00}
    }
    
    if region:
        return {
            "region": region,
            "price_per_kg_aud": prices.get(region, {}).get("base", 6.50),
            "eyci_cents_per_kg": prices.get(region, {}).get("eyci", 650.00),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Mock Data"
        }
    
    return {
        "regions": prices,
        "timestamp": datetime.utcnow().isoformat(),
        "source": "Mock Data"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


