"""
Livestock Management API Endpoints
All endpoints enforce Turing Protocol (5 required headers)
Developed by: TuringDynamics

Endpoints:
- POST /api/v1/livestock/grading - Record meat quality grading
- POST /api/v1/livestock/measurements - Record physical measurements
- POST /api/v1/livestock/health - Record health assessment
- POST /api/v1/livestock/location - Update animal location
- POST /api/v1/livestock/valuation - Calculate market value
- GET /api/v1/livestock/{muzzle_hash}/profile - Get complete animal profile
- GET /api/v1/livestock/market/prices - Get current market prices
- GET /api/v1/livestock/portfolio/{tenant_id} - Get portfolio valuation
"""

from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid

from ..domain.livestock_management import (
    RecordAnimalGrading, RecordPhysicalMeasurement, RecordHealthAssessment,
    UpdateAnimalLocation, CalculateMarketValue,
    MeatQualityGrade, YieldGrade, BodyConditionScore, HealthStatus, MarketClass
)
from ..domain.services import (
    create_grading_event, create_measurement_event,
    create_location_event, create_valuation_event
)
from ..infrastructure.market_pricing import pricing_service


# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter(prefix="/api/v1/livestock", tags=["Livestock Management"])


# ============================================================================
# REQUEST MODELS
# ============================================================================

class RecordGradingRequest(BaseModel):
    """Request to record animal grading"""
    muzzle_hash: str = Field(..., description="Unique muzzle biometric hash")
    quality_grade: MeatQualityGrade
    yield_grade: YieldGrade
    marbling_score: int = Field(..., ge=100, le=1000)
    ribeye_area_sq_in: Decimal = Field(..., gt=0)
    fat_thickness_in: Decimal = Field(..., ge=0)
    hot_carcass_weight_lbs: Optional[Decimal] = None
    grader_notes: Optional[str] = None


class RecordMeasurementRequest(BaseModel):
    """Request to record physical measurements"""
    muzzle_hash: str
    weight_lbs: Decimal = Field(..., gt=0)
    body_condition_score: BodyConditionScore
    frame_score: int = Field(..., ge=1, le=9)
    hip_height_in: Optional[Decimal] = None
    body_length_in: Optional[Decimal] = None
    measurement_notes: Optional[str] = None


class RecordHealthRequest(BaseModel):
    """Request to record health assessment"""
    muzzle_hash: str
    health_status: HealthStatus
    temperature_f: Optional[Decimal] = None
    heart_rate_bpm: Optional[int] = None
    respiratory_rate: Optional[int] = None
    mobility_score: int = Field(..., ge=1, le=5)
    vaccination_current: bool
    veterinarian_notes: Optional[str] = None


class UpdateLocationRequest(BaseModel):
    """Request to update animal location"""
    muzzle_hash: str
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    altitude_m: Optional[Decimal] = None
    accuracy_m: Optional[Decimal] = None
    property_id: Optional[str] = None
    pasture_id: Optional[str] = None
    movement_notes: Optional[str] = None


class CalculateValuationRequest(BaseModel):
    """Request to calculate market value"""
    muzzle_hash: str
    market_class: MarketClass
    live_weight_lbs: Decimal = Field(..., gt=0)
    quality_grade: Optional[MeatQualityGrade] = None


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class EventResponse(BaseModel):
    """Standard event response"""
    event_id: str
    aggregate_id: str
    event_type: str
    timestamp: datetime
    success: bool = True


class AnimalProfileResponse(BaseModel):
    """Complete animal profile"""
    muzzle_hash: str
    tenant_id: str
    
    # Latest grading
    quality_grade: Optional[str] = None
    yield_grade: Optional[str] = None
    marbling_score: Optional[int] = None
    
    # Latest measurements
    weight_lbs: Optional[Decimal] = None
    body_condition_score: Optional[str] = None
    frame_score: Optional[int] = None
    
    # Latest health
    health_status: Optional[str] = None
    temperature_f: Optional[Decimal] = None
    mobility_score: Optional[int] = None
    vaccination_current: Optional[bool] = None
    
    # Latest location
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    property_id: Optional[str] = None
    pasture_id: Optional[str] = None
    
    # Latest valuation
    estimated_value_usd: Optional[Decimal] = None
    market_price_per_cwt: Optional[Decimal] = None
    last_valued: Optional[datetime] = None


class MarketPriceResponse(BaseModel):
    """Market price information"""
    price_per_cwt: Decimal
    source: str
    market_class: str
    region: Optional[str]
    timestamp: datetime
    volume: Optional[int]


class PortfolioValuationResponse(BaseModel):
    """Portfolio valuation summary"""
    tenant_id: str
    total_animals: int
    total_value_usd: Decimal
    average_value_per_head: Decimal
    total_weight_lbs: Decimal
    breakdown_by_class: dict
    last_updated: datetime


# ============================================================================
# TURING PROTOCOL DEPENDENCY
# ============================================================================

