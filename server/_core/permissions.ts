/**
 * Role-Based Access Control (RBAC) for iCattle
 * ==============================================
 * Enforces permissions for farmer, financier, and ops portal roles
 * All access attempts are logged with Turing Protocol V2 signatures
 */

import { TRPCError } from '@trpc/server';
import { signEvent } from './turingProtocolV2';

export type Role = 'user' | 'admin' | 'farmer' | 'bank' | 'investor';

export type Permission =
  | 'cattle:read'
  | 'cattle:create'
  | 'cattle:update'
  | 'cattle:delete'
  | 'cattle:export'
  | 'cattle:batch_operations'
  | 'valuation:read'
  | 'valuation:create'
  | 'valuation:update'
  | 'events:read'
  | 'events:create'
  | 'financial:read'
  | 'financial:update'
  | 'admin:all';

/**
 * Permission matrix by role
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Farm owner - full access to their own cattle
  farmer: [
    'cattle:read',
    'cattle:create',
    'cattle:update',
    'cattle:delete',
    'cattle:export',
    'cattle:batch_operations',
    'valuation:read',
    'events:read',
    'events:create',
    'financial:read',
  ],
  
  // Bank/Financier - read-only + valuation updates for their portfolio
  bank: [
    'cattle:read',
    'cattle:export',
    'valuation:read',
    'valuation:create',
    'valuation:update',
    'events:read',
    'financial:read',
  ],
  
  // Investor - similar to bank
  investor: [
    'cattle:read',
    'cattle:export',
    'valuation:read',
    'events:read',
    'financial:read',
  ],
  
  // Admin/Ops Portal - full access to everything
  admin: [
    'admin:all',
    'cattle:read',
    'cattle:create',
    'cattle:update',
    'cattle:delete',
    'cattle:export',
    'cattle:batch_operations',
    'valuation:read',
    'valuation:create',
    'valuation:update',
    'events:read',
    'events:create',
    'financial:read',
    'financial:update',
  ],
  
  // Regular user - minimal access
  user: [
    'cattle:read',
    'events:read',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  // Admin has all permissions
  if (permissions.includes('admin:all')) return true;
  
  return permissions.includes(permission);
}

/**
 * Assert that user has permission, throw TRPCError if not
 * Logs access attempt with Turing Protocol V2
 */
export async function requirePermission(
  userId: number | null | undefined,
  role: Role | null | undefined,
  permission: Permission,
  resourceId?: string | number,
  publicKey?: string,
  privateKey?: string
): Promise<void> {
  const hasAccess = hasPermission(role, permission);
  
  // Log access attempt with Turing Protocol V2
  if (publicKey && privateKey) {
    try {
      const accessEvent = {
        event_type: 'access_control_check',
        user_id: userId || 0,
        role: role || 'unknown',
        permission,
        resource_id: resourceId?.toString(),
        granted: hasAccess,
        timestamp: new Date().toISOString(),
      };
      
      await signEvent(
        accessEvent,
        'access_control',
        publicKey,
        privateKey
      );
    } catch (error) {
      console.error('[RBAC] Failed to log access attempt:', error);
    }
  }
  
  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Permission denied: ${permission} (role: ${role || 'none'})`,
    });
  }
}

/**
 * Get cattle IDs that a user can access based on their role
 */
export interface AccessScope {
  role: Role;
  userId: number;
  clientIds?: number[]; // For farmers: their farm(s)
  portfolioClientIds?: number[]; // For banks/investors: their portfolio
}

export function getAccessibleClientIds(scope: AccessScope): number[] | 'all' {
  switch (scope.role) {
    case 'admin':
      // Admin sees all
      return 'all';
      
    case 'farmer':
      // Farmer sees only their farm(s)
      return scope.clientIds || [];
      
    case 'bank':
    case 'investor':
      // Financier sees only their portfolio
      return scope.portfolioClientIds || [];
      
    case 'user':
    default:
      // Regular users see nothing by default
      return [];
  }
}

/**
 * Check if user can access a specific client (farm)
 */
export function canAccessClient(scope: AccessScope, clientId: number): boolean {
  const accessibleIds = getAccessibleClientIds(scope);
  
  if (accessibleIds === 'all') return true;
  
  return accessibleIds.includes(clientId);
}

/**
 * Filter cattle list based on user's access scope
 */
export function applyCattleAccessFilter<T extends { clientId: number }>(
  cattle: T[],
  scope: AccessScope
): T[] {
  const accessibleIds = getAccessibleClientIds(scope);
  
  if (accessibleIds === 'all') return cattle;
  
  return cattle.filter(c => accessibleIds.includes(c.clientId));
}

/**
 * Get UI features that should be visible for a role
 */
export interface UIFeatures {
  showFarmFilter: boolean;
  showCreateCattle: boolean;
  showDeleteCattle: boolean;
  showBatchOperations: boolean;
  showFinancialReports: boolean;
  showAdminPanel: boolean;
  showExport: boolean;
  canEditValuation: boolean;
  canEditCattle: boolean;
}

export function getUIFeatures(role: Role | null | undefined): UIFeatures {
  if (!role) {
    return {
      showFarmFilter: false,
      showCreateCattle: false,
      showDeleteCattle: false,
      showBatchOperations: false,
      showFinancialReports: false,
      showAdminPanel: false,
      showExport: false,
      canEditValuation: false,
      canEditCattle: false,
    };
  }
  
  return {
    showFarmFilter: role === 'admin' || role === 'bank' || role === 'investor',
    showCreateCattle: hasPermission(role, 'cattle:create'),
    showDeleteCattle: hasPermission(role, 'cattle:delete'),
    showBatchOperations: hasPermission(role, 'cattle:batch_operations'),
    showFinancialReports: hasPermission(role, 'financial:read'),
    showAdminPanel: role === 'admin',
    showExport: hasPermission(role, 'cattle:export'),
    canEditValuation: hasPermission(role, 'valuation:update'),
    canEditCattle: hasPermission(role, 'cattle:update'),
  };
}

/**
 * Audit log for permission checks
 */
export interface PermissionAuditLog {
  timestamp: string;
  userId: number;
  role: Role;
  permission: Permission;
  resourceId?: string | number;
  granted: boolean;
  signature?: string;
}

const auditLogs: PermissionAuditLog[] = [];

export function logPermissionCheck(log: PermissionAuditLog): void {
  auditLogs.push(log);
  
  // Keep only last 10,000 logs in memory
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }
}

export function getAuditLogs(userId?: number, limit: number = 100): PermissionAuditLog[] {
  let logs = auditLogs;
  
  if (userId) {
    logs = logs.filter(l => l.userId === userId);
  }
  
  return logs.slice(-limit).reverse();
}
