import { eq, desc, and, sql, gte, lte, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, clients, cattle, lifecycleEvents, 
  valuations, marketData, financialReports, notifications,
  portfolioSnapshots,
  Client, Cattle, LifecycleEvent, Valuation, MarketData, Notification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // postgres driver needs explicit connection options
      const client = postgres(process.env.DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      _db = drizzle(client);
      
      // Test connection
      await client`SELECT 1`;
      console.log('[Database] Connected successfully');
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

export async function getAllClients(): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function getActiveClients(): Promise<(Client & { cattle_count: number; total_value: number })[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active clients with aggregated cattle data
  const result = await db
    .select({
      id: clients.id,
      name: clients.name,
      contactName: clients.contactName,
      contactEmail: clients.contactEmail,
      contactPhone: clients.contactPhone,
      abn: clients.abn,
      address: clients.address,
      city: clients.city,
      state: clients.state,
      postcode: clients.postcode,
      status: clients.status,
      agriwebbId: clients.agriwebbId,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      cattle_count: sql<number>`cast(count(${cattle.id}) as integer)`,
      total_value: sql<number>`cast(coalesce(sum(${cattle.currentValuation}), 0) as integer)`,
    })
    .from(clients)
    .leftJoin(cattle, and(
      eq(cattle.clientId, clients.id),
      eq(cattle.status, 'active')
    ))
    .where(eq(clients.status, 'active'))
    .groupBy(clients.id)
    .orderBy(sql`cast(coalesce(sum(${cattle.currentValuation}), 0) as integer) desc`);
  
  return result;
}

// ============================================================================
// CATTLE MANAGEMENT
// ============================================================================

export async function getAllCattle(): Promise<Cattle[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cattle).orderBy(desc(cattle.createdAt));
}

export async function getCattleCount(filters?: {
  clientId?: number;
  healthStatus?: string;
  breed?: string;
  sex?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [eq(cattle.status, 'active')];
  
  if (filters?.clientId) {
    conditions.push(eq(cattle.clientId, filters.clientId));
  }
  
  if (filters?.healthStatus) {
    conditions.push(eq(cattle.healthStatus, filters.healthStatus));
  }
  
  if (filters?.breed) {
    conditions.push(eq(cattle.breed, filters.breed));
  }
  
  if (filters?.sex) {
    conditions.push(eq(cattle.sex, filters.sex));
  }
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(cattle)
    .where(and(...conditions));
  
  return Number(result[0]?.count || 0);
}

export async function getCattleById(id: number): Promise<Cattle | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(cattle).where(eq(cattle.id, id)).limit(1);
  return result[0];
}

export async function getCattleByClient(clientId: number): Promise<Cattle[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cattle)
    .where(and(
      eq(cattle.clientId, clientId),
      eq(cattle.status, 'active')
    ))
    .orderBy(desc(cattle.createdAt));
}

export async function getActiveCattle(): Promise<Cattle[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cattle)
    .where(eq(cattle.status, 'active'))
    .orderBy(desc(cattle.currentValuation));
}

export async function getCattlePaginated(
  offset: number,
  limit: number,
  filters?: {
    clientId?: number;
    healthStatus?: string;
    breed?: string;
    sex?: string;
    searchQuery?: string;
  }
): Promise<Cattle[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(cattle.status, 'active')];
  
  if (filters?.clientId) {
    conditions.push(eq(cattle.clientId, filters.clientId));
  }
  
  if (filters?.healthStatus) {
    conditions.push(eq(cattle.healthStatus, filters.healthStatus));
  }
  
  if (filters?.breed) {
    conditions.push(eq(cattle.breed, filters.breed));
  }
  
  if (filters?.sex) {
    conditions.push(eq(cattle.sex, filters.sex));
  }
  
  if (filters?.searchQuery) {
    const searchConditions = [
      like(cattle.nlisId, `%${filters.searchQuery}%`),
      like(cattle.visualId, `%${filters.searchQuery}%`),
    ];
    conditions.push(or(...searchConditions));
  }
  
  return await db.select().from(cattle)
    .where(and(...conditions))
    .orderBy(desc(cattle.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

export async function getLifecycleEvents(cattleId: number): Promise<LifecycleEvent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(lifecycleEvents)
    .where(eq(lifecycleEvents.cattleId, cattleId))
    .orderBy(desc(lifecycleEvents.eventDate));
}

export async function getRecentEvents(limit: number = 50): Promise<LifecycleEvent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(lifecycleEvents)
    .orderBy(desc(lifecycleEvents.eventDate))
    .limit(limit);
}

// ============================================================================
// VALUATIONS
// ============================================================================

export async function getValuationHistory(cattleId: number): Promise<Valuation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(valuations)
    .where(eq(valuations.cattleId, cattleId))
    .orderBy(desc(valuations.valuationDate));
}

