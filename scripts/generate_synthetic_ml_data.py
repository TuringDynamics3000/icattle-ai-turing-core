#!/usr/bin/env python3
"""
Generate synthetic ML training data based on real MLA price patterns.
This is for DEMO purposes - clearly flagged as synthetic.

Real patterns observed from MLA API:
- Young Cattle: $4.50-4.70/kg (450-470 c/kg)
- Restocker Steer: $4.70-5.10/kg
- Feeder Steer: $4.60-4.90/kg
- Heavy Steer: $4.40-4.65/kg
- Restocker Heifer: $4.00-4.30/kg
- Processor Cow: $3.90-4.00/kg

Seasonal patterns:
- Peak prices: Oct-Dec (spring/summer demand)
- Low prices: Apr-Jun (autumn oversupply)
- Volatility: ±10% monthly, ±25% annually
"""

import json
import numpy as np
from datetime import datetime, timedelta
import os

# Indicator configurations based on real MLA data
INDICATORS = {
    0: {"name": "Eastern Young Cattle", "base_price": 460, "volatility": 0.08},
    2: {"name": "Restocker Yearling Steer", "base_price": 490, "volatility": 0.10},
    3: {"name": "Feeder Steer", "base_price": 475, "volatility": 0.09},
    4: {"name": "Heavy Steer", "base_price": 450, "volatility": 0.07},
    12: {"name": "Restocker Yearling Heifer", "base_price": 415, "volatility": 0.08},
    13: {"name": "Processor Cow", "base_price": 394, "volatility": 0.06},
    14: {"name": "National Young Cattle", "base_price": 455, "volatility": 0.08},
}

def generate_seasonal_pattern(days: int) -> np.ndarray:
    """Generate seasonal price multiplier (1.0 = baseline)"""
    # Annual cycle: peak in Oct-Dec, low in Apr-Jun
    t = np.arange(days)
    seasonal = 1.0 + 0.15 * np.sin(2 * np.pi * t / 365 + np.pi/2)  # Peak at day ~90 (Oct)
    return seasonal

def generate_trend(days: int) -> np.ndarray:
    """Generate long-term price trend"""
    # Slight upward trend over 3 years (inflation, demand growth)
    t = np.arange(days)
    trend = 1.0 + 0.002 * t / 365  # ~0.2% annual growth
    return trend

def generate_noise(days: int, volatility: float) -> np.ndarray:
    """Generate random price fluctuations"""
    # AR(1) process for autocorrelated noise
    noise = np.zeros(days)
    noise[0] = np.random.normal(0, volatility)
    for i in range(1, days):
        noise[i] = 0.7 * noise[i-1] + np.random.normal(0, volatility)
    return noise

def generate_indicator_data(indicator_id: int, config: dict, days: int, start_date: datetime):
    """Generate synthetic price data for one indicator"""
    base_price = config["base_price"]
    volatility = config["volatility"]
    
    # Combine components
    seasonal = generate_seasonal_pattern(days)
    trend = generate_trend(days)
    noise = generate_noise(days, volatility)
    
    # Calculate prices
    prices = base_price * seasonal * trend * (1 + noise)
    
    # Generate head counts (sample sizes)
    base_head = {
        0: 50000, 2: 175000, 3: 300000, 4: 78000,
        12: 140000, 13: 350000, 14: 740000
    }
    head_counts = np.random.poisson(base_head.get(indicator_id, 100000), days)
    
    # Format as API-like records
    records = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        records.append({
            "result_date": date.strftime("%Y-%m-%d"),
            "indicator_id": indicator_id,
            "indicator_desc": config["name"],
            "indicator_value": round(prices[i], 2),
            "head_count": int(head_counts[i])
        })
    
    return records

def main():
    # Generate 3 years of daily data
    days = 3 * 365
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    print("Generating synthetic ML training data...")
    print(f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"Days: {days}")
    print()
    
    # Generate data for all indicators
    training_data = {}
    
    for indicator_id, config in INDICATORS.items():
        print(f"Generating {config['name']} (ID {indicator_id})...")
        records = generate_indicator_data(indicator_id, config, days, start_date)
        training_data[f"indicator_{indicator_id}"] = records
    
    # Save to JSON
    output_file = os.path.join(os.path.dirname(__file__), "ml_training_data_synthetic.json")
    
    with open(output_file, 'w') as f:
        json.dump({
            "metadata": {
                "data_source": "SYNTHETIC - Demo purposes only",
                "based_on": "Real MLA price patterns observed Dec 2025",
                "from_date": start_date.strftime("%Y-%m-%d"),
                "to_date": end_date.strftime("%Y-%m-%d"),
                "indicators": list(INDICATORS.keys()),
                "generated_at": datetime.now().isoformat(),
                "total_records": sum(len(v) for v in training_data.values()),
                "note": "Prices follow real seasonal patterns, trends, and volatility observed in MLA API data"
            },
            "data": training_data
        }, f, indent=2)
    
    print(f"\nSynthetic data saved to {output_file}")
    print(f"Total records: {sum(len(v) for v in training_data.values())}")
    print("\n⚠️  This is SYNTHETIC DATA for demo purposes")
    print("Real-time predictions will use actual MLA API data")

if __name__ == "__main__":
    main()
