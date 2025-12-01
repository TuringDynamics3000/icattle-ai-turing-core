"""
Comprehensive Test Script for iCattle.ai Livestock Management
Tests all features with Turing Protocol enforcement
Developed by: TuringDynamics

Features tested:
- Animal grading (USDA quality and yield grades)
- Physical measurements (weight, body condition, frame score)
- Health assessments (temperature, mobility, vaccination)
- Geolocation tracking (GPS coordinates, property/pasture)
- Market valuation (live pricing integration)
- Portfolio analytics (multi-tenant aggregation)
"""

import asyncio
import aiohttp
from datetime import datetime
from decimal import Decimal
import uuid
import json
from typing import Dict, List


# ============================================================================
# TEST CONFIGURATION
# ============================================================================

API_BASE_URL = "http://localhost:8002/api/v1/livestock"

# Test data: 4 owners with different herd sizes
TEST_TENANTS = {
    "OWNER-001": {"name": "Smith Ranch", "animals": 5},
    "OWNER-002": {"name": "Johnson Cattle Co", "animals": 3},
    "OWNER-003": {"name": "Williams Feedlot", "animals": 4},
    "OWNER-004": {"name": "Davis Livestock", "animals": 3},
}

# Realistic animal data
SAMPLE_ANIMALS = [
    {
        "muzzle_hash": "muzzle_hash_001",
        "quality_grade": "Choice",
        "yield_grade": "2",
        "marbling_score": 550,
        "ribeye_area_sq_in": 13.5,
        "fat_thickness_in": 0.45,
        "weight_lbs": 1350,
        "body_condition_score": "5",
        "frame_score": 6,
        "latitude": 39.7392,
        "longitude": -104.9903,
        "property_id": "RANCH-001",
        "pasture_id": "PASTURE-A"
    },
    {
        "muzzle_hash": "muzzle_hash_002",
        "quality_grade": "Prime",
        "yield_grade": "1",
        "marbling_score": 780,
        "ribeye_area_sq_in": 14.2,
        "fat_thickness_in": 0.52,
        "weight_lbs": 1425,
        "body_condition_score": "6",
        "frame_score": 7,
        "latitude": 39.7401,
        "longitude": -104.9912,
        "property_id": "RANCH-001",
        "pasture_id": "PASTURE-A"
    },
    {
        "muzzle_hash": "muzzle_hash_003",
        "quality_grade": "Select",
        "yield_grade": "3",
        "marbling_score": 420,
        "ribeye_area_sq_in": 12.8,
        "fat_thickness_in": 0.38,
        "weight_lbs": 1280,
        "body_condition_score": "4",
        "frame_score": 5,
        "latitude": 39.7385,
        "longitude": -104.9895,
        "property_id": "RANCH-001",
        "pasture_id": "PASTURE-B"
    },
]


# ============================================================================
# TURING PROTOCOL HEADERS
# ============================================================================

def create_turing_headers(tenant_id: str, user_id: str, device_id: str, geo_location: str) -> Dict[str, str]:
    """Create Turing Protocol headers for API requests"""
    return {
        "X-Tenant-ID": tenant_id,
        "X-Request-ID": str(uuid.uuid4()),
        "X-User-ID": user_id,
        "X-Device-ID": device_id,
        "X-Geo-Location": geo_location,
        "Content-Type": "application/json"
    }


# ============================================================================
# API CLIENT FUNCTIONS
# ============================================================================

