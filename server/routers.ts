import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // CLIENTS
  // ============================================================================
  
  clients: router({
    list: publicProcedure.query(async () => {
      return await db.getAllClients();
    }),
    
    active: publicProcedure.query(async () => {
      return await db.getActiveClients();
    }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),
  }),

  // ============================================================================
  // CATTLE
  // ============================================================================
  
  cattle: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCattle();
    }),
    
    active: publicProcedure.query(async () => {
      return await db.getActiveCattle();
    }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCattleById(input.id);
      }),
    
    byClient: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCattleByClient(input.clientId);
      }),
    
    // Batch operations
    batchHealthCheck: protectedProcedure
      .input(z.object({ 
        cattleIds: z.array(z.number()),
        healthStatus: z.enum(["healthy", "sick", "quarantine"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.batchHealthCheck(input.cattleIds, input.healthStatus, input.notes);
      }),
    
    batchMovement: protectedProcedure
      .input(z.object({ 
        cattleIds: z.array(z.number()),
        toLocation: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.batchMovement(input.cattleIds, input.toLocation, input.notes);
      }),
    
    batchValuation: protectedProcedure
      .input(z.object({ 
        cattleIds: z.array(z.number()),
        valuationMethod: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.batchValuation(input.cattleIds, input.valuationMethod, input.notes);
      }),
  }),

  // ============================================================================
  // LIFECYCLE EVENTS
  // ============================================================================
  
  events: router({
    forCattle: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLifecycleEvents(input.cattleId);
      }),
    
    recent: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getRecentEvents(input.limit);
      }),
  }),

  // ============================================================================
  // VALUATIONS
  // ============================================================================
  
  valuations: router({
    history: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getValuationHistory(input.cattleId);
      }),
    
    latest: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLatestValuation(input.cattleId);
      }),
  }),

  // ============================================================================
  // MARKET DATA
  // ============================================================================
  
  market: router({
    latest: publicProcedure.query(async () => {
      return await db.getLatestMarketData();
    }),
    
    byCategory: publicProcedure
      .input(z.object({ 
        category: z.string(),
        days: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getMarketDataByCategory(input.category, input.days);
      }),
  }),

  // ============================================================================
  // PORTFOLIO ANALYTICS
  // ============================================================================
  
  portfolio: router({
    summary: publicProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPortfolioSummary(input.clientId);
      }),
    
    breedDistribution: publicProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getBreedDistribution(input.clientId);
      }),
    
    typeDistribution: publicProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getCattleTypeDistribution(input.clientId);
      }),
  }),
  
  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.markNotificationAsRead(input.id, ctx.user.id);
      }),
    
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await db.markAllNotificationsAsRead(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
