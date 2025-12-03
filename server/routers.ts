import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { calculateCertification } from "./_core/certificationScoring";
import { marketLiveRouter } from "./routers/market-live";
import { BreedPremiums } from './_core/breedPremiums';
import { KafkaProducer } from './_core/kafkaProducer';
import { KafkaConsumer } from './_core/kafkaConsumer';

export const appRouter = router({
  system: systemRouter,
  market: marketLiveRouter,
  
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
      const cattle = await db.getAllCattle();
      // Add certification scoring to each cattle
      return cattle.map((c: any) => ({
        ...c,
        certification: calculateCertification(c),
      }));
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
      .mutation(async ({ input, ctx }) => {
        const result = await db.batchHealthCheck(input.cattleIds, input.healthStatus, input.notes);
        
        // Publish Kafka events for each cattle health check
        try {
          const events = input.cattleIds.map(cattleId => ({
            event_type: 'HEALTH_CHECK' as const,
            event_ref: `health-check-${cattleId}-${Date.now()}`,
            cattle_id: cattleId,
            payload: {
              health_status: input.healthStatus,
              notes: input.notes,
              checked_at: new Date().toISOString(),
            },
            created_by: ctx.user?.name || 'system',
          }));
          
          await KafkaProducer.publishBatch(events);
        } catch (error) {
          console.error('[Kafka] Failed to publish health check events:', error);
          // Don't fail the operation if Kafka is down
        }
        
        return result;
      }),
    
    batchMovement: protectedProcedure
      .input(z.object({ 
        cattleIds: z.array(z.number()),
        toLocation: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.batchMovement(input.cattleIds, input.toLocation, input.notes);
        
        // Publish Kafka events for each cattle movement
        try {
          const events = input.cattleIds.map(cattleId => ({
            event_type: 'MOVEMENT' as const,
            event_ref: `movement-${cattleId}-${Date.now()}`,
            cattle_id: cattleId,
            payload: {
              to_location: input.toLocation,
              notes: input.notes,
              moved_at: new Date().toISOString(),
            },
            created_by: ctx.user?.name || 'system',
          }));
          
          await KafkaProducer.publishBatch(events);
        } catch (error) {
          console.error('[Kafka] Failed to publish movement events:', error);
        }
        
        return result;
      }),
    
    batchValuation: protectedProcedure
      .input(z.object({ 
        cattleIds: z.array(z.number()),
        valuationMethod: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.batchValuation(input.cattleIds, input.valuationMethod, input.notes);
        
        // Publish Kafka events for each valuation update
        try {
          const events = input.cattleIds.map(cattleId => ({
            event_type: 'VALUATION_UPDATE' as const,
            event_ref: `valuation-${cattleId}-${Date.now()}`,
            cattle_id: cattleId,
            payload: {
              valuation_method: input.valuationMethod,
              notes: input.notes,
              updated_at: new Date().toISOString(),
            },
            created_by: ctx.user?.name || 'system',
          }));
          
          await KafkaProducer.publishBatch(events);
        } catch (error) {
          console.error('[Kafka] Failed to publish valuation events:', error);
        }
        
        return result;
      }),
    
    // Audit Trail from Golden Record
    auditTrail: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        try {
          const auditTrail = await KafkaConsumer.getCattleAuditTrail(input.cattleId);
          return auditTrail;
        } catch (error) {
          console.error('[Audit Trail] Failed to fetch:', error);
          return [];
        }
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
    
    marketValuation: publicProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        // Get all cattle (filtered by client if provided)
        const cattle = await db.getAllCattle();
        const filteredCattle = input.clientId 
          ? cattle.filter(c => c.clientId === input.clientId && c.status === 'active')
          : cattle.filter(c => c.status === 'active');
        
        // Get market prices from live MLA API
        const { getAllCattleMarketData } = await import('./_core/mlaApi');
        
        let marketPrices: any[] = [];
        try {
          marketPrices = await getAllCattleMarketData();
        } catch (error) {
          console.error('Failed to fetch market data:', error);
          return {
            totalBookValue: filteredCattle.reduce((sum, c) => sum + (c.currentValuation || 0), 0),
            totalMarketValue: null,
            marketPremium: null,
            cattleWithMarketData: 0,
            totalCattle: filteredCattle.length,
          };
        }
        
        // Calculate market value for each cattle
        let totalMarketValue = 0;
        let cattleWithMarketData = 0;
        
        for (const animal of filteredCattle) {
          if (!animal.breed || !animal.sex || !animal.currentWeight) continue;
          
          // Map cattle sex/type to MLA indicator category
          const category = animal.sex.toLowerCase();
          
          // Find matching price data from MLA API
          let priceData = marketPrices.find((p: any) => {
            const desc = p.indicator_desc.toLowerCase();
            if (category.includes('steer') && desc.includes('steer')) return true;
            if (category.includes('heifer') && desc.includes('heifer')) return true;
            if (category.includes('cow') && desc.includes('cow')) return true;
            return false;
          });
          
          // Fall back to Young Cattle indicator if no specific match
          if (!priceData) {
            priceData = marketPrices.find((p: any) => 
              p.indicator_desc.toLowerCase().includes('young cattle')
            );
          }
          
          if (priceData) {
            // Apply breed premium to base MLA price
            const adjustedPrice = BreedPremiums.calculateAdjustedPrice(
              priceData.avg_price_per_kg,
              animal.breed,
              animal.sex as any
            );
            totalMarketValue += adjustedPrice * animal.currentWeight;
            cattleWithMarketData++;
          }
        }
        
        const totalBookValue = filteredCattle.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
        const marketPremium = cattleWithMarketData > 0 
          ? ((totalMarketValue * 100) - totalBookValue) 
          : null;
        
        return {
          totalBookValue,
          totalMarketValue: cattleWithMarketData > 0 ? Math.round(totalMarketValue * 100) : null,
          marketPremium,
          cattleWithMarketData,
          totalCattle: filteredCattle.length,
        };
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