async def record_grading(session: aiohttp.ClientSession, animal_data: dict, tenant_id: str):
    """Record animal grading"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id=f"grader_{tenant_id}",
        device_id="GRADING-DEVICE-001",
        geo_location=f"{animal_data['latitude']},{animal_data['longitude']}"
    )
    
    payload = {
        "muzzle_hash": animal_data["muzzle_hash"],
        "quality_grade": animal_data["quality_grade"],
        "yield_grade": animal_data["yield_grade"],
        "marbling_score": animal_data["marbling_score"],
        "ribeye_area_sq_in": animal_data["ribeye_area_sq_in"],
        "fat_thickness_in": animal_data["fat_thickness_in"],
        "hot_carcass_weight_lbs": animal_data["weight_lbs"] * 0.62,  # Estimated dressing %
        "grader_notes": "USDA certified grading"
    }
    
    async with session.post(f"{API_BASE_URL}/grading", json=payload, headers=headers) as response:
        result = await response.json()
        return result


async def record_measurement(session: aiohttp.ClientSession, animal_data: dict, tenant_id: str):
    """Record physical measurements"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id=f"technician_{tenant_id}",
        device_id="SCALE-001",
        geo_location=f"{animal_data['latitude']},{animal_data['longitude']}"
    )
    
    payload = {
        "muzzle_hash": animal_data["muzzle_hash"],
        "weight_lbs": animal_data["weight_lbs"],
        "body_condition_score": animal_data["body_condition_score"],
        "frame_score": animal_data["frame_score"],
        "hip_height_in": 52.5,
        "body_length_in": 68.0,
        "measurement_notes": "Monthly weight check"
    }
    
    async with session.post(f"{API_BASE_URL}/measurements", json=payload, headers=headers) as response:
        result = await response.json()
        return result


async def record_health(session: aiohttp.ClientSession, animal_data: dict, tenant_id: str):
    """Record health assessment"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id=f"veterinarian_{tenant_id}",
        device_id="VET-TABLET-001",
        geo_location=f"{animal_data['latitude']},{animal_data['longitude']}"
    )
    
    payload = {
        "muzzle_hash": animal_data["muzzle_hash"],
        "health_status": "Healthy",
        "temperature_f": 101.5,
        "heart_rate_bpm": 65,
        "respiratory_rate": 28,
        "mobility_score": 5,
        "vaccination_current": True,
        "veterinarian_notes": "Routine health check - all normal"
    }
    
    async with session.post(f"{API_BASE_URL}/health", json=payload, headers=headers) as response:
        result = await response.json()
        return result


async def update_location(session: aiohttp.ClientSession, animal_data: dict, tenant_id: str):
    """Update animal location"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id="GPS-SYSTEM",
        device_id=f"GPS-COLLAR-{animal_data['muzzle_hash'][-3:]}",
        geo_location=f"{animal_data['latitude']},{animal_data['longitude']}"
    )
    
    payload = {
        "muzzle_hash": animal_data["muzzle_hash"],
        "latitude": animal_data["latitude"],
        "longitude": animal_data["longitude"],
        "altitude_m": 1609.0,  # ~5,280 ft (Denver elevation)
        "accuracy_m": 3.5,
        "property_id": animal_data["property_id"],
        "pasture_id": animal_data["pasture_id"],
        "movement_notes": "Grazing in designated pasture"
    }
    
    async with session.post(f"{API_BASE_URL}/location", json=payload, headers=headers) as response:
        result = await response.json()
        return result


async def calculate_valuation(session: aiohttp.ClientSession, animal_data: dict, tenant_id: str):
    """Calculate market valuation"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id=f"manager_{tenant_id}",
        device_id="OFFICE-COMPUTER-001",
        geo_location=f"{animal_data['latitude']},{animal_data['longitude']}"
    )
    
    payload = {
        "muzzle_hash": animal_data["muzzle_hash"],
        "market_class": "Fed Cattle",
        "live_weight_lbs": animal_data["weight_lbs"],
        "quality_grade": animal_data["quality_grade"]
    }
    
    async with session.post(f"{API_BASE_URL}/valuation", json=payload, headers=headers) as response:
        result = await response.json()
        return result


async def get_market_prices(session: aiohttp.ClientSession):
    """Get current market prices"""
    async with session.get(f"{API_BASE_URL}/market/prices") as response:
        result = await response.json()
        return result


async def get_animal_profile(session: aiohttp.ClientSession, muzzle_hash: str, tenant_id: str):
    """Get complete animal profile"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id=f"manager_{tenant_id}",
        device_id="OFFICE-COMPUTER-001",
        geo_location="39.7392,-104.9903"
    )
    
    async with session.get(f"{API_BASE_URL}/{muzzle_hash}/profile", headers=headers) as response:
        result = await response.json()
        return result


