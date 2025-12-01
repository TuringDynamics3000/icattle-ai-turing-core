"""
Livestock Management Domain Model
Comprehensive system for grading, measurements, pricing, and geolocation
Developed by: TuringDynamics

All operations enforce Turing Protocol for bank-grade auditability.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# ============================================================================
# ENUMERATIONS
# ============================================================================

class MeatQualityGrade(str, Enum):
    """USDA Meat Quality Grades"""
    PRIME = "Prime"
    CHOICE = "Choice"
    SELECT = "Select"
    STANDARD = "Standard"
    COMMERCIAL = "Commercial"
    UTILITY = "Utility"
    CUTTER = "Cutter"
    CANNER = "Canner"


class YieldGrade(str, Enum):
    """USDA Yield Grades (1-5, 1 being highest cutability)"""
    YIELD_1 = "1"
    YIELD_2 = "2"
    YIELD_3 = "3"
    YIELD_4 = "4"
    YIELD_5 = "5"


class BodyConditionScore(str, Enum):
    """Body Condition Score (1-9 scale)"""
    EMACIATED = "1"  # Severely undernourished
    VERY_THIN = "2"
    THIN = "3"
    BORDERLINE = "4"
    MODERATE = "5"  # Ideal
    GOOD = "6"
    FLESHY = "7"
    FAT = "8"
    OBESE = "9"


class HealthStatus(str, Enum):
    """Animal Health Status"""
    HEALTHY = "Healthy"
    MONITORED = "Monitored"
    SICK = "Sick"
    QUARANTINED = "Quarantined"
    RECOVERING = "Recovering"


class MarketClass(str, Enum):
    """Livestock Market Classification"""
    FEEDER_CATTLE = "Feeder Cattle"
    FED_CATTLE = "Fed Cattle"
    BREEDING_STOCK = "Breeding Stock"
    CULL_CATTLE = "Cull Cattle"


# ============================================================================
# COMMANDS
# ============================================================================

@dataclass(frozen=True)
class RecordAnimalGrading:
    """Command to record meat quality and yield grading"""
    aggregate_id: str  # Muzzle hash
    quality_grade: MeatQualityGrade
    yield_grade: YieldGrade
    marbling_score: int  # 100-1000 scale
    ribeye_area_sq_in: Decimal
    fat_thickness_in: Decimal
    hot_carcass_weight_lbs: Optional[Decimal]
    timestamp: datetime
    grader_notes: Optional[str] = None


@dataclass(frozen=True)
class RecordPhysicalMeasurement:
    """Command to record physical measurements"""
    aggregate_id: str  # Muzzle hash
    weight_lbs: Decimal
    body_condition_score: BodyConditionScore
    frame_score: int  # 1-9 scale
    hip_height_in: Optional[Decimal]
    body_length_in: Optional[Decimal]
    timestamp: datetime
    measurement_notes: Optional[str] = None


@dataclass(frozen=True)
class RecordHealthAssessment:
    """Command to record health metrics"""
    aggregate_id: str  # Muzzle hash
    health_status: HealthStatus
    temperature_f: Optional[Decimal]
    heart_rate_bpm: Optional[int]
    respiratory_rate: Optional[int]
    mobility_score: int  # 1-5 scale
    vaccination_current: bool
    timestamp: datetime
    veterinarian_notes: Optional[str] = None


@dataclass(frozen=True)
class UpdateAnimalLocation:
    """Command to update animal geolocation"""
    aggregate_id: str  # Muzzle hash
    latitude: Decimal
    longitude: Decimal
    altitude_m: Optional[Decimal]
    accuracy_m: Optional[Decimal]
    property_id: Optional[str]
    pasture_id: Optional[str]
    timestamp: datetime
    movement_notes: Optional[str] = None


@dataclass(frozen=True)
class CalculateMarketValue:
    """Command to calculate current market value"""
    aggregate_id: str  # Muzzle hash
    market_class: MarketClass
    live_weight_lbs: Decimal
    quality_grade: Optional[MeatQualityGrade]
    timestamp: datetime


# ============================================================================
# DOMAIN EVENTS
# ============================================================================

@dataclass(frozen=True)
class AnimalGradingRecorded:
    """Event: Animal grading was recorded"""
    event_id: str
    aggregate_id: str  # Muzzle hash
    quality_grade: str
    yield_grade: str
    marbling_score: int
    ribeye_area_sq_in: str  # Decimal as string for JSON
    fat_thickness_in: str
    hot_carcass_weight_lbs: Optional[str]
    grader_notes: Optional[str]
    timestamp: datetime
    
    # Turing Protocol Context
    tenant_id: str
    request_id: str
    user_id: str
    device_id: str
    geo_location: str


@dataclass(frozen=True)
class PhysicalMeasurementRecorded:
    """Event: Physical measurement was recorded"""
    event_id: str
    aggregate_id: str  # Muzzle hash
    weight_lbs: str  # Decimal as string
    body_condition_score: str
    frame_score: int
    hip_height_in: Optional[str]
    body_length_in: Optional[str]
    measurement_notes: Optional[str]
    timestamp: datetime
    
    # Turing Protocol Context
    tenant_id: str
    request_id: str
    user_id: str
    device_id: str
    geo_location: str


@dataclass(frozen=True)
class HealthAssessmentRecorded:
    """Event: Health assessment was recorded"""
    event_id: str
    aggregate_id: str  # Muzzle hash
    health_status: str
    temperature_f: Optional[str]
    heart_rate_bpm: Optional[int]
    respiratory_rate: Optional[int]
    mobility_score: int
    vaccination_current: bool
    veterinarian_notes: Optional[str]
    timestamp: datetime
    
    # Turing Protocol Context
    tenant_id: str
    request_id: str
    user_id: str
    device_id: str
    geo_location: str


@dataclass(frozen=True)
class AnimalLocationUpdated:
    """Event: Animal location was updated"""
    event_id: str
    aggregate_id: str  # Muzzle hash
    latitude: str  # Decimal as string
    longitude: str
    altitude_m: Optional[str]
    accuracy_m: Optional[str]
    property_id: Optional[str]
    pasture_id: Optional[str]
    movement_notes: Optional[str]
    timestamp: datetime
    
    # Turing Protocol Context
    tenant_id: str
    request_id: str
    user_id: str
    device_id: str
    geo_location: str


@dataclass(frozen=True)
class MarketValueCalculated:
    """Event: Market value was calculated"""
    event_id: str
    aggregate_id: str  # Muzzle hash
    market_class: str
    live_weight_lbs: str
    quality_grade: Optional[str]
    market_price_per_cwt: str  # Price per hundredweight
    estimated_value_usd: str
    price_source: str  # e.g., "CME Live Cattle Futures"
    timestamp: datetime
    
    # Turing Protocol Context
    tenant_id: str
    request_id: str
    user_id: str
    device_id: str
    geo_location: str


# ============================================================================
# VALUE OBJECTS
# ============================================================================

@dataclass(frozen=True)
class LivestockGrade:
    """Complete grading assessment"""
    quality_grade: MeatQualityGrade
    yield_grade: YieldGrade
    marbling_score: int
    ribeye_area_sq_in: Decimal
    fat_thickness_in: Decimal
    hot_carcass_weight_lbs: Optional[Decimal]


@dataclass(frozen=True)
class PhysicalMetrics:
    """Physical measurements"""
    weight_lbs: Decimal
    body_condition_score: BodyConditionScore
    frame_score: int
    hip_height_in: Optional[Decimal]
    body_length_in: Optional[Decimal]


@dataclass(frozen=True)
class HealthMetrics:
    """Health assessment metrics"""
    health_status: HealthStatus
    temperature_f: Optional[Decimal]
    heart_rate_bpm: Optional[int]
    respiratory_rate: Optional[int]
    mobility_score: int
    vaccination_current: bool


@dataclass(frozen=True)
class GeoLocation:
    """Geographic location"""
    latitude: Decimal
    longitude: Decimal
    altitude_m: Optional[Decimal]
    accuracy_m: Optional[Decimal]
    property_id: Optional[str]
    pasture_id: Optional[str]


@dataclass(frozen=True)
class MarketValuation:
    """Market value calculation"""
    market_class: MarketClass
    live_weight_lbs: Decimal
    quality_grade: Optional[MeatQualityGrade]
    market_price_per_cwt: Decimal
    estimated_value_usd: Decimal
    price_source: str
