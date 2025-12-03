#!/usr/bin/env python3
"""
Fetch historical MLA data for ML model training.
Downloads 2-3 years of daily cattle price indicators for time-series forecasting.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os

# MLA API configuration
BASE_URL = "https://api-mlastatistics.mla.com.au"
INDICATORS = [
    0,   # Eastern Young Cattle Indicator
    1,   # Western Young Cattle Indicator
    2,   # National Restocker Yearling Steer Indicator
    3,   # National Feeder Steer Indicator
    4,   # National Heavy Steer Indicator
    12,  # National Restocker Yearling Heifer Indicator
    13,  # National Processor Cow Indicator
    14,  # National Young Cattle Indicator
]

def fetch_indicator_history(indicator_id: int, from_date: str, to_date: str) -> List[Dict[str, Any]]:
    """
    Fetch historical data for a specific indicator.
    
    Args:
        indicator_id: MLA indicator ID
        from_date: Start date (YYYY-MM-DD)
        to_date: End date (YYYY-MM-DD)
    
    Returns:
        List of daily price records
    """
    all_data = []
    page = 1
    
    while True:
        url = f"{BASE_URL}/report/5"
        params = {
            "indicatorID": indicator_id,
            "fromDate": from_date,
            "toDate": to_date,
            "page": page
        }
        
        print(f"Fetching indicator {indicator_id}, page {page}...")
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if "data" not in result or not result["data"]:
                break
            
            all_data.extend(result["data"])
            
            # Check if there are more pages
            total_rows = result.get("total number rows", 0)
            if len(all_data) >= total_rows:
                break
            
            page += 1
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"Error fetching data: {e}")
            break
    
    print(f"Fetched {len(all_data)} records for indicator {indicator_id}")
    return all_data

def main():
    # Fetch 3 years of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=3*365)
    
    from_date_str = start_date.strftime("%Y-%m-%d")
    to_date_str = end_date.strftime("%Y-%m-%d")
    
    print(f"Fetching data from {from_date_str} to {to_date_str}")
    print(f"Indicators: {INDICATORS}")
    print()
    
    # Fetch data for all indicators
    training_data = {}
    
    for indicator_id in INDICATORS:
        data = fetch_indicator_history(indicator_id, from_date_str, to_date_str)
        training_data[f"indicator_{indicator_id}"] = data
        time.sleep(2)  # Be respectful to the API
    
    # Save to JSON file
    output_file = os.path.join(os.path.dirname(__file__), "ml_training_data.json")
    
    with open(output_file, 'w') as f:
        json.dump({
            "metadata": {
                "from_date": from_date_str,
                "to_date": to_date_str,
                "indicators": INDICATORS,
                "fetched_at": datetime.now().isoformat(),
                "total_records": sum(len(v) for v in training_data.values())
            },
            "data": training_data
        }, f, indent=2)
    
    print(f"\nData saved to {output_file}")
    print(f"Total records: {sum(len(v) for v in training_data.values())}")

if __name__ == "__main__":
    main()
