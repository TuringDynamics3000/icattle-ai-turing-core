"""
International Livestock Management Domain Services
Unified services supporting both US (USDA) and Australian (MSA) standards
Developed by: TuringDynamics

Supports:
- US Market: USDA grading, CME pricing, imperial units, USD
- Australian Market: MSA grading, EYCI pricing, metric units, AUD
- Automatic market detection and conversion
- Multi-currency support
- Multi-standard grading
"""

from decimal import Decimal
from typing import Optional, Union, Literal
from datetime import datetime
import uuid

# Import both US and Australian domain models
from .livestock_management import (
    MeatQualityGrade as USDAGrade,
    YieldGrade as USDAYieldGrade,
    MarketClass as USMarketClass,
)
from .livestock_management_australia import (
    MSAGrade,
    AUSMEATMarbling,
    AUSMEATFatScore,
    AustralianMarketClass,
    AustralianRegion,
)

# Type aliases
MarketRegion = Literal["US", "AU"]
Currency = Literal["USD", "AUD"]


# ============================================================================
# MARKET DETECTION
# ============================================================================

def detect_market_from_coordinates(latitude: Decimal, longitude: Decimal) -> MarketRegion:
    """
    Detect market region from GPS coordinates
    
    US Ranges:
    - Latitude: 24° to 49° (Southern US to Canadian border)
    - Longitude: -125° to -66° (West Coast to East Coast)
    
    Australian Ranges:
    - Latitude: -10° to -44° (Northern Australia to Tasmania)
    - Longitude: 113° to 154° (Western Australia to Eastern NSW)
    """
    lat = float(latitude)
    lon = float(longitude)
    
    # Check Australian ranges
    if -44 <= lat <= -10 and 113 <= lon <= 154:
        return "AU"
    
    # Check US ranges
    if 24 <= lat <= 49 and -125 <= lon <= -66:
        return "US"
    
    # Default to US if ambiguous
    return "US"


def detect_market_from_tenant_id(tenant_id: str) -> MarketRegion:
    """
    Detect market from tenant ID prefix
    
    Convention:
    - US tenants: US-XXXXX or OWNER-XXXXX
    - AU tenants: AU-XXXXX or QPIC-XXXXX
    """
    if tenant_id.startswith("AU-") or tenant_id.startswith("QPIC-") or tenant_id.startswith("NPIC-"):
        return "AU"
    return "US"


def detect_market_from_animal_id(animal_id: str) -> MarketRegion:
    """
    Detect market from animal identifier format
    
    US: Various formats (EID tags, muzzle hash)
    AU: NLIS 16-digit format (982 000XXXXXXXXX)
    """
    # Remove spaces and check if it's NLIS format
    clean_id = animal_id.replace(" ", "")
    if len(clean_id) == 16 and clean_id.startswith("982"):
        return "AU"
    return "US"


# ============================================================================
# UNIT CONVERSION
# ============================================================================

def lbs_to_kg(pounds: Decimal) -> Decimal:
    """Convert pounds to kilograms"""
    return pounds * Decimal("0.453592")


def kg_to_lbs(kilograms: Decimal) -> Decimal:
    """Convert kilograms to pounds"""
    return kilograms * Decimal("2.20462")


def inches_to_cm(inches: Decimal) -> Decimal:
    """Convert inches to centimeters"""
    return inches * Decimal("2.54")


def cm_to_inches(centimeters: Decimal) -> Decimal:
    """Convert centimeters to inches"""
    return centimeters / Decimal("2.54")


def fahrenheit_to_celsius(fahrenheit: Decimal) -> Decimal:
    """Convert Fahrenheit to Celsius"""
    return (fahrenheit - Decimal("32")) * Decimal("5") / Decimal("9")


def celsius_to_fahrenheit(celsius: Decimal) -> Decimal:
    """Convert Celsius to Fahrenheit"""
    return (celsius * Decimal("9") / Decimal("5")) + Decimal("32")


