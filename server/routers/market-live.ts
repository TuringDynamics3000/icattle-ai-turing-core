/**
 * Market Data Router - Live MLA API Integration
 * 
 * Provides real-time cattle pricing data from MLA's official Statistics API.
 * Replaces CSV-based approach with live daily updates.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getAllCattleMarketData,
  getLatestPrice,
  getAveragePrice,
  getHistoricalTrends,
  MLA_INDICATORS,
} from "../_core/mlaApi";

// In-memory cache for market data
let marketDataCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Map MLA indicator to our cattle categories
 */
function mapIndicatorToCategory(indicatorDesc: string): {
  category: string;
  weightRange: string;
} | null {
  const desc = indicatorDesc.toLowerCase();
  
  if (desc.includes("yearling steer") || desc.includes("restocker") && desc.includes("steer")) {
    return { category: "Steer", weightRange: "280-400" };
  }
  
  if (desc.includes("yearling heifer") || desc.includes("restocker") && desc.includes("heifer")) {
    return { category: "Heifer", weightRange: "280-400" };
  }
  
  if (desc.includes("feeder steer")) {
    return { category: "Steer", weightRange: "330-450" };
  }
  
  if (desc.includes("heavy steer")) {
    return { category: "Steer", weightRange: "450+" };
  }
  
  if (desc.includes("young cattle")) {
    return { category: "Steer", weightRange: "200-330" };
  }
  
  if (desc.includes("cow")) {
    return { category: "Cow", weightRange: "400+" };
  }
  
  return null;
}

