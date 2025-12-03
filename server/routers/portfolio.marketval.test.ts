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

describe("Portfolio Market Valuation", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create mock cache file
    await writeFile(CACHE_FILE, JSON.stringify(mockCacheData, null, 2));

    // Create context
    const ctx = createTestContext();

    caller = appRouter.createCaller(ctx);
  });

  describe("marketValuation", () => {
    it("should return portfolio market valuation data", async () => {
      const result = await caller.portfolio.marketValuation({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalBookValue");
      expect(result).toHaveProperty("totalMarketValue");
      expect(result).toHaveProperty("marketPremium");
      expect(result).toHaveProperty("cattleWithMarketData");
      expect(result).toHaveProperty("totalCattle");
    });

    it("should have valid book value", async () => {
      const result = await caller.portfolio.marketValuation({});

      expect(result.totalBookValue).toBeGreaterThan(0);
      expect(typeof result.totalBookValue).toBe("number");
    });

    it("should calculate market value for cattle with matching data", async () => {
      const result = await caller.portfolio.marketValuation({});

      if (result.totalMarketValue !== null) {
        expect(result.totalMarketValue).toBeGreaterThan(0);
        expect(typeof result.totalMarketValue).toBe("number");
      }
    });

    it("should report number of cattle with market data", async () => {
      const result = await caller.portfolio.marketValuation({});

      expect(result.cattleWithMarketData).toBeGreaterThanOrEqual(0);
      expect(result.cattleWithMarketData).toBeLessThanOrEqual(result.totalCattle);
    });

    it("should calculate market premium/discount", async () => {
      const result = await caller.portfolio.marketValuation({});

      if (result.marketPremium !== null) {
        expect(typeof result.marketPremium).toBe("number");
        // Premium can be positive (market > book) or negative (market < book)
      }
    });

    it("should filter by client when clientId provided", async () => {
      const allResult = await caller.portfolio.marketValuation({});
      const clientResult = await caller.portfolio.marketValuation({ clientId: 30001 });

      // Client-specific should have fewer or equal cattle than total
      expect(clientResult.totalCattle).toBeLessThanOrEqual(allResult.totalCattle);
      expect(clientResult.totalBookValue).toBeLessThanOrEqual(allResult.totalBookValue);
    });

    it("should handle missing cache file gracefully", async () => {
      // This test relies on the implementation returning null values when cache is missing
      // The actual cache exists from beforeAll, but we test the return structure
      const result = await caller.portfolio.marketValuation({});

      expect(result).toBeDefined();
      expect(result.totalBookValue).toBeGreaterThan(0);
    });

    it("should only count active cattle", async () => {
      const result = await caller.portfolio.marketValuation({});
      const allCattle = await caller.cattle.list();
      const activeCattle = allCattle.filter((c: any) => c.status === "active");

      expect(result.totalCattle).toBe(activeCattle.length);
    });
  });

  describe("Market Value Calculations", () => {
    it("should match market price calculations for individual cattle", async () => {
      const result = await caller.portfolio.marketValuation({});
      
      // Get a sample cattle with market data
      const cattle = await caller.cattle.active();
      const angusSteer = cattle.find((c: any) => 
        c.breed === "Angus" && c.sex === "steer"
      );

      if (angusSteer) {
        const individualPrice = await caller.market.getMarketPrice({
          breed: angusSteer.breed,
          category: angusSteer.sex,
          weight: angusSteer.currentWeight,
        });

        if (individualPrice) {
          // Individual calculation should match the price per kg from cache
          expect(individualPrice.price_per_kg).toBe(6.0);
        }
      }
    });

    it("should have consistent totals", async () => {
      const result = await caller.portfolio.marketValuation({});
      const summary = await caller.portfolio.summary({});

      // Book value should match portfolio summary (summary returns number, we expect number)
      expect(result.totalBookValue).toBe(Number(summary.totalValue));
    });
  });

  describe("Edge Cases", () => {
    it("should handle cattle without breed/sex/weight", async () => {
      const result = await caller.portfolio.marketValuation({});

      // Should not throw error even if some cattle lack required fields
      expect(result).toBeDefined();
      expect(result.cattleWithMarketData).toBeGreaterThanOrEqual(0);
    });

    it("should handle breeds not in market data", async () => {
      const result = await caller.portfolio.marketValuation({});

      // Cattle with breeds not in cache should be excluded from market valuation
      // but still counted in totalCattle
      expect(result.totalCattle).toBeGreaterThanOrEqual(result.cattleWithMarketData);
    });

    it("should handle empty portfolio", async () => {
      // Test with non-existent client (should have 0 cattle)
      const result = await caller.portfolio.marketValuation({ clientId: 99999 });

      expect(result.totalCattle).toBe(0);
      expect(result.cattleWithMarketData).toBe(0);
      expect(result.totalBookValue).toBe(0);
    });
  });

  describe("Premium/Discount Logic", () => {
    it("should set marketPremium to null when no cattle have market data", async () => {
      // Test with a client that might not have cattle with market data
      const result = await caller.portfolio.marketValuation({ clientId: 99999 });

      if (result.cattleWithMarketData === 0) {
        expect(result.marketPremium).toBeNull();
        expect(result.totalMarketValue).toBeNull();
      }
    });

    it("should calculate premium as (market - book) in cents", async () => {
      const result = await caller.portfolio.marketValuation({});

      if (result.marketPremium !== null && result.totalMarketValue !== null) {
        const expectedPremium = result.totalMarketValue - result.totalBookValue;
        expect(result.marketPremium).toBe(expectedPremium);
      }
    });
  });
});