def cwt_to_kg(hundredweight: Decimal) -> Decimal:
    """Convert hundredweight (cwt) to kilograms"""
    return hundredweight * Decimal("45.3592")


def kg_to_cwt(kilograms: Decimal) -> Decimal:
    """Convert kilograms to hundredweight (cwt)"""
    return kilograms / Decimal("45.3592")


# ============================================================================
# CURRENCY CONVERSION
# ============================================================================

class CurrencyConverter:
    """
    Currency conversion service
    
    In production, would use real-time FX rates from:
    - Reserve Bank of Australia (RBA)
    - Federal Reserve Economic Data (FRED)
    - Commercial FX APIs (XE.com, OANDA, etc.)
    """
    
    def __init__(self):
        # Demo exchange rate (realistic 2025 range)
        self.usd_to_aud = Decimal("1.52")  # 1 USD = 1.52 AUD
        self.aud_to_usd = Decimal("0.658")  # 1 AUD = 0.658 USD
    
    def convert(self, amount: Decimal, from_currency: Currency, to_currency: Currency) -> Decimal:
        """Convert between USD and AUD"""
        if from_currency == to_currency:
            return amount
        
        if from_currency == "USD" and to_currency == "AUD":
            return amount * self.usd_to_aud
        
        if from_currency == "AUD" and to_currency == "USD":
            return amount * self.aud_to_usd
        
        raise ValueError(f"Unsupported conversion: {from_currency} to {to_currency}")
    
    def usd_per_cwt_to_aud_per_kg(self, usd_per_cwt: Decimal) -> Decimal:
        """Convert US pricing ($/cwt) to Australian pricing (AUD/kg)"""
        # 1 cwt = 45.3592 kg
        usd_per_kg = usd_per_cwt / Decimal("45.3592")
        aud_per_kg = usd_per_kg * self.usd_to_aud
        return aud_per_kg
    
    def aud_per_kg_to_usd_per_cwt(self, aud_per_kg: Decimal) -> Decimal:
        """Convert Australian pricing (AUD/kg) to US pricing ($/cwt)"""
        usd_per_kg = aud_per_kg * self.aud_to_usd
        usd_per_cwt = usd_per_kg * Decimal("45.3592")
        return usd_per_cwt


# Global currency converter instance
currency_converter = CurrencyConverter()


# ============================================================================
# GRADING CONVERSION
# ============================================================================

def usda_to_msa_approximate(usda_grade: str) -> str:
    """
    Approximate conversion from USDA to MSA grades
    
    Note: This is a rough approximation. Actual grading systems
    use different criteria and are not directly comparable.
    """
    mapping = {
        "Prime": "5 Star",
        "Choice": "4 Star",
        "Select": "3 Star",
        "Standard": "3 Star",
        "Commercial": "Ungraded",
        "Utility": "Ungraded",
        "Cutter": "Ungraded",
        "Canner": "Ungraded",
    }
    return mapping.get(usda_grade, "Ungraded")


def msa_to_usda_approximate(msa_grade: str) -> str:
    """
    Approximate conversion from MSA to USDA grades
    
    Note: This is a rough approximation. Actual grading systems
    use different criteria and are not directly comparable.
    """
    mapping = {
        "5 Star": "Prime",
        "4 Star": "Choice",
        "3 Star": "Select",
        "Ungraded": "Select",
    }
    return mapping.get(msa_grade, "Select")