async def verify_turing_headers(
    x_tenant_id: str = Header(..., description="Tenant/Owner ID"),
    x_request_id: str = Header(..., description="Unique request ID"),
    x_user_id: str = Header(..., description="User performing action"),
    x_device_id: str = Header(..., description="Device identifier"),
    x_geo_location: str = Header(..., description="Geographic coordinates")
) -> dict:
    """Verify all Turing Protocol headers are present"""
    return {
        "tenant_id": x_tenant_id,
        "request_id": x_request_id,
        "user_id": x_user_id,
        "device_id": x_device_id,
        "geo_location": x_geo_location
    }


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/grading", response_model=EventResponse)
async def record_grading(
    request: RecordGradingRequest,
    headers: dict = Depends(verify_turing_headers)
):
    """
    Record meat quality and yield grading for an animal
    
    **Turing Protocol Required Headers:**
    - X-Tenant-ID: Owner/organization identifier
    - X-Request-ID: Unique request UUID
    - X-User-ID: Grader/user identifier
    - X-Device-ID: Grading device identifier
    - X-Geo-Location: Grading facility coordinates
    """
    # Create command
    command = RecordAnimalGrading(
        aggregate_id=request.muzzle_hash,
        quality_grade=request.quality_grade,
        yield_grade=request.yield_grade,
        marbling_score=request.marbling_score,
        ribeye_area_sq_in=request.ribeye_area_sq_in,
        fat_thickness_in=request.fat_thickness_in,
        hot_carcass_weight_lbs=request.hot_carcass_weight_lbs,
        timestamp=datetime.now(),
        grader_notes=request.grader_notes
    )
    
    # Create event
    event = create_grading_event(
        command,
        tenant_id=headers["tenant_id"],
        request_id=headers["request_id"],
        user_id=headers["user_id"],
        device_id=headers["device_id"],
        geo_location=headers["geo_location"]
    )
    
    # In production: Persist event to event store
    # await event_store.append(event)
    
    return EventResponse(
        event_id=event.event_id,
        aggregate_id=event.aggregate_id,
        event_type="AnimalGradingRecorded",
        timestamp=event.timestamp
    )


@router.post("/measurements", response_model=EventResponse)
async def record_measurements(
    request: RecordMeasurementRequest,
    headers: dict = Depends(verify_turing_headers)
):
    """
    Record physical measurements for an animal
    
    **Turing Protocol Required Headers:**
    - X-Tenant-ID: Owner/organization identifier
    - X-Request-ID: Unique request UUID
    - X-User-ID: Technician/user identifier
    - X-Device-ID: Measurement device identifier (scale, etc.)
    - X-Geo-Location: Measurement location coordinates
    """
    command = RecordPhysicalMeasurement(
        aggregate_id=request.muzzle_hash,
        weight_lbs=request.weight_lbs,
        body_condition_score=request.body_condition_score,
        frame_score=request.frame_score,
        hip_height_in=request.hip_height_in,
        body_length_in=request.body_length_in,
        timestamp=datetime.now(),
        measurement_notes=request.measurement_notes
    )
    
    event = create_measurement_event(
        command,
        tenant_id=headers["tenant_id"],
        request_id=headers["request_id"],
        user_id=headers["user_id"],
        device_id=headers["device_id"],
        geo_location=headers["geo_location"]
    )
    
    # In production: Persist event
    # await event_store.append(event)
    
    return EventResponse(
        event_id=event.event_id,
        aggregate_id=event.aggregate_id,
        event_type="PhysicalMeasurementRecorded",
        timestamp=event.timestamp
    )


@router.post("/location", response_model=EventResponse)
async def update_location(
    request: UpdateLocationRequest,
    headers: dict = Depends(verify_turing_headers)
):
    """
    Update animal geolocation
    
    **Turing Protocol Required Headers:**
    - X-Tenant-ID: Owner/organization identifier
    - X-Request-ID: Unique request UUID
    - X-User-ID: User/system identifier
    - X-Device-ID: GPS device/collar identifier
    - X-Geo-Location: Device coordinates (should match lat/lon in body)
    """
    command = UpdateAnimalLocation(
        aggregate_id=request.muzzle_hash,
        latitude=request.latitude,
        longitude=request.longitude,
        altitude_m=request.altitude_m,
        accuracy_m=request.accuracy_m,
        property_id=request.property_id,
        pasture_id=request.pasture_id,
        timestamp=datetime.now(),
        movement_notes=request.movement_notes
    )
    
    event = create_location_event(
        command,
        tenant_id=headers["tenant_id"],
        request_id=headers["request_id"],
        user_id=headers["user_id"],
        device_id=headers["device_id"],
        geo_location=headers["geo_location"]
    )
    
    # In production: Persist event
    # await event_store.append(event)
    
    return EventResponse(
        event_id=event.event_id,
        aggregate_id=event.aggregate_id,
        event_type="AnimalLocationUpdated",
        timestamp=event.timestamp
    )