export async function getLatestValuation(cattleId: number): Promise<Valuation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(valuations)
    .where(eq(valuations.cattleId, cattleId))
    .orderBy(desc(valuations.valuationDate))
    .limit(1);
  
  return result[0];
}

// ============================================================================
// MARKET DATA
// ============================================================================

export async function getLatestMarketData(): Promise<MarketData[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get the most recent date
  const latestDate = await db.select({ date: marketData.date })
    .from(marketData)
    .orderBy(desc(marketData.date))
    .limit(1);
  
  if (latestDate.length === 0) return [];
  
  return await db.select().from(marketData)
    .where(eq(marketData.date, latestDate[0]!.date))
    .orderBy(marketData.category);
}

export async function getMarketDataByCategory(category: string, days: number = 30): Promise<MarketData[]> {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await db.select().from(marketData)
    .where(and(
      eq(marketData.category, category),
      gte(marketData.date, startDate)
    ))
    .orderBy(desc(marketData.date));
}

// ============================================================================
// PORTFOLIO ANALYTICS
// ============================================================================

export async function getPortfolioSummary(clientId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = clientId 
    ? and(eq(cattle.status, 'active'), eq(cattle.clientId, clientId))
    : eq(cattle.status, 'active');
  
  const result = await db.select({
    totalCattle: sql<number>`COUNT(*)`,
    totalValue: sql<number>`SUM(${cattle.currentValuation})`,
    avgValue: sql<number>`AVG(${cattle.currentValuation})`,
    totalWeight: sql<number>`SUM(${cattle.currentWeight})`,
    sickCattle: sql<number>`SUM(CASE WHEN ${cattle.healthStatus} = 'sick' THEN 1 ELSE 0 END)`,
  }).from(cattle).where(conditions);
  
  return result[0];
}

export async function getBreedDistribution(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = clientId 
    ? and(eq(cattle.status, 'active'), eq(cattle.clientId, clientId))
    : eq(cattle.status, 'active');
  
  return await db.select({
    breed: cattle.breed,
    count: sql<number>`COUNT(*)`,
    totalValue: sql<number>`SUM(${cattle.currentValuation})`,
  }).from(cattle)
    .where(conditions)
    .groupBy(cattle.breed)
    .orderBy(desc(sql<number>`COUNT(*)`));
}

export async function getCattleTypeDistribution(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = clientId 
    ? and(eq(cattle.status, 'active'), eq(cattle.clientId, clientId))
    : eq(cattle.status, 'active');
  
  return await db.select({
    cattleType: cattle.cattleType,
    count: sql<number>`COUNT(*)`,
    totalValue: sql<number>`SUM(${cattle.currentValuation})`,
  }).from(cattle)
    .where(conditions)
    .groupBy(cattle.cattleType);
}


// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db
    .update(notifications)
    .set({ 
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
  
  return { success: true };
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db
    .update(notifications)
    .set({ 
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(notifications.userId, userId));
  
  return { success: true };
}

export async function createNotification(data: {
  userId: number;
  type: "health_alert" | "valuation_update" | "compliance_warning" | "system";
  title: string;
  message: string;
  cattleId?: number;
  clientId?: number;
}) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db.insert(notifications).values(data);
  return { success: true };
}


// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function batchHealthCheck(
  cattleIds: number[],
  healthStatus: "healthy" | "sick" | "quarantine",
  notes?: string
) {
  const db = await getDb();
  if (!db) return { success: false };
  
  // Update health status for all cattle
  await db
    .update(cattle)
    .set({ healthStatus })
    .where(sql`${cattle.id} IN (${sql.join(cattleIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Create lifecycle events for each
  const events = cattleIds.map(cattleId => ({
    cattleId,
    eventType: "health_check" as const,
    eventDate: new Date(),
    details: `Health status: ${healthStatus}`,
    notes: notes || `Batch health check - Status: ${healthStatus}`,
  }));
  
  await db.insert(lifecycleEvents).values(events);
  
  return { success: true, count: cattleIds.length };
}

export async function batchMovement(
  cattleIds: number[],
  toLocation: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) return { success: false };
  
  // Get current locations
  const cattleData = await db
    .select()
    .from(cattle)
    .where(sql`${cattle.id} IN (${sql.join(cattleIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Update locations
  await db
    .update(cattle)
    .set({ currentLocation: toLocation })
    .where(sql`${cattle.id} IN (${sql.join(cattleIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Create movement events
  const events = cattleData.map(c => ({
    cattleId: c.id,
    eventType: "movement" as const,
    eventDate: new Date(),
    details: `Moved from ${c.currentLocation || 'unknown'} to ${toLocation}`,
    fromLocation: c.currentLocation,
    toLocation,
    notes: notes || `Batch movement to ${toLocation}`,
  }));
  
  await db.insert(lifecycleEvents).values(events);
  
  return { success: true, count: cattleIds.length };
}

export async function batchValuation(
  cattleIds: number[],
  valuationMethod: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) return { success: false };
  
  // Get current cattle data
  const cattleData = await db
    .select()
    .from(cattle)
    .where(sql`${cattle.id} IN (${sql.join(cattleIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Create valuations (simplified - in production would use actual valuation logic)
  const valuationRecords = cattleData.map(c => ({
    cattleId: c.id,
    valuationDate: new Date(),
    valuationAmount: c.currentValuation || 0, // Keep current value for now
    method: "market" as const,
    calculatedBy: "batch_system",
    notes: notes || `Batch valuation using ${valuationMethod}`,
  }));
  
  await db.insert(valuations).values(valuationRecords);
  
  return { success: true, count: cattleIds.length };
}


// ============================================================================
// XERO INTEGRATION
// ============================================================================

export async function saveXeroTokens(
  userId: number,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }
) {
  const db = await getDb();
  if (!db) return;
  
  // Store in user table (simplified - in production use separate xero_connections table)
  await db
    .update(users)
    .set({
      xeroAccessToken: tokens.accessToken,
      xeroRefreshToken: tokens.refreshToken,
      xeroTokenExpiresAt: tokens.expiresAt,
    })
    .where(eq(users.id, userId));
}

export async function getXeroTokens(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [user] = await db
    .select({
      accessToken: users.xeroAccessToken,
      refreshToken: users.xeroRefreshToken,
      expiresAt: users.xeroTokenExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user?.accessToken) return null;
  
  return {
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    expiresAt: user.expiresAt,
  };
}

export async function deleteXeroTokens(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(users)
    .set({
      xeroAccessToken: null,
      xeroRefreshToken: null,
      xeroTokenExpiresAt: null,
    })
    .where(eq(users.id, userId));
}

// ============================================================================
// PORTFOLIO SNAPSHOTS
// ============================================================================

/**
 * Create a new portfolio snapshot
 */
export async function createPortfolioSnapshot(snapshot: {
  snapshotDate: Date;
  totalValue: number;
  cattleCount: number;
  activeClients: number;
  valueChange?: number;
  valueChangePercent?: number;
  cattleChange?: number;
  clientChange?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db
    .insert(portfolioSnapshots)
    .values(snapshot)
    .returning();

  return result;
}

/**
 * Get the latest portfolio snapshot
 */
export async function getLatestPortfolioSnapshot() {
  const db = await getDb();
  if (!db) return null;

  const [snapshot] = await db
    .select()
    .from(portfolioSnapshots)
    .orderBy(desc(portfolioSnapshots.snapshotDate))
    .limit(1);

  return snapshot || null;
}

/**
 * Get portfolio snapshot by date
 */
export async function getPortfolioSnapshotByDate(date: Date) {
  const db = await getDb();
  if (!db) return null;

  const [snapshot] = await db
    .select()
    .from(portfolioSnapshots)
    .where(eq(portfolioSnapshots.snapshotDate, date))
    .limit(1);

  return snapshot || null;
}

/**
 * Calculate and create a portfolio snapshot with change metrics
 */
export async function calculateAndCreatePortfolioSnapshot() {
  const db = await getDb();
  if (!db) return null;

  // Get current portfolio metrics
  const [stats] = await db
    .select({
      totalValue: sql<number>`COALESCE(SUM(${cattle.currentValuation}), 0)`,
      totalCattle: sql<number>`COUNT(${cattle.id})`,
      activeClients: sql<number>`COUNT(DISTINCT ${cattle.clientId})`,
    })
    .from(cattle)
    .where(eq(cattle.status, 'active'));

  if (!stats) return null;

  // Get the previous snapshot
  const previousSnapshot = await getLatestPortfolioSnapshot();

  const now = new Date();
  const snapshot = {
    snapshotDate: now,
    totalValue: Number(stats.totalValue),
    cattleCount: Number(stats.totalCattle),
    activeClients: Number(stats.activeClients),
    valueChange: previousSnapshot ? Number(stats.totalValue) - previousSnapshot.totalValue : 0,
    valueChangePercent: previousSnapshot && previousSnapshot.totalValue > 0
      ? Math.round(((Number(stats.totalValue) - previousSnapshot.totalValue) / previousSnapshot.totalValue) * 10000) // basis points
      : 0,
    cattleChange: previousSnapshot ? Number(stats.totalCattle) - previousSnapshot.cattleCount : 0,
    clientChange: previousSnapshot ? Number(stats.activeClients) - previousSnapshot.activeClients : 0,
  };

  return createPortfolioSnapshot(snapshot);
}
