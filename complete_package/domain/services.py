"""
Livestock Management Domain Services
Pure business logic for grading, measurements, pricing, and geolocation
Developed by: TuringDynamics

All functions are pure (no I/O) and fully testable.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Tuple, Optional
from .livestock_management import (
    RecordAnimalGrading, RecordPhysicalMeasurement, RecordHealthAssessment,
    UpdateAnimalLocation, CalculateMarketValue,
    AnimalGradingRecorded, PhysicalMeasurementRecorded, HealthAssessmentRecorded,
    AnimalLocationUpdated, MarketValueCalculated,
    MeatQualityGrade, MarketClass
)


# ============================================================================
# GRADING SERVICES
# ============================================================================

def calculate_quality_premium(quality_grade: MeatQualityGrade) -> Decimal:
    """Calculate price premium/discount based on quality grade"""
    premiums = {
        MeatQualityGrade.PRIME: Decimal("15.00"),  # +$15/cwt
        MeatQualityGrade.CHOICE: Decimal("8.00"),   # +$8/cwt
        MeatQualityGrade.SELECT: Decimal("0.00"),   # baseline
        MeatQualityGrade.STANDARD: Decimal("-5.00"),
        MeatQualityGrade.COMMERCIAL: Decimal("-10.00"),
        MeatQualityGrade.UTILITY: Decimal("-15.00"),
        MeatQualityGrade.CUTTER: Decimal("-20.00"),
        MeatQualityGrade.CANNER: Decimal("-25.00"),
    }
    return premiums.get(quality_grade, Decimal("0.00"))


def validate_marbling_score(score: int) -> bool:
    """Validate marbling score is in valid range"""
    return 100 <= score <= 1000


def estimate_dressing_percentage(live_weight_lbs: Decimal, body_condition: str) -> Decimal:
    """Estimate carcass yield percentage from live weight"""
    # Typical dressing percentage: 60-65%
    base_percentage = Decimal("62.0")
    
    # Adjust based on body condition
    adjustments = {
        "1": Decimal("-5.0"),  # Emaciated
        "2": Decimal("-3.0"),
        "3": Decimal("-1.0"),
        "4": Decimal("0.0"),
        "5": Decimal("0.0"),   # Ideal
        "6": Decimal("1.0"),
        "7": Decimal("2.0"),
        "8": Decimal("1.0"),   # Too fat reduces yield
        "9": Decimal("0.0"),
    }
    
    adjustment = adjustments.get(body_condition, Decimal("0.0"))
    return base_percentage + adjustment


# ============================================================================
# MARKET VALUATION SERVICES
# ============================================================================

def calculate_market_value(
    live_weight_lbs: Decimal,
    base_price_per_cwt: Decimal,
    quality_grade: Optional[MeatQualityGrade] = None
) -> Tuple[Decimal, Decimal]:
    """
    Calculate market value of an animal
    
    Returns: (price_per_cwt, total_value_usd)
    """
    # Convert weight to hundredweight (cwt)
    weight_cwt = live_weight_lbs / Decimal("100")
    
    # Apply quality premium if graded
    price_per_cwt = base_price_per_cwt
    if quality_grade:
        premium = calculate_quality_premium(quality_grade)
        price_per_cwt += premium
    
    # Calculate total value
    total_value = weight_cwt * price_per_cwt
    
    return (price_per_cwt, total_value)


def estimate_breakeven_price(
    purchase_price_usd: Decimal,
    feed_cost_usd: Decimal,
    vet_cost_usd: Decimal,
    other_costs_usd: Decimal,
    current_weight_lbs: Decimal
) -> Decimal:
    """Calculate breakeven price per cwt"""
    total_cost = purchase_price_usd + feed_cost_usd + vet_cost_usd + other_costs_usd
    weight_cwt = current_weight_lbs / Decimal("100")
    
    if weight_cwt == 0:
        return Decimal("0.00")
    
    return total_cost / weight_cwt


# ============================================================================
# GEOLOCATION SERVICES
# ============================================================================

def calculate_distance_miles(
    lat1: Decimal, lon1: Decimal,
    lat2: Decimal, lon2: Decimal
) -> Decimal:
    """Calculate distance between two GPS coordinates using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    
    # Earth radius in miles
    R = Decimal("3959.0")
    
    # Convert to radians
    lat1_rad = float(lat1) * 3.14159265359 / 180
    lat2_rad = float(lat2) * 3.14159265359 / 180
    delta_lat = float(lat2 - lat1) * 3.14159265359 / 180
    delta_lon = float(lon2 - lon1) * 3.14159265359 / 180
    
    # Haversine formula
    a = sin(delta_lat/2) * sin(delta_lat/2) + \
        cos(lat1_rad) * cos(lat2_rad) * \
        sin(delta_lon/2) * sin(delta_lon/2)
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    distance = float(R) * c
    return Decimal(str(round(distance, 2)))


