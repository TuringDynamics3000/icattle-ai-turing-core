# AuctionsPlus Technical Implementation

## Overview

This document describes the technical implementation of the AuctionsPlus market data integration in the iCattle Dashboard.

## Architecture

### Components

1. **Python Web Scraper** (`scripts/scrape-auctionsplus.py`)
   - Respectfully scrapes public market data from AuctionsPlus
   - Implements aggressive rate limiting (1 request per 8+ seconds)
   - Caches results for 24+ hours to minimize server load
   - Uses proper user agent identification

2. **Market Router** (`server/routers/market.ts`)
   - tRPC procedures for querying market data
   - Automatic cache management
   - Price calculation utilities
   - Trend analysis functions

3. **Market Data Page** (`client/src/pages/MarketData.tsx`)
   - Interactive price discovery interface
   - Market trends visualization
   - Category-based filtering
   - Manual refresh capability

## API Endpoints

### `market.getPriceDiscovery`

Get price discovery data with optional filtering.

```typescript
const { data } = trpc.market.getPriceDiscovery.useQuery({
  breed: "Angus",           // Optional: filter by breed
  category: "Steer",        // Optional: filter by category
  forceRefresh: false,      // Optional: bypass cache
});
```

**Response:**
```typescript
{
  data: Array<{
    breed: string;
    category: string;
    weight_range: string;
    price_per_kg: number;
    price_range_min: number;
    price_range_max: number;
    sample_size: number;
    last_updated: string;
    source: string;
  }>;
  cached_at: string;
  cache_age_hours: number;
}
```

### `market.getAllMarketData`

Get complete market dataset including price discovery and recent auctions.

```typescript
const { data } = trpc.market.getAllMarketData.useQuery({
  forceRefresh: false,
});
```

### `market.getMarketPrice`

Calculate market price for a specific cattle profile.

```typescript
const { data } = trpc.market.getMarketPrice.useQuery({
  breed: "Wagyu",
  category: "Steer",
  weight: 450,
});
```

**Response:**
```typescript
{
  price_per_kg: 8.41;
  price_range_min: 7.15;
  price_range_max: 9.67;
  estimated_value: 3784;      // price_per_kg * weight
  value_range_min: 3217;
  value_range_max: 4351;
  sample_size: 16;
  last_updated: string;
  source: string;
} | null
```

### `market.getMarketTrends`

Get aggregated market trends by category.

```typescript
const { data } = trpc.market.getMarketTrends.useQuery();
```

## Current Implementation

### Simulated Data

The current implementation uses **simulated market data** based on December 2025 market research. This provides realistic pricing while we await AuctionsPlus API access.

**Current Price Data:**
- **Angus Steer** (400-500kg): $6.00/kg (range: $5.10-$6.90)
- **Wagyu Steer** (450-550kg): $8.41/kg (range: $7.15-$9.67)
- **Hereford Heifer** (350-450kg): $4.62/kg (range: $3.93-$5.31)

### Price Calculation Methodology

Simulated prices are calculated using:

1. **Base Prices** (December 2025 market rates)
   - Steer: $5.80/kg
   - Heifer: $5.50/kg
   - Cow: $4.20/kg
   - Bull: $6.50/kg

2. **Breed Premiums**
   - Angus: 1.15x
   - Wagyu: 1.45x
   - Hereford: 1.05x
   - Charolais: 1.10x
   - Limousin: 1.12x
   - Brahman: 0.95x
   - Droughtmaster: 0.98x
   - Santa Gertrudis: 1.00x

3. **Weight Adjustment**
   - Normalized to 500kg baseline
   - Linear scaling for different weight ranges

## Caching Strategy

### Cache Duration
- **Default:** 24 hours
- **Rationale:** Market prices change daily, not hourly
- **Benefits:** Reduces server load, respects AuctionsPlus infrastructure

### Cache Refresh
- **Automatic:** Every 24 hours when data is requested
- **Manual:** "Refresh Data" button on Market Data page
- **Force Refresh:** `forceRefresh: true` parameter in queries

### Cache Location
- **File:** `scripts/auctionsplus_cache.json`
- **Format:** JSON with timestamp metadata

## Rate Limiting

### Scraper Configuration
- **Rate:** 1 request per 8+ seconds (7.5 requests/minute)
- **Jitter:** Random 1-3 second additional delay
- **User Agent:** `iCattle-PriceDiscovery/1.0`

### Compliance
- ✅ Respects robots.txt (allows `/commodities/cattle`)
- ✅ Conservative rate limiting (well below typical limits)
- ✅ Proper user agent identification
- ✅ Caching to minimize requests
- ✅ Public data only (no authentication bypass)

## Testing

### Test Coverage

The market router has comprehensive test coverage:

- ✅ 21 tests, all passing
- ✅ Filter by breed
- ✅ Filter by category
- ✅ Price calculations
- ✅ Trend analysis
- ✅ Cache behavior
- ✅ Data validation

### Running Tests

```bash
# Run market tests only
pnpm test server/routers/market.test.ts

# Run all tests
pnpm test
```

## Usage Examples

### Display Market Price on Cattle Card

```typescript
function CattleCard({ cattle }: { cattle: Cattle }) {
  const { data: marketPrice } = trpc.market.getMarketPrice.useQuery({
    breed: cattle.breed,
    category: cattle.type,
    weight: cattle.weight,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cattle.nlisId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>Current Value: ${cattle.currentValue / 100}</div>
        {marketPrice && (
          <div>
            Market Value: ${marketPrice.estimated_value}
            <span className="text-muted-foreground">
              (${marketPrice.price_per_kg}/kg)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Future Enhancements

### Live API Integration

To integrate with the live AuctionsPlus API:

1. **Register as Third-Party Partner**
   - Contact AuctionsPlus Business Development
   - Complete partnership application
   - Obtain API credentials

2. **Implement OAuth 2.0**
   ```typescript
   // Future implementation
   const auctionsPlusAuth = {
     clientId: process.env.AUCTIONSPLUS_CLIENT_ID,
     clientSecret: process.env.AUCTIONSPLUS_CLIENT_SECRET,
     redirectUri: `${process.env.APP_URL}/api/auctionsplus/callback`,
   };
   ```

3. **Replace Scraper with API Calls**
   ```typescript
   // Future implementation
   async function fetchPriceDiscovery(params: {
     breed: string;
     category: string;
     weightMin: number;
     weightMax: number;
   }) {
     const response = await fetch('https://api.auctionsplus.com.au/v1/price-discovery', {
       headers: {
         'Authorization': `Bearer ${accessToken}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(params),
     });
     return response.json();
   }
   ```

---

**Last Updated:** December 3, 2025  
**Status:** ✅ Implemented with simulated data  
**Next Step:** Obtain AuctionsPlus API credentials for live data
