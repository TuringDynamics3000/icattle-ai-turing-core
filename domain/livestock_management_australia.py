"""
Australian Livestock Management Domain Model
MSA (Meat Standards Australia) grading system with EYCI pricing
Developed by: TuringDynamics

All operations enforce Turing Protocol for bank-grade auditability.
Adapted for Australian market with MSA standards, metric units, and AUD currency.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# ============================================================================
# AUSTRALIAN ENUMERATIONS
# ============================================================================

class MSAGrade(str, Enum):
    """MSA (Meat Standards Australia) Quality Grades"""
    MSA_5_STAR = "5 Star"
    MSA_4_STAR = "4 Star"
    MSA_3_STAR = "3 Star"
    MSA_UNGRADED = "Ungraded"


class AUSMEATMarbling(str, Enum):
    """AUS-MEAT Marbling Scores (0-9 scale)"""
    MARBLING_0 = "0"  # Nil
    MARBLING_1 = "1"  # Traces
    MARBLING_2 = "2"  # Slight
    MARBLING_3 = "3"  # Small
    MARBLING_4 = "4"  # Modest
    MARBLING_5 = "5"  # Moderate
    MARBLING_6 = "6"  # Slightly Abundant
    MARBLING_7 = "7"  # Moderately Abundant
    MARBLING_8 = "8"  # Abundant
    MARBLING_9 = "9"  # Very Abundant


class AUSMEATFatScore(str, Enum):
    """AUS-MEAT Fat Score (0-6 scale)"""
    FAT_0 = "0"  # Nil
    FAT_1 = "1"  # 1mm
    FAT_2 = "2"  # 3mm
    FAT_3 = "3"  # 5mm
    FAT_4 = "4"  # 10mm
    FAT_5 = "5"  # 15mm
    FAT_6 = "6"  # 20mm+


class BodyConditionScore(str, Enum):
    """Body Condition Score (1-5 scale, Australian standard)"""
    VERY_POOR = "1"
    POOR = "2"
    MODERATE = "3"  # Ideal
    GOOD = "4"
    VERY_GOOD = "5"


class HealthStatus(str, Enum):
    """Animal Health Status"""
    HEALTHY = "Healthy"
    MONITORED = "Monitored"
    SICK = "Sick"
    QUARANTINED = "Quarantined"
    RECOVERING = "Recovering"


class AustralianMarketClass(str, Enum):
    """Australian Livestock Market Classification"""
    TRADE_CATTLE = "Trade Cattle"  # 200-400kg
    HEAVY_STEERS = "Heavy Steers"  # 400-600kg
    EXPORT_CATTLE = "Export Cattle"  # 600kg+
    FEEDER_CATTLE = "Feeder Cattle"  # Young cattle for feeding
    BREEDING_STOCK = "Breeding Stock"
    BOBBY_CALVES = "Bobby Calves"  # <30 days old
    CULL_CATTLE = "Cull Cattle"


class AustralianRegion(str, Enum):
    """Australian Cattle Regions"""
    QUEENSLAND = "Queensland"
    NEW_SOUTH_WALES = "New South Wales"
    VICTORIA = "Victoria"
    SOUTH_AUSTRALIA = "South Australia"
    WESTERN_AUSTRALIA = "Western Australia"
    NORTHERN_TERRITORY = "Northern Territory"
    TASMANIA = "Tasmania"


# ============================================================================
# COMMANDS
# ============================================================================

@dataclass(frozen=True)
class RecordMSAGrading:
    """Command to record MSA grading assessment"""
    aggregate_id: str  # NLIS (National Livestock Identification System) tag or muzzle hash
    msa_grade: MSAGrade
    marbling_score: AUSMEATMarbling
    fat_score: AUSMEATFatScore
    eye_muscle_area_sq_cm: Decimal
    hump_height_mm: Decimal
    hot_standard_carcass_weight_kg: Optional[Decimal]
    ossification_score: int  # 100-590 scale
    ph_ultimate: Optional[Decimal]  # pH measurement
    timestamp: datetime
    grader_notes: Optional[str] = None


@dataclass(frozen=True)
class RecordPhysicalMeasurement:
    """Command to record physical measurements (metric units)"""
    aggregate_id: str  # NLIS tag or muzzle hash
    weight_kg: Decimal
    body_condition_score: BodyConditionScore
    frame_score: int  # 1-9 scale
    hip_height_cm: Optional[Decimal]
    body_length_cm: Optional[Decimal]
    scrotal_circumference_cm: Optional[Decimal]  # For bulls
    timestamp: datetime
    measurement_notes: Optional[str] = None


@dataclass(frozen=True)
class RecordHealthAssessment:
    """Command to record health metrics"""
    aggregate_id: str  # NLIS tag or muzzle hash
    health_status: HealthStatus
    temperature_c: Optional[Decimal]  # Celsius
    heart_rate_bpm: Optional[int]
    respiratory_rate: Optional[int]
    mobility_score: int  # 1-5 scale
    vaccination_current: bool
    lpa_compliant: bool  # Livestock Production Assurance
    nlis_registered: bool  # NLIS registration status
    timestamp: datetime
    veterinarian_notes: Optional[str] = None


@dataclass(frozen=True)
class UpdateAnimalLocation:
    """Command to update animal geolocation (Australian coordinates)"""
    aggregate_id: str  # NLIS tag or muzzle hash
    latitude: Decimal  # -10 to -44 (Australian range)
    longitude: Decimal  # 113 to 154 (Australian range)
    altitude_m: Optional[Decimal]
    accuracy_m: Optional[Decimal]
    property_pic: Optional[str]  # Property Identification Code
    paddock_id: Optional[str]
    state: Optional[AustralianRegion]
    timestamp: datetime
    movement_notes: Optional[str] = None


@dataclass(frozen=True)
class CalculateMarketValue:
    """Command to calculate current market value (AUD)"""
    aggregate_id: str  # NLIS tag or muzzle hash
    market_class: AustralianMarketClass
    live_weight_kg: Decimal
    msa_grade: Optional[MSAGrade]
    region: AustralianRegion
    timestamp: datetime


# ============================================================================
# DOMAIN EVENTS
# ============================================================================

@dataclass(frozen=True)
class MSAGradingRecorded:
    """Event: MSA grading was recorded"""
    event_id: str
    aggregate_id: str  # NLIS tag or muzzle hash
    msa_grade: str
    marbling_score: str
    fat_score: str
    eye_muscle_area_sq_cm: str  # Decimal as string
    hump_height_mm: str
    hot_standard_carcass_weight_kg: Optional[str]
    ossification_score: int
    ph_ultimate: Optional[str]
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
    """Event: Physical measurement was recorded (metric)"""
    event_id: str
    aggregate_id: str  # NLIS tag or muzzle hash
    weight_kg: str  # Decimal as string
    body_condition_score: str
    frame_score: int
    hip_height_cm: Optional[str]
    body_length_cm: Optional[str]
    scrotal_circumference_cm: Optional[str]
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
    aggregate_id: str  # NLIS tag or muzzle hash
    health_status: str
    temperature_c: Optional[str]
    heart_rate_bpm: Optional[int]
    respiratory_rate: Optional[int]
    mobility_score: int
    vaccination_current: bool
    lpa_compliant: bool
    nlis_registered: bool
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
    """Event: Animal location was updated (Australian coordinates)"""
    event_id: str
    aggregate_id: str  # NLIS tag or muzzle hash
    latitude: str  # Decimal as string
    longitude: str
    altitude_m: Optional[str]
    accuracy_m: Optional[str]
    property_pic: Optional[str]
    paddock_id: Optional[str]
    state: Optional[str]
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
    """Event: Market value was calculated (AUD)"""
    event_id: str
    aggregate_id: str  # NLIS tag or muzzle hash
    market_class: str
    live_weight_kg: str
    msa_grade: Optional[str]
    region: str
    market_price_per_kg: str  # AUD per kg
    estimated_value_aud: str
    price_source: str  # e.g., "EYCI", "NLRS"
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
class MSAGradeAssessment:
    """Complete MSA grading assessment"""
    msa_grade: MSAGrade
    marbling_score: AUSMEATMarbling
    fat_score: AUSMEATFatScore
    eye_muscle_area_sq_cm: Decimal
    hump_height_mm: Decimal
    hot_standard_carcass_weight_kg: Optional[Decimal]
    ossification_score: int
    ph_ultimate: Optional[Decimal]


@dataclass(frozen=True)
class PhysicalMetrics:
    """Physical measurements (metric units)"""
    weight_kg: Decimal
    body_condition_score: BodyConditionScore
    frame_score: int
    hip_height_cm: Optional[Decimal]
    body_length_cm: Optional[Decimal]
    scrotal_circumference_cm: Optional[Decimal]


@dataclass(frozen=True)
class HealthMetrics:
    """Health assessment metrics"""
    health_status: HealthStatus
    temperature_c: Optional[Decimal]
    heart_rate_bpm: Optional[int]
    respiratory_rate: Optional[int]
    mobility_score: int
    vaccination_current: bool
    lpa_compliant: bool
    nlis_registered: bool


@dataclass(frozen=True)
class AustralianGeoLocation:
    """Geographic location (Australian coordinates)"""
    latitude: Decimal  # -10 to -44
    longitude: Decimal  # 113 to 154
    altitude_m: Optional[Decimal]
    accuracy_m: Optional[Decimal]
    property_pic: Optional[str]  # Property Identification Code
    paddock_id: Optional[str]
    state: Optional[AustralianRegion]


@dataclass(frozen=True)
class AustralianMarketValuation:
    """Market value calculation (AUD)"""
    market_class: AustralianMarketClass
    live_weight_kg: Decimal
    msa_grade: Optional[MSAGrade]
    region: AustralianRegion
    market_price_per_kg: Decimal  # AUD
    estimated_value_aud: Decimal
    price_source: str


# ============================================================================
# AUSTRALIAN-SPECIFIC CONSTANTS
# ============================================================================

# MSA Grade Premiums (AUD per kg)
MSA_GRADE_PREMIUMS = {
    MSAGrade.MSA_5_STAR: Decimal("0.80"),
    MSAGrade.MSA_4_STAR: Decimal("0.50"),
    MSAGrade.MSA_3_STAR: Decimal("0.20"),
    MSAGrade.MSA_UNGRADED: Decimal("0.00"),
}

# Regional Price Adjustments (AUD per kg)
REGIONAL_ADJUSTMENTS = {
    AustralianRegion.QUEENSLAND: Decimal("0.10"),
    AustralianRegion.NEW_SOUTH_WALES: Decimal("0.05"),
    AustralianRegion.VICTORIA: Decimal("0.00"),  # Baseline
    AustralianRegion.SOUTH_AUSTRALIA: Decimal("-0.05"),
    AustralianRegion.WESTERN_AUSTRALIA: Decimal("-0.10"),
    AustralianRegion.NORTHERN_TERRITORY: Decimal("-0.15"),
    AustralianRegion.TASMANIA: Decimal("0.05"),
}

# Typical dressing percentages for Australian cattle
DRESSING_PERCENTAGE_RANGE = (Decimal("52.0"), Decimal("58.0"))  # 52-58%
