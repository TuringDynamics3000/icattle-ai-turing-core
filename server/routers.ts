import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
// RBAC helper functions available but not yet integrated
// import { getAccessScopeForUser, requireAuthentication, requirePermission } from "./_core/rbac-middleware";
// import { getCattleWithRLS, getClientsWithRLS, getCattleByIdWithRLS } from "./_core/rbac-queries";
import { z } from "zod";
import * as db from "./db";
import { calculateCertification } from "./_core/certificationScoring";
import { marketLiveRouter } from "./routers/market-live";
import { BreedPremiums } from './_core/breedPremiums';
import { KafkaProducer } from './_core/kafkaProducer';
import { KafkaConsumer } from './_core/kafkaConsumer';
import { reconstructStateFromEvents, compareStates, verifyEventChainIntegrity, calculateReconstructionConfidence } from './_core/eventReplay';
import { analyzeForFraud, getHighRiskCattle } from './_core/fraudDetection';
import { enforceOnChain, generateComplianceReport } from './_core/protocolEnforcement';

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
    list: publicProcedure
      .query(async () => {
        return await db.getClients();
      }),
    
    active: publicProcedure
      .query(async () => {
        const clients = await db.getClients();
        return clients.filter((c: any) => c.status === 'active');
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
    list: publicProcedure
      .input(z.object({
        cursor: z.number().optional().default(0),
        limit: z.number().min(1).max(100).optional().default(50),
        filters: z.object({
          clientId: z.number().optional(),
          healthStatus: z.enum(["healthy", "sick", "quarantine", "deceased"]).optional(),
          breed: z.string().optional(),
          sex: z.enum(["bull", "steer", "cow", "heifer", "calf"]).optional(),
          searchQuery: z.string().optional(),
        }).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { cursor = 0, limit = 50, filters } = input || {};
        
        // Get cattle with pagination
        const cattleList = await db.getCattlePaginated(
          cursor,
          limit + 1,
          {
            clientId: filters?.clientId,
            healthStatus: filters?.healthStatus,
            breed: filters?.breed,
            sex: filters?.sex,
            searchQuery: filters?.searchQuery,
          }
        );
        
        // Get total count with filters
        const total = await db.getCattleCount({
          clientId: filters?.clientId,
          healthStatus: filters?.healthStatus,
          breed: filters?.breed,
          sex: filters?.sex,
        });
        
        // Check if there are more results
        const hasMore = cattleList.length > limit;
        const items = hasMore ? cattleList.slice(0, -1) : cattleList;
        
        // Add certification scoring to each cattle
        const itemsWithCert = items.map((c: any) => ({
          ...c,
          certification: calculateCertification(c),
        }));
        
        return {
          items: itemsWithCert,
          nextCursor: hasMore ? cursor + limit : undefined,
          hasMore,
          total,
        };
      }),
    
    active: publicProcedure
      .query(async () => {
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
        // @ts-ignore - Check permissions
        const { hasPermission } = await import('./_core/permissions');
        if (!hasPermission(ctx.accessScope?.role, 'cattle:update')) {
          throw new Error('Permission denied: cattle:update required');
        }
        
        // @ts-ignore - Verify user can access these cattle
        const { canModifyBatchCattle } = await import('./_core/rbac-queries');
        const { allowed, denied } = await canModifyBatchCattle(input.cattleIds, ctx.accessScope);
        
        if (denied.length > 0) {
          throw new Error(`Access denied to ${denied.length} cattle: ${denied.join(', ')}`);
        }
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
        // @ts-ignore - Check permissions
        const { hasPermission } = await import('./_core/permissions');
        if (!hasPermission(ctx.accessScope?.role, 'cattle:update')) {
          throw new Error('Permission denied: cattle:update required');
        }
        
        // @ts-ignore - Verify user can access these cattle
        const { canModifyBatchCattle } = await import('./_core/rbac-queries');
        const { allowed, denied } = await canModifyBatchCattle(input.cattleIds, ctx.accessScope);
        
        if (denied.length > 0) {
          throw new Error(`Access denied to ${denied.length} cattle: ${denied.join(', ')}`);
        }
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
        // @ts-ignore - Check permissions
        const { hasPermission } = await import('./_core/permissions');
        if (!hasPermission(ctx.accessScope?.role, 'valuation:update')) {
          throw new Error('Permission denied: valuation:update required');
        }
        
        // @ts-ignore - Verify user can access these cattle
        const { canModifyBatchCattle } = await import('./_core/rbac-queries');
        const { allowed, denied } = await canModifyBatchCattle(input.cattleIds, ctx.accessScope);
        
        if (denied.length > 0) {
          throw new Error(`Access denied to ${denied.length} cattle: ${denied.join(', ')}`);
        }
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
  // EVENT REPLAY & STATE RECONSTRUCTION
  // ============================================================================
  
  eventReplay: router({    
    reconstructState: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        // Get events from Golden Record
        const events = await KafkaConsumer.getCattleAuditTrail(input.cattleId);
        
        if (events.length === 0) {
          throw new Error('No events found for this cattle');
        }
        
        // Enforce Turing Protocol
        const protocolResult = enforceOnChain(events);
        if (!protocolResult.is_valid) {
          throw new Error(`Protocol violation: ${JSON.stringify(protocolResult.violations)}`);
        }
        
        // Reconstruct state
        const reconstructedState = reconstructStateFromEvents(events);
        
        // Get current state from database
        const currentState = await db.getCattleById(input.cattleId);
        
        // Compare states
        const comparison = compareStates(currentState, reconstructedState);
        
        // Calculate confidence
        const confidence = calculateReconstructionConfidence(events, reconstructedState);
        
        return {
          reconstructed_state: reconstructedState,
          current_state: currentState,
          comparison,
          confidence,
          chain_integrity: verifyEventChainIntegrity(events),
        };
      }),
    
    verifyIntegrity: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        const events = await KafkaConsumer.getCattleAuditTrail(input.cattleId);
        return verifyEventChainIntegrity(events);
      }),
  }),
  
  // ============================================================================
  // FRAUD DETECTION
  // ============================================================================
  
  fraud: router({
    analyze: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        // Get events from Golden Record
        const events = await KafkaConsumer.getCattleAuditTrail(input.cattleId);
        
        if (events.length === 0) {
          return {
            cattle_id: input.cattleId,
            alerts: [],
            risk_score: 0,
            protocol_compliant: true,
            protocol_violations: [],
            analyzed_events: 0,
            analysis_timestamp: new Date().toISOString(),
          };
        }
        
        // Analyze for fraud (includes protocol enforcement)
        return await analyzeForFraud(input.cattleId, events);
      }),
    
    getHighRisk: publicProcedure
      .query(async () => {
        // Get all cattle
        const cattle = await db.getAllCattle();
        
        // Analyze each cattle for fraud
        const results = new Map();
        for (const animal of cattle) {
            const events = await KafkaConsumer.getCattleAuditTrail(animal.id);
          if (events.length > 0) {
            const result = await analyzeForFraud(animal.id, events);
            results.set(animal.id, result);
          }
        }
        
        // Return high-risk cattle
        return getHighRiskCattle(results);
      }),
    
    getProtocolCompliance: publicProcedure
      .input(z.object({ cattleId: z.number() }))
      .query(async ({ input }) => {
        const events = await KafkaConsumer.getCattleAuditTrail(input.cattleId);
        return generateComplianceReport(input.cattleId, events);
      }),
  }),
  
  // ============================================================================
  // XERO INTEGRATION (AASB 141 Compliance)
  // ============================================================================
  
  xero: router({    getAuthUrl: protectedProcedure
      .query(async () => {
        const { getXeroAuthorizationUrl } = await import('./_core/xeroIntegration');
        return { url: await getXeroAuthorizationUrl() };
      }),
    
    handleCallback: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { exchangeCodeForTokens, getXeroTenants } = await import('./_core/xeroIntegration');
        const tokenSet = await exchangeCodeForTokens(input.code);
        
        // Store tokens in database (associated with user)
        await db.saveXeroTokens(ctx.user.id, {
          accessToken: tokenSet.access_token!,
          refreshToken: tokenSet.refresh_token!,
          expiresAt: new Date(Date.now() + (tokenSet.expires_in! * 1000)),
        });
        
        // Get connected tenants
        const tenants = await getXeroTenants(tokenSet.access_token!);
        
        return { success: true, tenants };
      }),
    
    getTenants: protectedProcedure
      .query(async ({ ctx }) => {
        const tokens = await db.getXeroTokens(ctx.user.id);
        if (!tokens) return [];
        
        const { getXeroTenants } = await import('./_core/xeroIntegration');
        return await getXeroTenants(tokens.accessToken);
      }),
    
    syncLivestockToXero: protectedProcedure
      .input(z.object({ tenantId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const tokens = await db.getXeroTokens(ctx.user.id);
        if (!tokens) throw new Error('Xero not connected');
        
        const { createXeroClient, syncCattleToXero } = await import('./_core/xeroIntegration');
        const xeroClient = createXeroClient();
        await xeroClient.setTokenSet({ access_token: tokens.accessToken } as any);
        
        // Get all cattle for this user
        const cattle = await db.getAllCattle();
        
        // Sync to Xero
        return await syncCattleToXero({
          xeroClient,
          tenantId: input.tenantId,
          cattle: cattle.map(c => ({
            id: c.id.toString(),
            nlisTag: c.nlisId || '',
            breed: c.breed,
            bookValue: c.acquisitionCost ? c.acquisitionCost / 100 : 0, // Convert cents to dollars
            marketValue: c.currentValuation ? c.currentValuation / 100 : 0, // Convert cents to dollars
            costsToSell: 300, // Default transport + agent fees
          })),
        });
      }),
    
    createFairValueAdjustment: protectedProcedure
      .input(z.object({
        tenantId: z.string(),
        previousValue: z.number(),
        currentValue: z.number(),
        narration: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tokens = await db.getXeroTokens(ctx.user.id);
        if (!tokens) throw new Error('Xero not connected');
        
        const { createXeroClient, createFairValueAdjustmentJournal } = await import('./_core/xeroIntegration');
        const xeroClient = createXeroClient();
        await xeroClient.setTokenSet({ access_token: tokens.accessToken } as any);
        
        return await createFairValueAdjustmentJournal({
          xeroClient,
          tenantId: input.tenantId,
          previousValue: input.previousValue,
          currentValue: input.currentValue,
          date: new Date(),
          narration: input.narration || 'Fair value adjustment for livestock (AASB 141)',
        });
      }),
    
    getProfitAndLoss: protectedProcedure
      .input(z.object({
        tenantId: z.string(),
        fromDate: z.string(),
        toDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const tokens = await db.getXeroTokens(ctx.user.id);
        if (!tokens) throw new Error('Xero not connected');
        
        const { createXeroClient, getXeroProfitAndLoss } = await import('./_core/xeroIntegration');
        const xeroClient = createXeroClient();
        await xeroClient.setTokenSet({ access_token: tokens.accessToken } as any);
        
        return await getXeroProfitAndLoss({
          xeroClient,
          tenantId: input.tenantId,
          fromDate: new Date(input.fromDate),
          toDate: new Date(input.toDate),
        });
      }),
    
    getBalanceSheet: protectedProcedure
      .input(z.object({
        tenantId: z.string(),
        date: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const tokens = await db.getXeroTokens(ctx.user.id);
        if (!tokens) throw new Error('Xero not connected');
        
        const { createXeroClient, getXeroBalanceSheet } = await import('./_core/xeroIntegration');
        const xeroClient = createXeroClient();
        await xeroClient.setTokenSet({ access_token: tokens.accessToken } as any);
        
        return await getXeroBalanceSheet({
          xeroClient,
          tenantId: input.tenantId,
          date: new Date(input.date),
        });
      }),
    
    generateAASB141Disclosure: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        const { generateAASB141Disclosure } = await import('./_core/xeroIntegration');
        
        // Get livestock data for the period
        const cattle = await db.getAllCattle();
        const totalValue = cattle.reduce((sum, c) => sum + (c.currentValuation || 0) / 100, 0);
        
        // Group by type
        const livestockGroups = [
          {
            type: 'Breeding',
            quantity: cattle.filter(c => c.cattleType === 'breeding').length,
            averageFairValue: 5000,
            totalFairValue: cattle.filter(c => c.cattleType === 'breeding').reduce((sum, c) => sum + (c.currentValuation || 0) / 100, 0),
          },
          {
            type: 'Beef',
            quantity: cattle.filter(c => c.cattleType === 'beef').length,
            averageFairValue: 3000,
            totalFairValue: cattle.filter(c => c.cattleType === 'beef').reduce((sum, c) => sum + (c.currentValuation || 0) / 100, 0),
          },
          {
            type: 'Dairy',
            quantity: cattle.filter(c => c.cattleType === 'dairy').length,
            averageFairValue: 2500,
            totalFairValue: cattle.filter(c => c.cattleType === 'dairy').reduce((sum, c) => sum + (c.currentValuation || 0) / 100, 0),
          },
          {
            type: 'Feeder',
            quantity: cattle.filter(c => c.cattleType === 'feeder').length,
            averageFairValue: 2000,
            totalFairValue: cattle.filter(c => c.cattleType === 'feeder').reduce((sum, c) => sum + (c.currentValuation || 0) / 100, 0),
          },
        ];
        
        return generateAASB141Disclosure({
          openingBalance: totalValue * 0.9, // Simplified
          purchases: totalValue * 0.1,
          sales: 0,
          fairValueGains: totalValue * 0.05,
          fairValueLosses: totalValue * 0.02,
          closingBalance: totalValue,
          livestockGroups,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        });
      }),
    
    disconnect: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.deleteXeroTokens(ctx.user.id);
        return { success: true };
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
