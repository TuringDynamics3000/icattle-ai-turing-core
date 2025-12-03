import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

const CACHE_FILE = path.join(process.cwd(), "scripts", "mla_cache.json");
const SCRAPER_SCRIPT = path.join(process.cwd(), "scripts", "process_mla_data.py");

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface PriceDiscoveryData {
  breed: string;
  category: string;
  weight_range: string;
  price_per_kg: number;
  price_range_min: number;
  price_range_max: number;
  sample_size: number;
  last_updated: string;
  source: string;
  note?: string;
}

interface MarketDataCache {
  scraped_at: string;
  price_discovery: PriceDiscoveryData[];
  recent_auctions: any[];
  historical_trends?: Array<{
    quarter: string;
    heifer_avg?: number;
    steer_avg?: number;
  }>;
}

async function loadCachedData(): Promise<MarketDataCache | null> {
  try {
    const data = await readFile(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(data) as MarketDataCache;
    
    // Check if cache is still valid
    const scrapedAt = new Date(parsed.scraped_at).getTime();
    const now = Date.now();
    
    if (now - scrapedAt < CACHE_DURATION_MS) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function runScraper(): Promise<MarketDataCache> {
  try {
    console.log("Running AuctionsPlus scraper...");
    await execAsync(`python3 ${SCRAPER_SCRIPT}`);
    
    // Load the newly created cache
    const data = await readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data) as MarketDataCache;
  } catch (error) {
    console.error("Error running scraper:", error);
    throw new Error("Failed to fetch market data");
  }
}

export const marketRouter = router({
  /**
   * Get price discovery data for specific cattle parameters
   */
  getPriceDiscovery: publicProcedure
    .input(
      z.object({
        breed: z.string().optional(),
        category: z.string().optional(),
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      // Try to load cached data first
      let data = await loadCachedData();
      
      // If no valid cache or force refresh, run scraper
      if (!data || input.forceRefresh) {
        data = await runScraper();
      }
      
      // Filter by breed/category if specified
      let results = data.price_discovery;
      
      if (input.breed) {
        results = results.filter(
          (item) => item.breed.toLowerCase() === input.breed!.toLowerCase()
        );
      }
      
      if (input.category) {
        results = results.filter(
          (item) => item.category.toLowerCase() === input.category!.toLowerCase()
        );
      }
      
      return {
        data: results,
        cached_at: data.scraped_at,
        cache_age_hours: Math.round(
          (Date.now() - new Date(data.scraped_at).getTime()) / (1000 * 60 * 60)
        ),
      };
    }),

  /**
   * Get all available market data
   */
  getAllMarketData: publicProcedure
    .input(
      z.object({
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      // Try to load cached data first
      let data = await loadCachedData();
      
      // If no valid cache or force refresh, run scraper
      if (!data || input.forceRefresh) {
        data = await runScraper();
      }
      
      return {
        price_discovery: data.price_discovery,
        recent_auctions: data.recent_auctions,
        historical_trends: data.historical_trends || [],
        cached_at: data.scraped_at,
        cache_age_hours: Math.round(
          (Date.now() - new Date(data.scraped_at).getTime()) / (1000 * 60 * 60)
        ),
      };
    }),

  /**
   * Get market price for a specific cattle profile
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
      // Load cached data
      let data = await loadCachedData();
      
      if (!data) {
        data = await runScraper();
      }
      
      // Find matching price data
      // First try exact breed match, then fall back to "Generic"
      let match = data.price_discovery.find(
        (item) =>
          item.breed.toLowerCase() === input.breed.toLowerCase() &&
          item.category.toLowerCase() === input.category.toLowerCase()
      );
      
      // If no exact breed match, try Generic (for MLA data)
      if (!match) {
        match = data.price_discovery.find(
          (item) =>
            item.breed.toLowerCase() === "generic" &&
            item.category.toLowerCase() === input.category.toLowerCase()
        );
      }
      
      if (match) {
        // Calculate estimated value
        const estimatedValue = match.price_per_kg * input.weight;
        const minValue = match.price_range_min * input.weight;
        const maxValue = match.price_range_max * input.weight;
        
        return {
          price_per_kg: match.price_per_kg,
          price_range_min: match.price_range_min,
          price_range_max: match.price_range_max,
          estimated_value: Math.round(estimatedValue),
          value_range_min: Math.round(minValue),
          value_range_max: Math.round(maxValue),
          sample_size: match.sample_size,
          last_updated: match.last_updated,
          source: match.source,
        };
      }
      
      // If no exact match, return null
      return null;
    }),

  /**
   * Get market trends summary
   */
  getMarketTrends: publicProcedure.query(async () => {
    // Load cached data
    let data = await loadCachedData();
    
    if (!data) {
      data = await runScraper();
    }
    
    // Calculate average prices by category
    const categoryAverages = data.price_discovery.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          total: 0,
          count: 0,
          min: Infinity,
          max: -Infinity,
        };
      }
      
      acc[item.category].total += item.price_per_kg;
      acc[item.category].count += 1;
      acc[item.category].min = Math.min(acc[item.category].min, item.price_per_kg);
      acc[item.category].max = Math.max(acc[item.category].max, item.price_per_kg);
      
      return acc;
    }, {} as Record<string, { total: number; count: number; min: number; max: number }>);
    
    const trends = Object.entries(categoryAverages).map(([category, stats]) => ({
      category,
      average_price_per_kg: Math.round((stats.total / stats.count) * 100) / 100,
      min_price_per_kg: Math.round(stats.min * 100) / 100,
      max_price_per_kg: Math.round(stats.max * 100) / 100,
      sample_count: stats.count,
    }));
    
    return {
      trends,
      last_updated: data.scraped_at,
      total_samples: data.price_discovery.length,
    };
  }),
});