def is_within_geofence(
    current_lat: Decimal, current_lon: Decimal,
    fence_center_lat: Decimal, fence_center_lon: Decimal,
    fence_radius_miles: Decimal
) -> bool:
    """Check if animal is within geofenced area"""
    distance = calculate_distance_miles(
        current_lat, current_lon,
        fence_center_lat, fence_center_lon
    )
    return distance <= fence_radius_miles


# ============================================================================
# EVENT CREATION SERVICES
# ============================================================================

def create_grading_event(
    command: RecordAnimalGrading,
    tenant_id: str,
    request_id: str,
    user_id: str,
    device_id: str,
    geo_location: str
) -> AnimalGradingRecorded:
    """Create AnimalGradingRecorded event from command"""
    event_id = str(uuid.uuid4())
    
    return AnimalGradingRecorded(
        event_id=event_id,
        aggregate_id=command.aggregate_id,
        quality_grade=command.quality_grade.value,
        yield_grade=command.yield_grade.value,
        marbling_score=command.marbling_score,
        ribeye_area_sq_in=str(command.ribeye_area_sq_in),
        fat_thickness_in=str(command.fat_thickness_in),
        hot_carcass_weight_lbs=str(command.hot_carcass_weight_lbs) if command.hot_carcass_weight_lbs else None,
        grader_notes=command.grader_notes,
        timestamp=command.timestamp,
        tenant_id=tenant_id,
        request_id=request_id,
        user_id=user_id,
        device_id=device_id,
        geo_location=geo_location
    )


def create_measurement_event(
    command: RecordPhysicalMeasurement,
    tenant_id: str,
    request_id: str,
    user_id: str,
    device_id: str,
    geo_location: str
) -> PhysicalMeasurementRecorded:
    """Create PhysicalMeasurementRecorded event from command"""
    event_id = str(uuid.uuid4())
    
    return PhysicalMeasurementRecorded(
        event_id=event_id,
        aggregate_id=command.aggregate_id,
        weight_lbs=str(command.weight_lbs),
        body_condition_score=command.body_condition_score.value,
        frame_score=command.frame_score,
        hip_height_in=str(command.hip_height_in) if command.hip_height_in else None,
        body_length_in=str(command.body_length_in) if command.body_length_in else None,
        measurement_notes=command.measurement_notes,
        timestamp=command.timestamp,
        tenant_id=tenant_id,
        request_id=request_id,
        user_id=user_id,
        device_id=device_id,
        geo_location=geo_location
    )


def create_location_event(
    command: UpdateAnimalLocation,
    tenant_id: str,
    request_id: str,
    user_id: str,
    device_id: str,
    geo_location: str
) -> AnimalLocationUpdated:
    """Create AnimalLocationUpdated event from command"""
    event_id = str(uuid.uuid4())
    
    return AnimalLocationUpdated(
        event_id=event_id,
        aggregate_id=command.aggregate_id,
        latitude=str(command.latitude),
        longitude=str(command.longitude),
        altitude_m=str(command.altitude_m) if command.altitude_m else None,
        accuracy_m=str(command.accuracy_m) if command.accuracy_m else None,
        property_id=command.property_id,
        pasture_id=command.pasture_id,
        movement_notes=command.movement_notes,
        timestamp=command.timestamp,
        tenant_id=tenant_id,
        request_id=request_id,
        user_id=user_id,
        device_id=device_id,
        geo_location=geo_location
    )


def create_valuation_event(
    command: CalculateMarketValue,
    base_price_per_cwt: Decimal,
    price_source: str,
    tenant_id: str,
    request_id: str,
    user_id: str,
    device_id: str,
    geo_location: str
) -> MarketValueCalculated:
    """Create MarketValueCalculated event from command"""
    event_id = str(uuid.uuid4())
    
    # Calculate market value
    price_per_cwt, total_value = calculate_market_value(
        command.live_weight_lbs,
        base_price_per_cwt,
        command.quality_grade
    )
    
    return MarketValueCalculated(
        event_id=event_id,
        aggregate_id=command.aggregate_id,
        market_class=command.market_class.value,
        live_weight_lbs=str(command.live_weight_lbs),
        quality_grade=command.quality_grade.value if command.quality_grade else None,
        market_price_per_cwt=str(price_per_cwt),
        estimated_value_usd=str(total_value),
        price_source=price_source,
        timestamp=command.timestamp,
        tenant_id=tenant_id,
        request_id=request_id,
        user_id=user_id,
        device_id=device_id,
        geo_location=geo_location
    )
