import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { writeFile } from "fs/promises";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "scripts", "auctionsplus_cache.json");

// Mock cache data
const mockCacheData = {
  scraped_at: new Date().toISOString(),
  price_discovery: [
    {
      breed: "Angus",
      category: "Steer",
      weight_range: "400-500kg",
      price_per_kg: 6.0,
      price_range_min: 5.1,
      price_range_max: 6.9,
      sample_size: 39,
      last_updated: new Date().toISOString(),
      source: "AuctionsPlus Price Discovery (simulated)",
      note: "Requires authentication for live data",
    },
    {
      breed: "Wagyu",
      category: "Steer",
      weight_range: "450-550kg",
      price_per_kg: 8.41,
      price_range_min: 7.15,
      price_range_max: 9.67,
      sample_size: 16,
      last_updated: new Date().toISOString(),
      source: "AuctionsPlus Price Discovery (simulated)",
      note: "Requires authentication for live data",
    },
    {
      breed: "Hereford",
      category: "Heifer",
      weight_range: "350-450kg",
      price_per_kg: 4.62,
      price_range_min: 3.93,
      price_range_max: 5.31,
      sample_size: 42,
      last_updated: new Date().toISOString(),
      source: "AuctionsPlus Price Discovery (simulated)",
      note: "Requires authentication for live data",
    },
  ],
  recent_auctions: [],
};

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "http",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Market Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create mock cache file
    await writeFile(CACHE_FILE, JSON.stringify(mockCacheData, null, 2));

    // Create context
    const ctx = createTestContext();

    caller = appRouter.createCaller(ctx);
  });

  describe("getPriceDiscovery", () => {
    it("should return all price discovery data when no filters applied", async () => {
      const result = await caller.market.getPriceDiscovery({});

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(3);
      expect(result.cached_at).toBeDefined();
      expect(result.cache_age_hours).toBeGreaterThanOrEqual(0);
    });

    it("should filter by breed", async () => {
      const result = await caller.market.getPriceDiscovery({ breed: "Angus" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].breed).toBe("Angus");
      expect(result.data[0].category).toBe("Steer");
      expect(result.data[0].price_per_kg).toBe(6.0);
    });

    it("should filter by category", async () => {
      const result = await caller.market.getPriceDiscovery({ category: "Steer" });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((item) => item.category === "Steer")).toBe(true);
    });

    it("should filter by both breed and category", async () => {
      const result = await caller.market.getPriceDiscovery({
        breed: "Wagyu",
        category: "Steer",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].breed).toBe("Wagyu");
      expect(result.data[0].category).toBe("Steer");
      expect(result.data[0].price_per_kg).toBe(8.41);
    });

    it("should return empty array when no matches found", async () => {
      const result = await caller.market.getPriceDiscovery({
        breed: "NonexistentBreed",
      });

      expect(result.data).toHaveLength(0);
    });

    it("should be case insensitive for filters", async () => {
      const result = await caller.market.getPriceDiscovery({
        breed: "angus",
        category: "steer",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].breed).toBe("Angus");
    });
  });

  describe("getAllMarketData", () => {
    it("should return complete market data", async () => {
      const result = await caller.market.getAllMarketData({});

      expect(result).toBeDefined();
      expect(result.price_discovery).toHaveLength(3);
      expect(result.recent_auctions).toBeDefined();
      expect(result.cached_at).toBeDefined();
      expect(result.cache_age_hours).toBeGreaterThanOrEqual(0);
    });

    it("should include all required fields in price discovery data", async () => {
      const result = await caller.market.getAllMarketData({});

      result.price_discovery.forEach((item) => {
        expect(item).toHaveProperty("breed");
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("weight_range");
        expect(item).toHaveProperty("price_per_kg");
        expect(item).toHaveProperty("price_range_min");
        expect(item).toHaveProperty("price_range_max");
        expect(item).toHaveProperty("sample_size");
        expect(item).toHaveProperty("last_updated");
        expect(item).toHaveProperty("source");
      });
    });
  });

  describe("getMarketPrice", () => {
    it("should calculate market price for Angus Steer", async () => {
      const result = await caller.market.getMarketPrice({
        breed: "Angus",
        category: "Steer",
        weight: 450,
      });

      expect(result).toBeDefined();
      expect(result?.price_per_kg).toBe(6.0);
      expect(result?.estimated_value).toBe(2700); // 6.0 * 450
      expect(result?.value_range_min).toBe(2295); // 5.1 * 450
      expect(result?.value_range_max).toBe(3105); // 6.9 * 450
      expect(result?.sample_size).toBe(39);
    });

    it("should calculate market price for Wagyu Steer", async () => {
      const result = await caller.market.getMarketPrice({
        breed: "Wagyu",
        category: "Steer",
        weight: 500,
      });

      expect(result).toBeDefined();
      expect(result?.price_per_kg).toBe(8.41);
      expect(result?.estimated_value).toBe(4205); // 8.41 * 500 = 4205
      expect(result?.sample_size).toBe(16);
    });

    it("should calculate market price for Hereford Heifer", async () => {
      const result = await caller.market.getMarketPrice({
        breed: "Hereford",
        category: "Heifer",
        weight: 400,
      });

      expect(result).toBeDefined();
      expect(result?.price_per_kg).toBe(4.62);
      expect(result?.estimated_value).toBe(1848); // 4.62 * 400
      expect(result?.value_range_min).toBe(1572); // 3.93 * 400
      expect(result?.value_range_max).toBe(2124); // 5.31 * 400
      expect(result?.sample_size).toBe(42);
    });

    it("should return null for non-existent breed/category combination", async () => {
      const result = await caller.market.getMarketPrice({
        breed: "NonexistentBreed",
        category: "Steer",
        weight: 450,
      });

      expect(result).toBeNull();
    });

    it("should handle different weight values correctly", async () => {
      const result300 = await caller.market.getMarketPrice({
        breed: "Angus",
        category: "Steer",
        weight: 300,
      });

      const result600 = await caller.market.getMarketPrice({
        breed: "Angus",
        category: "Steer",
        weight: 600,
      });

      expect(result300?.estimated_value).toBe(1800); // 6.0 * 300
      expect(result600?.estimated_value).toBe(3600); // 6.0 * 600
    });
  });

  describe("getMarketTrends", () => {
    it("should calculate market trends by category", async () => {
      const result = await caller.market.getMarketTrends();

      expect(result).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.last_updated).toBeDefined();
      expect(result.total_samples).toBe(3);
    });

    it("should include Steer category trends", async () => {
      const result = await caller.market.getMarketTrends();

      const steerTrend = result.trends.find((t) => t.category === "Steer");
      expect(steerTrend).toBeDefined();
      expect(steerTrend?.sample_count).toBe(2); // Angus + Wagyu
      expect(steerTrend?.average_price_per_kg).toBeGreaterThan(0);
      expect(steerTrend?.min_price_per_kg).toBe(6.0); // Angus
      expect(steerTrend?.max_price_per_kg).toBe(8.41); // Wagyu
    });

    it("should include Heifer category trends", async () => {
      const result = await caller.market.getMarketTrends();

      const heiferTrend = result.trends.find((t) => t.category === "Heifer");
      expect(heiferTrend).toBeDefined();
      expect(heiferTrend?.sample_count).toBe(1); // Hereford
      expect(heiferTrend?.average_price_per_kg).toBe(4.62);
      expect(heiferTrend?.min_price_per_kg).toBe(4.62);
      expect(heiferTrend?.max_price_per_kg).toBe(4.62);
    });

    it("should calculate correct average for Steer category", async () => {
      const result = await caller.market.getMarketTrends();

      const steerTrend = result.trends.find((t) => t.category === "Steer");
      // Average of Angus (6.0) and Wagyu (8.41) = 7.205
      expect(steerTrend?.average_price_per_kg).toBeCloseTo(7.21, 1);
    });
  });

  describe("Price Validation", () => {
    it("should have realistic price ranges", async () => {
      const result = await caller.market.getAllMarketData({});

      result.price_discovery.forEach((item) => {
        // Prices should be positive
        expect(item.price_per_kg).toBeGreaterThan(0);
        expect(item.price_range_min).toBeGreaterThan(0);
        expect(item.price_range_max).toBeGreaterThan(0);

        // Min should be less than average, average less than max
        expect(item.price_range_min).toBeLessThan(item.price_per_kg);
        expect(item.price_per_kg).toBeLessThan(item.price_range_max);

        // Sample size should be reasonable
        expect(item.sample_size).toBeGreaterThan(0);
        expect(item.sample_size).toBeLessThan(1000);
      });
    });

    it("should have premium pricing for Wagyu", async () => {
      const result = await caller.market.getAllMarketData({});

      const wagyu = result.price_discovery.find((item) => item.breed === "Wagyu");
      const angus = result.price_discovery.find((item) => item.breed === "Angus");

      expect(wagyu).toBeDefined();
      expect(angus).toBeDefined();

      // Wagyu should be more expensive than Angus
      expect(wagyu!.price_per_kg).toBeGreaterThan(angus!.price_per_kg);
    });
  });

  describe("Cache Behavior", () => {
    it("should report cache age", async () => {
      const result = await caller.market.getAllMarketData({});

      expect(result.cache_age_hours).toBeDefined();
      expect(typeof result.cache_age_hours).toBe("number");
      expect(result.cache_age_hours).toBeGreaterThanOrEqual(0);
    });

    it("should include timestamp in cached data", async () => {
      const result = await caller.market.getAllMarketData({});

      expect(result.cached_at).toBeDefined();
      const cacheDate = new Date(result.cached_at);
      expect(cacheDate.getTime()).toBeGreaterThan(0);
    });
  });
});
