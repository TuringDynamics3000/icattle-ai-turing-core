/**
 * Row-Level Security Queries for iCattle
 * =======================================
 * All database queries filtered by user's access scope
 * Enforces RBAC at the database level
 */

import { db } from '../db';
import { cattle, clients, userClients, portfolios, users } from '../../drizzle/schema';
import { eq, and, inArray, or, sql, desc, asc } from 'drizzle-orm';
import type { AccessScope } from './permissions';
import { getAccessibleClientIds } from './permissions';

/**
 * Get user's access scope (which clients they can see)
 */
export async function getUserAccessScope(userId: number): Promise<AccessScope | null> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user || user.length === 0) return null;
  
  const userRole = user[0].role;
  
  // Get client IDs based on role
  let clientIds: number[] = [];
  let portfolioClientIds: number[] = [];
  
  if (userRole === 'farmer') {
    // Get farms owned/managed by this farmer
    const userClientRecords = await db
      .select({ clientId: userClients.clientId })
      .from(userClients)
      .where(eq(userClients.userId, userId));
    
    clientIds = userClientRecords.map(r => r.clientId);
  } else if (userRole === 'bank' || userRole === 'investor') {
    // Get portfolio for this financier
    const portfolioRecords = await db
      .select({ clientId: portfolios.clientId })
      .from(portfolios)
      .where(and(
        eq(portfolios.userId, userId),
        eq(portfolios.active, true)
      ));
    
    portfolioClientIds = portfolioRecords.map(r => r.clientId);
  }
  
  return {
    role: userRole,
    userId,
    clientIds,
    portfolioClientIds,
  };
}

/**
 * Get cattle with row-level security
 */
export interface CattleFilters {
  clientId?: number;
  healthStatus?: string;
  breed?: string;
  sex?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getCattleWithRLS(
  scope: AccessScope,
  filters: CattleFilters = {}
) {
  const accessibleClientIds = getAccessibleClientIds(scope);
  
  // Build where conditions
  const conditions = [];
  
  // Apply row-level security
  if (accessibleClientIds !== 'all') {
    if (accessibleClientIds.length === 0) {
      // User has no access to any clients
      return { cattle: [], total: 0 };
    }
    conditions.push(inArray(cattle.clientId, accessibleClientIds));
  }
  
  // Apply filters
  if (filters.clientId) {
    conditions.push(eq(cattle.clientId, filters.clientId));
  }
  
  if (filters.healthStatus) {
    conditions.push(eq(cattle.healthStatus, filters.healthStatus as any));
  }
  
  if (filters.breed) {
    conditions.push(eq(cattle.breed, filters.breed));
  }
  
  if (filters.sex) {
    conditions.push(eq(cattle.sex, filters.sex as any));
  }
  
  if (filters.search) {
    conditions.push(
      or(
        sql`${cattle.visualId} ILIKE ${`%${filters.search}%`}`,
        sql`${cattle.nlisId} ILIKE ${`%${filters.search}%`}`
      )
    );
  }
  
  // Get total count
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(cattle)
    .where(and(...conditions));
  
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count || 0);
  
  // Get cattle with pagination
  const query = db
    .select()
    .from(cattle)
    .where(and(...conditions))
    .orderBy(desc(cattle.createdAt))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);
  
  const cattleRecords = await query;
  
  return {
    cattle: cattleRecords,
    total,
  };
}

/**
 * Get single cattle with permission check
 */
export async function getCattleByIdWithRLS(
  cattleId: number,
  scope: AccessScope
) {
  const accessibleClientIds = getAccessibleClientIds(scope);
  
  const cattleRecord = await db
    .select()
    .from(cattle)
    .where(eq(cattle.id, cattleId))
    .limit(1);
  
  if (!cattleRecord || cattleRecord.length === 0) {
    return null;
  }
  
  const cow = cattleRecord[0];
  
  // Check if user has access to this cattle's client
  if (accessibleClientIds !== 'all') {
    if (!accessibleClientIds.includes(cow.clientId)) {
      throw new Error('Access denied: You do not have permission to view this cattle');
    }
  }
  
  return cow;
}

/**
 * Get clients (farms) with row-level security
 */
export async function getClientsWithRLS(scope: AccessScope) {
  const accessibleClientIds = getAccessibleClientIds(scope);
  
  if (accessibleClientIds === 'all') {
    return await db.select().from(clients).orderBy(asc(clients.name));
  }
  
  if (accessibleClientIds.length === 0) {
    return [];
  }
  
  return await db
    .select()
    .from(clients)
    .where(inArray(clients.id, accessibleClientIds))
    .orderBy(asc(clients.name));
}

/**
 * Get portfolio summary for financiers
 */
export async function getPortfolioSummary(scope: AccessScope) {
  if (scope.role !== 'bank' && scope.role !== 'investor') {
    throw new Error('Access denied: Portfolio summary is only available for financiers');
  }
  
  const accessibleClientIds = getAccessibleClientIds(scope);
  
  if (accessibleClientIds === 'all' || accessibleClientIds.length === 0) {
    return {
      totalFarms: 0,
      totalCattle: 0,
      totalValue: 0,
      farms: [],
    };
  }
  
  // Get farms in portfolio
  const farms = await db
    .select()
    .from(clients)
    .where(inArray(clients.id, accessibleClientIds));
  
  // Get cattle count and value per farm
  const cattleStats = await db
    .select({
      clientId: cattle.clientId,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(${cattle.currentValuation})`,
    })
    .from(cattle)
    .where(inArray(cattle.clientId, accessibleClientIds))
    .groupBy(cattle.clientId);
  
  const farmStats = farms.map(farm => {
    const stats = cattleStats.find(s => s.clientId === farm.id);
    return {
      ...farm,
      cattleCount: Number(stats?.count || 0),
      totalValue: Number(stats?.totalValue || 0),
    };
  });
  
  return {
    totalFarms: farms.length,
    totalCattle: cattleStats.reduce((sum, s) => sum + Number(s.count), 0),
    totalValue: cattleStats.reduce((sum, s) => sum + Number(s.totalValue || 0), 0),
    farms: farmStats,
  };
}

/**
 * Check if user can perform action on cattle
 */
export async function canModifyCattle(
  cattleId: number,
  scope: AccessScope
): Promise<boolean> {
  try {
    const cow = await getCattleByIdWithRLS(cattleId, scope);
    return cow !== null;
  } catch {
    return false;
  }
}

/**
 * Batch check cattle access
 */
export async function canModifyBatchCattle(
  cattleIds: number[],
  scope: AccessScope
): Promise<{ allowed: number[]; denied: number[] }> {
  const accessibleClientIds = getAccessibleClientIds(scope);
  
  const cattleRecords = await db
    .select({ id: cattle.id, clientId: cattle.clientId })
    .from(cattle)
    .where(inArray(cattle.id, cattleIds));
  
  const allowed: number[] = [];
  const denied: number[] = [];
  
  for (const cow of cattleRecords) {
    if (accessibleClientIds === 'all' || accessibleClientIds.includes(cow.clientId)) {
      allowed.push(cow.id);
    } else {
      denied.push(cow.id);
    }
  }
  
  return { allowed, denied };
}