def usda_marbling_to_ausmeat(usda_marbling: int) -> str:
    """
    Approximate conversion from USDA marbling (100-1000) to AUS-MEAT (0-9)
    
    USDA Scale:
    - 100-199: Practically Devoid
    - 200-299: Traces
    - 300-399: Slight
    - 400-499: Small
    - 500-599: Modest
    - 600-699: Moderate
    - 700-799: Slightly Abundant
    - 800-899: Moderately Abundant
    - 900-999: Abundant
    - 1000+: Very Abundant
    
    AUS-MEAT Scale: 0-9 (similar progression)
    """
    if usda_marbling < 200:
        return "0"  # Nil
    elif usda_marbling < 300:
        return "1"  # Traces
    elif usda_marbling < 400:
        return "2"  # Slight
    elif usda_marbling < 500:
        return "3"  # Small
    elif usda_marbling < 600:
        return "4"  # Modest
    elif usda_marbling < 700:
        return "5"  # Moderate
    elif usda_marbling < 800:
        return "6"  # Slightly Abundant
    elif usda_marbling < 900:
        return "7"  # Moderately Abundant
    elif usda_marbling < 1000:
        return "8"  # Abundant
    else:
        return "9"  # Very Abundant


def ausmeat_to_usda_marbling(ausmeat_score: str) -> int:
    """Convert AUS-MEAT marbling (0-9) to USDA scale (100-1000)"""
    mapping = {
        "0": 150,
        "1": 250,
        "2": 350,
        "3": 450,
        "4": 550,
        "5": 650,
        "6": 750,
        "7": 850,
        "8": 950,
        "9": 1050,
    }
    return mapping.get(ausmeat_score, 500)


# ============================================================================
# UNIFIED VALUATION SERVICE
# ============================================================================

class InternationalValuationService:
    """
    Unified valuation service supporting both US and Australian markets
    """
    
    def __init__(self):
        self.currency_converter = currency_converter
    
    def calculate_value(
        self,
        market: MarketRegion,
        weight_kg: Decimal,
        grade: str,
        region: str,
        base_price_per_kg: Decimal,
        currency: Currency = "USD"
    ) -> dict:
        """
        Calculate animal value with market-specific logic
        
        Returns:
            dict with value in both USD and AUD, plus breakdown
        """
        if market == "US":
            # Convert to US units
            weight_lbs = kg_to_lbs(weight_kg)
            weight_cwt = weight_lbs / Decimal("100")
            
            # US pricing is per cwt
            price_per_cwt = base_price_per_kg * Decimal("45.3592")
            
            # Calculate value in USD
            value_usd = weight_cwt * price_per_cwt
            value_aud = self.currency_converter.convert(value_usd, "USD", "AUD")
            
            return {
                "market": "US",
                "weight_lbs": float(weight_lbs),
                "weight_cwt": float(weight_cwt),
                "weight_kg": float(weight_kg),
                "grade": grade,
                "region": region,
                "price_per_cwt_usd": float(price_per_cwt),
                "price_per_kg_usd": float(base_price_per_kg),
                "value_usd": float(value_usd),
                "value_aud": float(value_aud),
                "currency": currency,
            }
        
        else:  # AU
            # Australian pricing is per kg
            price_per_kg_aud = base_price_per_kg
            
            # Calculate value in AUD
            value_aud = weight_kg * price_per_kg_aud
            value_usd = self.currency_converter.convert(value_aud, "AUD", "USD")
            
            return {
                "market": "AU",
                "weight_kg": float(weight_kg),
                "weight_lbs": float(kg_to_lbs(weight_kg)),
                "grade": grade,
                "region": region,
                "price_per_kg_aud": float(price_per_kg_aud),
                "price_per_kg_usd": float(value_usd / weight_kg),
                "value_aud": float(value_aud),
                "value_usd": float(value_usd),
                "currency": currency,
            }
    
    def compare_markets(
        self,
        weight_kg: Decimal,
        us_grade: str,
        au_grade: str,
        us_price_per_cwt: Decimal,
        au_price_per_kg: Decimal
    ) -> dict:
        """
        Compare valuations across US and Australian markets
        
        Useful for export decision-making
        """
        # US valuation
        us_value = self.calculate_value(
            market="US",
            weight_kg=weight_kg,
            grade=us_grade,
            region="US",
            base_price_per_kg=us_price_per_cwt / Decimal("45.3592"),
            currency="USD"
        )
        
        # AU valuation
        au_value = self.calculate_value(
            market="AU",
            weight_kg=weight_kg,
            grade=au_grade,
            region="AU",
            base_price_per_kg=au_price_per_kg,
            currency="AUD"
        )
        
        # Compare in USD
        difference_usd = us_value["value_usd"] - au_value["value_usd"]
        better_market = "US" if difference_usd > 0 else "AU"
        
        return {
            "us_valuation": us_value,
            "au_valuation": au_value,
            "difference_usd": float(difference_usd),
            "difference_aud": float(self.currency_converter.convert(
                Decimal(str(difference_usd)), "USD", "AUD"
            )),
            "better_market": better_market,
            "percentage_difference": float(abs(difference_usd) / us_value["value_usd"] * 100),
        }


