/**
 * tRPC Middleware for RBAC Enforcement
 * =====================================
 * Injects user's access scope into tRPC context
 * Logs all access attempts with Turing Protocol V2
 */

import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import { getUserAccessScope } from './rbac-queries';
import type { AccessScope } from './permissions';
import { signEvent } from './turingProtocolV2';

/**
 * Extended context with access scope
 */
export interface RBACContext {
  accessScope: AccessScope | null;
  userId: number | null;
}

/**
 * Middleware to inject access scope into context
 * This runs on every tRPC request
 */
export const withAccessScope = middleware(async ({ ctx, next, path, type }) => {
  let accessScope: AccessScope | null = null;
  
  // Get user ID from context (assumes authentication middleware has run)
  const userId = (ctx as any).userId || (ctx as any).user?.id;
  
  if (userId) {
    try {
      accessScope = await getUserAccessScope(userId);
    } catch (error) {
      console.error('[RBAC] Failed to get access scope:', error);
    }
  }
  
  // Log access attempt with Turing Protocol V2
  try {
    const accessEvent = {
      event_type: 'api_access',
      user_id: userId || 0,
      role: accessScope?.role || 'anonymous',
      endpoint: path,
      request_type: type,
      timestamp: new Date().toISOString(),
    };
    
    // Sign the access event (use system keys for now)
    // In production, each user would have their own key pair
    const systemPublicKey = process.env.TURING_PUBLIC_KEY || '';
    const systemPrivateKey = process.env.TURING_PRIVATE_KEY || '';
    
    if (systemPublicKey && systemPrivateKey) {
      await signEvent(
        accessEvent,
        'api_access',
        systemPublicKey,
        systemPrivateKey
      );
    }
  } catch (error) {
    console.error('[RBAC] Failed to log API access:', error);
  }
  
  return next({
    ctx: {
      ...ctx,
      accessScope,
      userId,
    } as any,
  });
});

/**
 * Middleware to require authentication
 */
export const requireAuth = middleware(async ({ ctx, next }) => {
  const userId = (ctx as any).userId;
  
  if (!userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
  return next();
});

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return middleware(async ({ ctx, next }) => {
    const accessScope = (ctx as any).accessScope as AccessScope | null;
    
    if (!accessScope) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
    
    if (!allowedRoles.includes(accessScope.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied: Requires one of [${allowedRoles.join(', ')}], but user has role: ${accessScope.role}`,
      });
    }
    
    return next();
  });
}

/**
 * Middleware to log all mutations with Turing Protocol V2
 */
export const logMutation = middleware(async ({ ctx, next, path, type, rawInput }) => {
  const startTime = Date.now();
  const userId = (ctx as any).userId;
  const accessScope = (ctx as any).accessScope as AccessScope | null;
  
  try {
    const result = await next();
    const duration = Date.now() - startTime;
    
    // Log successful mutation
    const mutationEvent = {
      event_type: 'mutation_executed',
      user_id: userId || 0,
      role: accessScope?.role || 'anonymous',
      endpoint: path,
      input: rawInput,
      success: true,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };
    
    const systemPublicKey = process.env.TURING_PUBLIC_KEY || '';
    const systemPrivateKey = process.env.TURING_PRIVATE_KEY || '';
    
    if (systemPublicKey && systemPrivateKey) {
      await signEvent(
        mutationEvent,
        'mutation',
        systemPublicKey,
        systemPrivateKey
      );
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failed mutation
    const mutationEvent = {
      event_type: 'mutation_failed',
      user_id: userId || 0,
      role: accessScope?.role || 'anonymous',
      endpoint: path,
      input: rawInput,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };
    
    const systemPublicKey = process.env.TURING_PUBLIC_KEY || '';
    const systemPrivateKey = process.env.TURING_PRIVATE_KEY || '';
    
    if (systemPublicKey && systemPrivateKey) {
      try {
        await signEvent(
          mutationEvent,
          'mutation',
          systemPublicKey,
          systemPrivateKey
        );
      } catch (logError) {
        console.error('[RBAC] Failed to log mutation failure:', logError);
      }
    }
    
    throw error;
  }
});