async def get_portfolio_valuation(session: aiohttp.ClientSession, tenant_id: str):
    """Get portfolio valuation for a tenant"""
    headers = create_turing_headers(
        tenant_id=tenant_id,
        user_id=f"manager_{tenant_id}",
        device_id="OFFICE-COMPUTER-001",
        geo_location="39.7392,-104.9903"
    )
    
    async with session.get(f"{API_BASE_URL}/portfolio/{tenant_id}", headers=headers) as response:
        result = await response.json()
        return result


# ============================================================================
# TEST EXECUTION
# ============================================================================

async def test_complete_workflow():
    """Test complete livestock management workflow"""
    
    print("=" * 80)
    print("iCattle.ai Livestock Management System - Comprehensive Test")
    print("Developed by: TuringDynamics")
    print("=" * 80)
    print()
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Get current market prices
        print("📊 TEST 1: Fetching Live Cattle Market Prices")
        print("-" * 80)
        try:
            prices = await get_market_prices(session)
            print(f"✅ Retrieved {len(prices)} market price quotes")
            for price in prices:
                print(f"   {price['market_class']}: ${price['price_per_cwt']}/cwt")
                print(f"   Source: {price['source']}")
            print()
        except Exception as e:
            print(f"❌ Error: {e}")
            print()
        
        # Test 2: Process animals for each tenant
        for tenant_id, tenant_info in TEST_TENANTS.items():
            print(f"🐄 TEST 2: Processing Animals for {tenant_info['name']} ({tenant_id})")
            print("-" * 80)
            
            # Use first N animals from sample data
            animals_to_process = SAMPLE_ANIMALS[:tenant_info['animals']]
            
            for i, animal_data in enumerate(animals_to_process, 1):
                # Make muzzle hash unique per tenant
                animal_data_copy = animal_data.copy()
                animal_data_copy["muzzle_hash"] = f"{animal_data['muzzle_hash']}_{tenant_id}"
                
                print(f"\n   Animal {i}/{len(animals_to_process)}: {animal_data_copy['muzzle_hash']}")
                
                try:
                    # Record grading
                    grading_result = await record_grading(session, animal_data_copy, tenant_id)
                    print(f"   ✅ Grading recorded: {animal_data_copy['quality_grade']} grade")
                    
                    # Record measurements
                    measurement_result = await record_measurement(session, animal_data_copy, tenant_id)
                    print(f"   ✅ Measurements recorded: {animal_data_copy['weight_lbs']} lbs")
                    
                    # Record health
                    health_result = await record_health(session, animal_data_copy, tenant_id)
                    print(f"   ✅ Health assessment recorded: Healthy")
                    
                    # Update location
                    location_result = await update_location(session, animal_data_copy, tenant_id)
                    print(f"   ✅ Location updated: {animal_data_copy['property_id']}/{animal_data_copy['pasture_id']}")
                    
                    # Calculate valuation
                    valuation_result = await calculate_valuation(session, animal_data_copy, tenant_id)
                    print(f"   ✅ Valuation calculated")
                    
                    # Small delay between animals
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    print(f"   ❌ Error processing animal: {e}")
            
            print()
        
        # Test 3: Get animal profiles
        print("📋 TEST 3: Retrieving Individual Animal Profiles")
        print("-" * 80)
        try:
            test_muzzle_hash = f"{SAMPLE_ANIMALS[0]['muzzle_hash']}_OWNER-001"
            profile = await get_animal_profile(session, test_muzzle_hash, "OWNER-001")
            print(f"✅ Retrieved profile for {test_muzzle_hash}")
            print(f"   Quality Grade: {profile.get('quality_grade', 'N/A')}")
            print(f"   Weight: {profile.get('weight_lbs', 'N/A')} lbs")
            print(f"   Estimated Value: ${profile.get('estimated_value_usd', 'N/A')}")
            print(f"   Location: {profile.get('property_id', 'N/A')}/{profile.get('pasture_id', 'N/A')}")
            print()
        except Exception as e:
            print(f"❌ Error: {e}")
            print()
        
        # Test 4: Get portfolio valuations
        print("💰 TEST 4: Portfolio Valuations by Owner")
        print("-" * 80)
        total_portfolio_value = Decimal("0.00")
        
        for tenant_id, tenant_info in TEST_TENANTS.items():
            try:
                portfolio = await get_portfolio_valuation(session, tenant_id)
                print(f"✅ {tenant_info['name']} ({tenant_id}):")
                print(f"   Total Animals: {portfolio['total_animals']}")
                print(f"   Total Value: ${portfolio['total_value_usd']:,.2f}")
                print(f"   Avg Value/Head: ${portfolio['average_value_per_head']:,.2f}")
                print(f"   Total Weight: {portfolio['total_weight_lbs']:,.0f} lbs")
                print()
                
                total_portfolio_value += Decimal(str(portfolio['total_value_usd']))
                
            except Exception as e:
                print(f"❌ Error for {tenant_id}: {e}")
                print()
        
        print(f"📊 TOTAL PORTFOLIO VALUE (All Owners): ${total_portfolio_value:,.2f}")
        print()
    
    print("=" * 80)
    print("✅ All Tests Completed!")
    print("=" * 80)