export const marketLiveRouter = router({
  // ML Price Predictions
  predictPrices: publicProcedure
    .input(z.object({ days: z.number().min(1).max(30).default(7) }))
    .query(async ({ input }) => {
      const { predictPrices } = await import('../_core/mlPredictor');
      return await predictPrices(input.days);
    }),
  
  predictIndicatorPrice: publicProcedure
    .input(z.object({ 
      indicatorId: z.number(),
      days: z.number().min(1).max(30).default(7)
    }))
    .query(async ({ input }) => {
      const { predictIndicatorPrice } = await import('../_core/mlPredictor');
      return await predictIndicatorPrice(input.indicatorId, input.days);
    }),
  
  // RL Portfolio Recommendations
  getPortfolioRecommendations: publicProcedure
    .query(async () => {
      const { getPortfolioRecommendations } = await import('../_core/rlOptimizer');
      return await getPortfolioRecommendations();
    }),
  
  /**
   * Get price discovery data from live MLA API
   */
  getPriceDiscovery: publicProcedure
    .input(
      z.object({
        breed: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Get comprehensive market data
      const marketData = await getAllCattleMarketData();
      
      // Transform to price discovery format
      const priceDiscovery = marketData.map((data) => {
        const mapping = mapIndicatorToCategory(data.indicator_desc);
        
        return {
          breed: "Generic", // MLA data doesn't specify breed
          category: mapping?.category || "Unknown",
          weight_range: mapping?.weightRange || "N/A",
          price_per_kg: data.avg_price_per_kg,
          price_range_min: data.min_price_per_kg,
          price_range_max: data.max_price_per_kg,
          sample_size: data.total_head_count,
          last_updated: data.date_range.to,
          source: `MLA NLRS - ${data.indicator_desc}`,
          data_period: `${data.date_range.from} to ${data.date_range.to}`,
        };
      });
      
      // Filter by category if specified
      let results = priceDiscovery;
      if (input.category) {
        results = results.filter(
          (item) => item.category.toLowerCase() === input.category!.toLowerCase()
        );
      }
      
      return {
        data: results,
        cached_at: new Date().toISOString(),
        cache_age_hours: 0,
      };
    }),

  /**
   * Get all market data with caching
   */
  getAllMarketData: publicProcedure
    .input(
      z.object({
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      // Check cache
      const now = Date.now();
      if (
        !input.forceRefresh &&
        marketDataCache &&
        now - marketDataCache.timestamp < CACHE_DURATION_MS
      ) {
        return {
          ...marketDataCache.data,
          cache_age_hours: Math.round((now - marketDataCache.timestamp) / (1000 * 60 * 60)),
        };
      }
      
      // Fetch fresh data
      const marketData = await getAllCattleMarketData();
      
      // Transform to price discovery format
      const priceDiscovery = marketData.map((data) => {
        const mapping = mapIndicatorToCategory(data.indicator_desc);
        
        return {
          breed: "Generic",
          category: mapping?.category || "Unknown",
          weight_range: mapping?.weightRange || "N/A",
          price_per_kg: data.avg_price_per_kg,
          price_range_min: data.min_price_per_kg,
          price_range_max: data.max_price_per_kg,
          sample_size: data.total_head_count,
          last_updated: data.date_range.to,
          source: `MLA NLRS - ${data.indicator_desc}`,
        };
      });
      
      // Get historical trends for Steer and Heifer
      const [steerTrends, heiferTrends] = await Promise.all([
        getHistoricalTrends(MLA_INDICATORS.RESTOCKER_YEARLING_STEER),
        getHistoricalTrends(MLA_INDICATORS.RESTOCKER_YEARLING_HEIFER),
      ]);
      
      // Merge trends by month
      const trendsMap = new Map<string, any>();
      
      for (const trend of steerTrends) {
        trendsMap.set(trend.month, {
          quarter: trend.month,
          steer_avg: trend.avg_price_per_kg,
        });
      }
      
      for (const trend of heiferTrends) {
        const existing = trendsMap.get(trend.month);
        if (existing) {
          existing.heifer_avg = trend.avg_price_per_kg;
        } else {
          trendsMap.set(trend.month, {
            quarter: trend.month,
            heifer_avg: trend.avg_price_per_kg,
          });
        }
      }
      
      const historicalTrends = Array.from(trendsMap.values())
        .sort((a, b) => a.quarter.localeCompare(b.quarter))
        .slice(-24); // Last 24 months
      
      const result = {
        price_discovery: priceDiscovery,
        recent_auctions: [],
        historical_trends: historicalTrends,
        cached_at: new Date().toISOString(),
        cache_age_hours: 0,
      };
      
      // Update cache
      marketDataCache = {
        data: result,
        timestamp: now,
      };
      
      return result;
    }),

  /**
   * Get market price for specific cattle
   */
  getMarketPrice: publicProcedure
    .input(
      z.object({
        breed: z.string(),
        category: z.string(),
        weight: z.number(),
      })
    )
    .query(async ({ input }) => {
      // Determine which indicator to use based on category
      let indicatorId: number;
      
      const cat = input.category.toLowerCase();
      if (cat.includes("steer")) {
        indicatorId = MLA_INDICATORS.RESTOCKER_YEARLING_STEER;
      } else if (cat.includes("heifer")) {
        indicatorId = MLA_INDICATORS.RESTOCKER_YEARLING_HEIFER;
      } else if (cat.includes("cow")) {
        indicatorId = MLA_INDICATORS.PROCESSOR_COW;
      } else {
        // Default to young cattle
        indicatorId = MLA_INDICATORS.YOUNG_CATTLE;
      }
      
      try {
        const priceData = await getAveragePrice(indicatorId);
        
        // Calculate estimated value
        const estimatedValue = priceData.avg_price_per_kg * input.weight;
        const minValue = priceData.min_price_per_kg * input.weight;
        const maxValue = priceData.max_price_per_kg * input.weight;
        
        return {
          price_per_kg: priceData.avg_price_per_kg,
          price_range_min: priceData.min_price_per_kg,
          price_range_max: priceData.max_price_per_kg,
          estimated_value: Math.round(estimatedValue),
          value_range_min: Math.round(minValue),
          value_range_max: Math.round(maxValue),
          sample_size: priceData.total_head_count,
          last_updated: priceData.date_range.to,
          source: `MLA NLRS - ${priceData.indicator_desc}`,
        };
      } catch (error) {
        console.error("Failed to get market price:", error);
        return null;
      }
    }),

  /**
   * Get market trends summary
   */
  getMarketTrends: publicProcedure.query(async () => {
    const marketData = await getAllCattleMarketData();
    
    // Group by category
    const categoryMap = new Map<string, any[]>();
    
    for (const data of marketData) {
      const mapping = mapIndicatorToCategory(data.indicator_desc);
      if (!mapping) continue;
      
      const category = mapping.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      
      categoryMap.get(category)!.push(data);
    }
    
    // Calculate averages per category
    const trends = Array.from(categoryMap.entries()).map(([category, dataPoints]) => {
      const totalHead = dataPoints.reduce((sum, d) => sum + d.total_head_count, 0);
      const weightedSum = dataPoints.reduce(
        (sum, d) => sum + d.avg_price_per_kg * d.total_head_count,
        0
      );
      
      const prices = dataPoints.flatMap(d => [
        d.avg_price_per_kg,
        d.min_price_per_kg,
        d.max_price_per_kg,
      ]);
      
      return {
        category,
        average_price_per_kg: weightedSum / totalHead,
        min_price_per_kg: Math.min(...prices),
        max_price_per_kg: Math.max(...prices),
        sample_size: totalHead,
      };
    });
    
    return {
      trends,
      total_samples: marketData.length,
    };
  }),
});
