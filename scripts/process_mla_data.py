#!/usr/bin/env python3
"""
Process MLA NLRS cattle transaction data into market pricing cache.

This script reads the MLA NLRS CSV file and extracts:
1. Latest average prices by category and weight range
2. Historical quarterly price trends
3. Aggregated statistics for market valuation

Data source: National Livestock Reporting Service (MLA)
"""

import csv
import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any

def parse_date(date_str: str) -> datetime:
    """Parse date string in format '31/03/2000 0:00'"""
    return datetime.strptime(date_str.split()[0], '%d/%m/%Y')

def cents_to_dollars(cents: float) -> float:
    """Convert cents/kg to dollars/kg"""
    return round(cents / 100, 2)

def process_mla_data(csv_path: str) -> Dict[str, Any]:
    """
    Process MLA NLRS data and return structured market data.
    
    Returns:
        Dictionary with latest prices and historical trends
    """
    # Data structures
    latest_prices = defaultdict(lambda: defaultdict(list))
    historical_data = []
    quarterly_trends = defaultdict(lambda: defaultdict(list))
    
    with open(csv_path, 'r') as f:
        # Skip the first 5 header/info rows
        for _ in range(5):
            next(f)
        
        reader = csv.DictReader(f, skipinitialspace=True)
        
        for row in reader:
            try:
                # Parse fields
                date = parse_date(row['Quarterly'])
                category = row['Category'].strip()
                weight_range = row['Weight Range'].strip()
                price_cents = float(row['Price c/kg Lwt'])
                head_count = int(row['Head'])
                
                # Store for latest price calculation
                latest_prices[category][weight_range].append({
                    'date': date,
                    'price_cents': price_cents,
                    'head': head_count
                })
                
                # Store for historical trends
                quarter_key = date.strftime('%Y-Q') + str((date.month - 1) // 3 + 1)
                quarterly_trends[quarter_key][category].append({
                    'price_cents': price_cents,
                    'head': head_count,
                    'weight_range': weight_range
                })
                
            except (ValueError, KeyError) as e:
                # Skip header rows or malformed data
                continue
    
    # Calculate latest average prices (weighted by head count)
    price_discovery = []
    
    for category, weight_ranges in latest_prices.items():
        for weight_range, transactions in weight_ranges.items():
            # Get most recent quarter's data
            recent_transactions = sorted(transactions, key=lambda x: x['date'], reverse=True)[:20]
            
            if not recent_transactions:
                continue
            
            # Calculate weighted average
            total_value = sum(t['price_cents'] * t['head'] for t in recent_transactions)
            total_head = sum(t['head'] for t in recent_transactions)
            
            if total_head == 0:
                continue
            
            avg_price_cents = total_value / total_head
            avg_price_dollars = cents_to_dollars(avg_price_cents)
            
            # Get price range
            prices = [t['price_cents'] for t in recent_transactions]
            min_price = cents_to_dollars(min(prices))
            max_price = cents_to_dollars(max(prices))
            
            # Map category to our format
            if 'Heifer' in category:
                mapped_category = 'Heifer'
            elif 'Steer' in category:
                mapped_category = 'Steer'
            else:
                continue
            
            price_discovery.append({
                'breed': 'Generic',  # MLA data doesn't specify breed
                'category': mapped_category,
                'weight_range': weight_range,
                'price_per_kg': avg_price_dollars,
                'price_range_min': min_price,
                'price_range_max': max_price,
                'sample_size': total_head,
                'last_updated': recent_transactions[0]['date'].isoformat(),
                'source': 'MLA NLRS - National Livestock Reporting Service'
            })
    
    # Calculate historical trends (quarterly averages)
    historical_trends = []
    
    for quarter, categories in sorted(quarterly_trends.items()):
        quarter_data = {'quarter': quarter}
        
        for category, transactions in categories.items():
            if not transactions:
                continue
            
            # Calculate weighted average for the quarter
            total_value = sum(t['price_cents'] * t['head'] for t in transactions)
            total_head = sum(t['head'] for t in transactions)
            
            if total_head == 0:
                continue
            
            avg_price_dollars = cents_to_dollars(total_value / total_head)
            
            # Map category
            if 'Heifer' in category:
                quarter_data['heifer_avg'] = avg_price_dollars
            elif 'Steer' in category:
                quarter_data['steer_avg'] = avg_price_dollars
        
        if len(quarter_data) > 1:  # Has at least one price
            historical_trends.append(quarter_data)
    
    # Build final output
    return {
        'scraped_at': datetime.now().isoformat(),
        'data_source': 'MLA NLRS - National Livestock Reporting Service',
        'data_period': '2000-2025',
        'price_discovery': price_discovery,
        'historical_trends': historical_trends[-24:],  # Last 24 quarters (6 years)
        'recent_auctions': []  # Not available in MLA data
    }

def main():
    """Main entry point"""
    # Paths
    csv_path = Path(__file__).parent.parent / 'upload' / 'MLA_nlrs_cattle_transactions_report.csv'
    output_path = Path(__file__).parent / 'mla_cache.json'
    
    print(f"Processing MLA NLRS data from: {csv_path}")
    
    # Process data
    market_data = process_mla_data(str(csv_path))
    
    # Write output
    with open(output_path, 'w') as f:
        json.dump(market_data, f, indent=2)
    
    print(f"✓ Processed {len(market_data['price_discovery'])} price points")
    print(f"✓ Generated {len(market_data['historical_trends'])} quarterly trends")
    print(f"✓ Output written to: {output_path}")
    
    # Display summary
    print("\n=== Latest Market Prices ===")
    for price in market_data['price_discovery']:
        print(f"{price['category']:8} {price['weight_range']:12} ${price['price_per_kg']:.2f}/kg (n={price['sample_size']})")

if __name__ == '__main__':
    main()
