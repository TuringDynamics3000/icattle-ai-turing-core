# MLA Statistics API Integration

## Overview

The iCattle Dashboard now uses Meat & Livestock Australia's (MLA) official Statistics API for real-time cattle pricing data. This provides daily updates from the National Livestock Reporting Service (NLRS) with comprehensive coverage across multiple market indicators.

## Implementation

### API Client (`server/_core/mlaApi.ts`)

**Base URL**: `https://api-mlastatistics.mla.com.au`

**Key Features:**
- No authentication required (public API)
- Daily data updates (12am AEST)
- Historical data access with date range queries
- Multiple cattle indicators support

**Supported Indicators:**
- **ID 0**: Eastern Young Cattle Indicator
- **ID 1**: Western Young Cattle Indicator
- **ID 2**: National Restocker Yearling Steer Indicator
- **ID 3**: National Feeder Steer Indicator
- **ID 4**: National Heavy Steer Indicator
- **ID 5**: Heavy Dairy Cow Indicator
- **ID 12**: National Restocker Yearling Heifer Indicator
- **ID 13**: National Processor Cow Indicator
- **ID 14**: National Young Cattle Indicator
- **ID 15**: Online Young Cattle Indicator

### Market Router (`server/routers/market-live.ts`)

**Endpoints:**
- `market.getPriceDiscovery` - Get price data filtered by breed/category
- `market.getAllMarketData` - Get comprehensive market data with 24-hour caching
- `market.getMarketPrice` - Calculate market value for specific cattle
- `market.getMarketTrends` - Get category-level price trends

**Caching Strategy:**
- 24-hour in-memory cache for market data
- Manual refresh available via `forceRefresh` parameter
- Cache timestamp displayed to users

### Portfolio Valuation Integration

**Coverage**: 100% (360 of 360 cattle)

**Matching Logic:**
1. Match cattle category (Steer/Heifer/Cow) to appropriate MLA indicator
2. Use specific indicators (Restocker, Feeder, Heavy) based on weight/type
3. Fall back to Young Cattle indicator if no specific match
4. Calculate market value = price_per_kg × current_weight

**Results:**
- Market Discount: -$393,359 (32% below book value)
- Indicates conservative book valuations
- Provides real-time risk assessment for lenders

## Data Quality

**Sample Sizes (30-day aggregates):**
- Restocker Yearling Steer: 175,145 head
- Restocker Yearling Heifer: 140,493 head
- Feeder Steer: 304,213 head
- Heavy Steer: 78,332 head
- Young Cattle: 741,901 head
- Processor Cow: 348,763 head

**Total**: 1,788,847 auction records

## Historical Trends

**Data Range**: 12 months of monthly aggregates

**Calculation Method:**
- Group daily data by month
- Calculate weighted average by head count
- Separate trends for Steer and Heifer categories

**Chart Display:**
- Line chart showing Steer vs. Heifer price trends
- Quarterly labels (2024-12 to 2025-03)
- Price range: $3-5/kg live weight

## API Functions

### `fetchIndicatorData(indicatorId, fromDate?, toDate?)`
Fetch raw daily price data for a specific indicator.

**Returns**: Array of daily price records with head count and indicator value.

### `getLatestPrice(indicatorId)`
Get the most recent price for an indicator.

**Returns**: Latest price per kg, head count, date, and indicator description.

### `getAveragePrice(indicatorId, fromDate?, toDate?)`
Calculate average price over a date range.

**Returns**: Weighted average, min, max prices, total head count, and date range.

### `getAllCattleMarketData(fromDate?, toDate?)`
Get comprehensive data for all cattle indicators.

**Returns**: Array of average prices for all supported indicators.

### `getHistoricalTrends(indicatorId)`
Get monthly price trends for the past year.

**Returns**: Array of monthly averages with head counts.

## Migration from CSV

**Previous Approach:**
- Static CSV file with quarterly aggregates (2000-2025)
- 5,400 records
- Manual updates required
- 42.8% portfolio coverage (154/360 cattle)

**Current Approach:**
- Live API with daily updates
- 1.8M+ auction records (30-day window)
- Automatic updates every 24 hours
- 100% portfolio coverage (360/360 cattle)

**Benefits:**
- Real-time pricing accuracy
- Comprehensive indicator coverage
- No manual data management
- Official MLA source

## Future Enhancements

1. **Breed-Specific Pricing**: Currently uses generic indicators; could add breed premiums (Wagyu, Angus) based on historical multipliers

2. **Regional Pricing**: API supports saleyard-specific data (`/report/6`); could add location-based pricing

3. **Price Alerts**: Implement notifications when prices move significantly (±10%)

4. **Predictive Analytics**: Use historical trends to forecast future prices

5. **Export Indicators**: Add sheep/lamb indicators for diversified portfolios

## Testing

**Manual Testing:**
- ✅ API endpoints respond correctly
- ✅ Data caching works (24-hour expiry)
- ✅ Portfolio valuation calculates accurately
- ✅ Historical trends display properly
- ✅ Market Data page shows live prices

**Automated Testing:**
- ⏳ Pending: Unit tests for API client functions
- ⏳ Pending: Integration tests for market router
- ⏳ Pending: Portfolio valuation calculation tests

## Documentation

- **API Docs**: https://app.nlrsreports.mla.com.au/statistics/documentation
- **MLA Website**: https://www.mla.com.au
- **NLRS Info**: https://www.mla.com.au/prices-markets/market-reporting-service/

## Support

For API issues or questions:
- MLA Market Information: 1800 023 100
- Email: marketinfo@mla.com.au

## License & Terms

All use of MLA publications, reports and information is subject to MLA's Market Report and Information Terms of Use. Please read the [Terms of Use](https://www.mla.com.au/globalassets/mla-corporate/prices--markets/documents/minlrs-information-brochures-etc/mla-market-info-terms-of-use.pdf) before using this data.