# Global valuation service instance
international_valuation_service = InternationalValuationService()


# ============================================================================
# EVENT CREATION HELPERS (INTERNATIONAL)
# ============================================================================

def create_international_grading_event(
    market: MarketRegion,
    animal_id: str,
    grade: str,
    marbling: Union[int, str],
    weight_kg: Decimal,
    tenant_id: str,
    request_id: str,
    user_id: str,
    device_id: str,
    geo_location: str,
    timestamp: datetime
) -> dict:
    """
    Create grading event for either US or Australian market
    
    Returns standardized event dict that can be stored in unified event log
    """
    event_id = str(uuid.uuid4())
    
    base_event = {
        "event_id": event_id,
        "market": market,
        "animal_id": animal_id,
        "grade": grade,
        "weight_kg": str(weight_kg),
        "timestamp": timestamp,
        # Turing Protocol Context
        "tenant_id": tenant_id,
        "request_id": request_id,
        "user_id": user_id,
        "device_id": device_id,
        "geo_location": geo_location,
    }
    
    if market == "US":
        base_event.update({
            "quality_grade": grade,
            "marbling_score": marbling,
            "weight_lbs": str(kg_to_lbs(weight_kg)),
        })
    else:  # AU
        base_event.update({
            "msa_grade": grade,
            "marbling_score": str(marbling),
        })
    
    return base_event


# ============================================================================
# MARKET-SPECIFIC HELPERS
# ============================================================================

def get_market_config(market: MarketRegion) -> dict:
    """Get configuration for specific market"""
    configs = {
        "US": {
            "currency": "USD",
            "weight_unit": "lbs",
            "height_unit": "inches",
            "temperature_unit": "fahrenheit",
            "pricing_unit": "per_cwt",
            "grading_system": "USDA",
            "id_system": "EID",
            "regions": ["Texas", "Kansas", "Nebraska", "Iowa", "California"],
        },
        "AU": {
            "currency": "AUD",
            "weight_unit": "kg",
            "height_unit": "cm",
            "temperature_unit": "celsius",
            "pricing_unit": "per_kg",
            "grading_system": "MSA",
            "id_system": "NLIS",
            "regions": ["Queensland", "New South Wales", "Victoria", "South Australia", "Western Australia"],
        },
    }
    return configs[market]


def format_price_for_market(
    price: Decimal,
    market: MarketRegion,
    currency: Optional[Currency] = None
) -> str:
    """Format price according to market conventions"""
    if currency is None:
        currency = "USD" if market == "US" else "AUD"
    
    if market == "US":
        return f"${price:.2f}/cwt ({currency})"
    else:
        return f"${price:.2f}/kg ({currency})"


def format_weight_for_market(weight_kg: Decimal, market: MarketRegion) -> str:
    """Format weight according to market conventions"""
    if market == "US":
        weight_lbs = kg_to_lbs(weight_kg)
        return f"{weight_lbs:.1f} lbs ({weight_kg:.1f} kg)"
    else:
        return f"{weight_kg:.1f} kg ({kg_to_lbs(weight_kg):.1f} lbs)"