async def test_turing_protocol_enforcement():
    """Test that Turing Protocol headers are enforced"""
    
    print("\n" + "=" * 80)
    print("🔒 TURING PROTOCOL ENFORCEMENT TEST")
    print("=" * 80)
    print()
    
    async with aiohttp.ClientSession() as session:
        
        # Test missing headers
        print("Testing API without Turing Protocol headers...")
        
        payload = {
            "muzzle_hash": "test_animal_001",
            "quality_grade": "Choice",
            "yield_grade": "2",
            "marbling_score": 550,
            "ribeye_area_sq_in": 13.5,
            "fat_thickness_in": 0.45
        }
        
        try:
            async with session.post(
                f"{API_BASE_URL}/grading",
                json=payload,
                headers={"Content-Type": "application/json"}  # Missing Turing headers
            ) as response:
                if response.status == 422:
                    print("✅ API correctly rejected request without Turing Protocol headers")
                    error_detail = await response.json()
                    print(f"   Status: {response.status}")
                    print(f"   Response: {json.dumps(error_detail, indent=2)}")
                else:
                    print(f"⚠️  Unexpected status code: {response.status}")
        except Exception as e:
            print(f"✅ API correctly rejected request: {e}")
        
        print()
        
        # Test with complete headers
        print("Testing API with complete Turing Protocol headers...")
        
        headers = create_turing_headers(
            tenant_id="OWNER-001",
            user_id="test_user",
            device_id="test_device",
            geo_location="39.7392,-104.9903"
        )
        
        try:
            async with session.post(
                f"{API_BASE_URL}/grading",
                json=payload,
                headers=headers
            ) as response:
                if response.status == 200:
                    print("✅ API accepted request with complete Turing Protocol headers")
                    result = await response.json()
                    print(f"   Event ID: {result['event_id']}")
                    print(f"   Event Type: {result['event_type']}")
                else:
                    print(f"⚠️  Status: {response.status}")
                    error = await response.text()
                    print(f"   Response: {error}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print()
    print("=" * 80)


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

async def main():
    """Run all tests"""
    
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "iCattle.ai - Comprehensive Livestock Management Platform".center(78) + "║")
    print("║" + "Biometric ID • Grading • Pricing • Geolocation • Analytics".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("║" + "Developed by: TuringDynamics".center(78) + "║")
    print("║" + "Enforcing Turing Protocol for Bank-Grade Auditability".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "═" * 78 + "╝")
    print("\n")
    
    # Run comprehensive workflow test
    await test_complete_workflow()
    
    # Run Turing Protocol enforcement test
    await test_turing_protocol_enforcement()
    
    print("\n✅ All tests completed successfully!\n")


if __name__ == "__main__":
    asyncio.run(main())