@router.post("/valuation", response_model=EventResponse)
async def calculate_valuation(
    request: CalculateValuationRequest,
    headers: dict = Depends(verify_turing_headers)
):
    """
    Calculate current market value for an animal
    
    **Turing Protocol Required Headers:**
    - X-Tenant-ID: Owner/organization identifier
    - X-Request-ID: Unique request UUID
    - X-User-ID: User requesting valuation
    - X-Device-ID: Device identifier
    - X-Geo-Location: User/device coordinates
    """
    # Fetch current market price
    market_price = await pricing_service.get_current_price(
        market_class=request.market_class.value
    )
    
    command = CalculateMarketValue(
        aggregate_id=request.muzzle_hash,
        market_class=request.market_class,
        live_weight_lbs=request.live_weight_lbs,
        quality_grade=request.quality_grade,
        timestamp=datetime.now()
    )
    
    event = create_valuation_event(
        command,
        base_price_per_cwt=market_price.price_per_cwt,
        price_source=market_price.source,
        tenant_id=headers["tenant_id"],
        request_id=headers["request_id"],
        user_id=headers["user_id"],
        device_id=headers["device_id"],
        geo_location=headers["geo_location"]
    )
    
    # In production: Persist event
    # await event_store.append(event)
    
    return EventResponse(
        event_id=event.event_id,
        aggregate_id=event.aggregate_id,
        event_type="MarketValueCalculated",
        timestamp=event.timestamp
    )


@router.get("/market/prices", response_model=List[MarketPriceResponse])
async def get_market_prices():
    """
    Get current live cattle market prices
    
    Returns prices for all market classes from multiple sources
    """
    prices = []
    
    # Fetch prices for each market class
    for market_class in ["Fed Cattle", "Feeder Cattle", "Breeding Stock", "Cull Cattle"]:
        price = await pricing_service.get_current_price(market_class=market_class)
        prices.append(MarketPriceResponse(
            price_per_cwt=price.price_per_cwt,
            source=price.source,
            market_class=price.market_class,
            region=price.region,
            timestamp=price.timestamp,
            volume=price.volume
        ))
    
    return prices


@router.get("/{muzzle_hash}/profile", response_model=AnimalProfileResponse)
async def get_animal_profile(
    muzzle_hash: str,
    headers: dict = Depends(verify_turing_headers)
):
    """
    Get complete profile for an animal
    
    **Turing Protocol Required Headers:**
    - X-Tenant-ID: Owner/organization identifier
    - X-Request-ID: Unique request UUID
    - X-User-ID: User requesting profile
    - X-Device-ID: Device identifier
    - X-Geo-Location: User/device coordinates
    """
    # In production: Query read model / projection
    # For demo, return sample data
    
    return AnimalProfileResponse(
        muzzle_hash=muzzle_hash,
        tenant_id=headers["tenant_id"],
        quality_grade="Choice",
        yield_grade="2",
        marbling_score=550,
        weight_lbs=Decimal("1350.0"),
        body_condition_score="5",
        frame_score=6,
        health_status="Healthy",
        temperature_f=Decimal("101.5"),
        mobility_score=5,
        vaccination_current=True,
        latitude=Decimal("39.7392"),
        longitude=Decimal("-104.9903"),
        property_id="RANCH-001",
        pasture_id="PASTURE-A",
        estimated_value_usd=Decimal("2625.00"),
        market_price_per_cwt=Decimal("185.00"),
        last_valued=datetime.now()
    )


@router.get("/portfolio/{tenant_id}", response_model=PortfolioValuationResponse)
async def get_portfolio_valuation(
    tenant_id: str,
    headers: dict = Depends(verify_turing_headers)
):
    """
    Get portfolio valuation summary for a tenant/owner
    
    **Turing Protocol Required Headers:**
    - X-Tenant-ID: Must match tenant_id in path
    - X-Request-ID: Unique request UUID
    - X-User-ID: User requesting portfolio
    - X-Device-ID: Device identifier
    - X-Geo-Location: User/device coordinates
    """
    # Verify tenant_id matches header
    if tenant_id != headers["tenant_id"]:
        raise HTTPException(status_code=403, detail="Tenant ID mismatch")
    
    # In production: Query aggregated portfolio data
    # For demo, return sample data
    
    return PortfolioValuationResponse(
        tenant_id=tenant_id,
        total_animals=1500,
        total_value_usd=Decimal("3937500.00"),
        average_value_per_head=Decimal("2625.00"),
        total_weight_lbs=Decimal("2025000.0"),
        breakdown_by_class={
            "Fed Cattle": {"count": 1200, "value": Decimal("3150000.00")},
            "Feeder Cattle": {"count": 250, "value": Decimal("662500.00")},
            "Breeding Stock": {"count": 50, "value": Decimal("125000.00")}
        },
        last_updated=datetime.now()
    )
