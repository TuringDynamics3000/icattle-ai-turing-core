/**
 * tRPC RBAC Helper Functions
 * ===========================
 * Helper functions for RBAC enforcement in tRPC routers
 * Use these in your router procedures to check permissions
 */

import { TRPCError } from '@trpc/server';
import { getUserAccessScope } from './rbac-queries';
import type { AccessScope } from './permissions';

/**
 * Extended context with access scope
 */
export interface RBACContext {
  accessScope: AccessScope | null;
  userId: number | null;
}

/**
 * Get access scope for a user (call this in your procedures)
 */
export async function getAccessScopeForUser(userId: number): Promise<AccessScope | null> {
  try {
    return await getUserAccessScope(userId);
  } catch (error) {
    console.error('[RBAC] Failed to get access scope:', error);
    return null;
  }
}

/**
 * Require authentication and throw if not authenticated
 */
export function requireAuthentication(ctx: any): number {
  const userId = ctx.userId || ctx.user?.id;
  
  if (!userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
  return userId;
}

/**
 * Check if user has permission for an action
 */
export function checkPermission(
  accessScope: AccessScope | null,
  permission: string
): boolean {
  if (!accessScope) return false;
  
  // Admin has all permissions
  if (accessScope.role === 'admin') return true;
  
  // Define role-based permissions
  const rolePermissions: Record<string, string[]> = {
    farmer: [
      'cattle:read',
      'cattle:create',
      'cattle:update',
      'cattle:delete',
      'cattle:export',
      'cattle:batch_operations',
      'events:read',
      'events:create',
    ],
    bank: [
      'cattle:read',
      'cattle:export',
      'valuation:read',
      'valuation:create',
      'valuation:update',
      'events:read',
      'financial:read',
    ],
    investor: [
      'cattle:read',
      'cattle:export',
      'valuation:read',
      'events:read',
      'financial:read',
    ],
  };
  
  const permissions = rolePermissions[accessScope.role] || [];
  return permissions.includes(permission);
}

/**
 * Require specific permission or throw
 */
export function requirePermission(
  accessScope: AccessScope | null,
  permission: string
): void {
  if (!checkPermission(accessScope, permission)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Permission denied: ${permission} required`,
    });
  }
}
