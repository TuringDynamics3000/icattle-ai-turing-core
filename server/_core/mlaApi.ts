/**
 * MLA Statistics API Client
 * 
 * Official API client for Meat & Livestock Australia's Statistics API.
 * Provides live daily cattle pricing data from the National Livestock Reporting Service (NLRS).
 * 
 * API Documentation: https://app.nlrsreports.mla.com.au/statistics/documentation
 * Base URL: https://api-mlastatistics.mla.com.au
 */

const MLA_API_BASE = "https://api-mlastatistics.mla.com.au";

/**
 * MLA Cattle Indicator IDs
 */
export const MLA_INDICATORS = {
  EASTERN_YOUNG_CATTLE: 0,
  WESTERN_YOUNG_CATTLE: 1,
  RESTOCKER_YEARLING_STEER: 2,
  FEEDER_STEER: 3,
  HEAVY_STEER: 4,
  HEAVY_DAIRY_COW: 5,
  RESTOCKER_YEARLING_HEIFER: 12,
  PROCESSOR_COW: 13,
  YOUNG_CATTLE: 14,
  ONLINE_YOUNG_CATTLE: 15,
} as const;

/**
 * API Response Types
 */
interface MLAIndicatorData {
  calendar_date: string;
  species_id: string;
  indicator_id: number;
  indicator_desc: string;
  indicator_units: string;
  head_count: number;
  indicator_value: number;
}

interface MLAApiResponse {
  message: string;
  "total number rows": number;
  data: MLAIndicatorData[];
}

interface MLAIndicator {
  indicator_id: number;
  indicator_desc: string;
  species_id: string;
  indicator_units: string;
}

interface MLAIndicatorsResponse {
  message: string;
  data: MLAIndicator[];
}

/**
 * Fetch cattle price data for a specific indicator
 */
export async function fetchIndicatorData(
  indicatorId: number,
  fromDate?: string,
  toDate?: string
): Promise<MLAIndicatorData[]> {
  // Default to last 30 days if no dates provided
  const to = toDate || new Date().toISOString().split('T')[0];
  const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const url = `${MLA_API_BASE}/report/5?indicatorID=${indicatorId}&fromDate=${from}&toDate=${to}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MLA API error: ${response.status} ${response.statusText}`);
    }
    
    const json = await response.json() as MLAApiResponse;
    
    if (json.message !== "Data returned") {
      throw new Error(`MLA API returned: ${json.message}`);
    }
    
    return json.data;
  } catch (error) {
    console.error(`Failed to fetch MLA indicator ${indicatorId}:`, error);
    throw error;
  }
}

/**
 * Fetch all available indicators
 */
export async function fetchIndicators(): Promise<MLAIndicator[]> {
  const url = `${MLA_API_BASE}/indicator`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MLA API error: ${response.status} ${response.statusText}`);
    }
    
    const json = await response.json() as MLAIndicatorsResponse;
    
    return json.data;
  } catch (error) {
    console.error("Failed to fetch MLA indicators:", error);
    throw error;
  }
}

/**
 * Get latest price for a specific indicator
 */
export async function getLatestPrice(indicatorId: number): Promise<{
  price_per_kg: number;
  head_count: number;
  date: string;
  indicator_desc: string;
}> {
  const data = await fetchIndicatorData(indicatorId);
  
  if (data.length === 0) {
    throw new Error(`No data available for indicator ${indicatorId}`);
  }
  
  // Get most recent entry
  const latest = data[data.length - 1];
  
  return {
    price_per_kg: latest.indicator_value / 100, // Convert cents to dollars
    head_count: latest.head_count,
    date: latest.calendar_date,
    indicator_desc: latest.indicator_desc,
  };
}

/**
 * Get average price over a date range
 */
export async function getAveragePrice(
  indicatorId: number,
  fromDate?: string,
  toDate?: string
): Promise<{
  avg_price_per_kg: number;
  min_price_per_kg: number;
  max_price_per_kg: number;
  total_head_count: number;
  date_range: { from: string; to: string };
  indicator_desc: string;
}> {
  const data = await fetchIndicatorData(indicatorId, fromDate, toDate);
  
  if (data.length === 0) {
    throw new Error(`No data available for indicator ${indicatorId}`);
  }
  
  const prices = data.map(d => d.indicator_value / 100); // Convert to dollars
  const totalHead = data.reduce((sum, d) => sum + d.head_count, 0);
  const weightedSum = data.reduce((sum, d) => sum + (d.indicator_value / 100) * d.head_count, 0);
  
  return {
    avg_price_per_kg: weightedSum / totalHead,
    min_price_per_kg: Math.min(...prices),
    max_price_per_kg: Math.max(...prices),
    total_head_count: totalHead,
    date_range: {
      from: data[0].calendar_date,
      to: data[data.length - 1].calendar_date,
    },
    indicator_desc: data[0].indicator_desc,
  };
}

/**
 * Get comprehensive market data for all cattle indicators
 */
export async function getAllCattleMarketData(fromDate?: string, toDate?: string) {
  const cattleIndicators = [
    MLA_INDICATORS.RESTOCKER_YEARLING_STEER,
    MLA_INDICATORS.RESTOCKER_YEARLING_HEIFER,
    MLA_INDICATORS.FEEDER_STEER,
    MLA_INDICATORS.HEAVY_STEER,
    MLA_INDICATORS.YOUNG_CATTLE,
    MLA_INDICATORS.PROCESSOR_COW,
  ];
  
  const results = await Promise.all(
    cattleIndicators.map(async (id) => {
      try {
        return await getAveragePrice(id, fromDate, toDate);
      } catch (error) {
        console.error(`Failed to fetch indicator ${id}:`, error);
        return null;
      }
    })
  );
  
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * Get historical trends (monthly aggregates for the past year)
 */
export async function getHistoricalTrends(indicatorId: number) {
  // Get data for the past year
  const toDate = new Date().toISOString().split('T')[0];
  const fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const data = await fetchIndicatorData(indicatorId, fromDate, toDate);
  
  // Group by month
  const monthlyData = new Map<string, MLAIndicatorData[]>();
  
  for (const entry of data) {
    const month = entry.calendar_date.substring(0, 7); // YYYY-MM
    if (!monthlyData.has(month)) {
      monthlyData.set(month, []);
    }
    monthlyData.get(month)!.push(entry);
  }
  
  // Calculate monthly averages
  const trends = Array.from(monthlyData.entries()).map(([month, entries]) => {
    const totalHead = entries.reduce((sum, e) => sum + e.head_count, 0);
    const weightedSum = entries.reduce((sum, e) => sum + (e.indicator_value / 100) * e.head_count, 0);
    
    return {
      month,
      avg_price_per_kg: weightedSum / totalHead,
      head_count: totalHead,
    };
  });
  
  return trends.sort((a, b) => a.month.localeCompare(b.month));
}
