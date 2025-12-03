# MLA Statistics API Research

## API Discovery

**Base URL**: `https://api-mlastatistics.mla.com.au`

**Documentation**: https://app.nlrsreports.mla.com.au/statistics/documentation

## Available Endpoints

### Reference Tables
- `GET /report` - List of available report endpoints
- `GET /saleyard` - List of saleyards  
- `GET /indicator` - List of indicators and their IDs

### Reports
- `GET /report/1` - Australian Red Meat Exports
- `GET /report/2` - Australian Herd and Flock Figures
- `GET /report/3` - Australian Slaughter and Production
- `GET /report/4` - Australian Saleyard Yardings
- **`GET /report/5` - Australian Livestock Indicators (By Indicator)** ⭐ Most relevant
- `GET /report/6` - Australian Livestock Indicators (By Saleyard)
- `GET /report/7` - Global Cattle Prices
- `GET /report/8` - US Domestic Cattle Prices
- `GET /report/9` - US Imported Meat Prices
- `GET /report/10` - Australian NLRS Slaughter

## Key Indicators Found

From `/indicator` endpoint:
- **ID 0**: Eastern Young Cattle Indicator (c/kg cwt)
- **ID 1**: Western Young Cattle Indicator (c/kg cwt)
- **ID 2**: National Restocker Yearling Steer Indicator (c/kg lwt)
- **ID 3**: National Feeder Steer Indicator (c/kg lwt)

## Authentication

- **No authentication required** - API appears to be publicly accessible
- Swagger UI allows direct testing without API keys

## Data Format

- Returns JSON
- Daily updates (12am AEST)
- Supports pagination (100 rows per page)
- Date range filtering (fromDate, toDate in yyyy-mm-dd format)

## Integration Potential

This API could replace our CSV-based approach with:
1. **Live data updates** - Daily refresh instead of static CSV
2. **Historical trends** - Query any date range
3. **Multiple indicators** - Young Cattle, Restocker, Feeder prices
4. **Official source** - Direct from MLA, no web scraping needed

## Next Steps

1. Test `/report/5` with specific indicator IDs
2. Compare data quality vs. CSV file
3. Implement API client in market router
4. Add caching layer (24-hour cache as currently implemented)
5. Update documentation to reflect live API integration

## Example Request

```bash
curl -X GET "https://api-mlastatistics.mla.com.au/report/5?indicatorID=2&fromDate=2024-01-01&toDate=2024-12-31" \
  -H "accept: application/json"
```

## Notes

- CSV file contains quarterly aggregated data (2000-2025)
- API provides daily granular data
- Both sources are from MLA NLRS
- API may provide more recent data than CSV export
