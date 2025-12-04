import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export type Role = 'user' | 'admin' | 'farmer' | 'bank' | 'investor';

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

/**
 * Get UI features based on user role
 * 
 * Farmer: Full cattle management, no farm filter (sees only their farm)
 * Bank/Investor: Read-only + valuations, farm filter (sees portfolio)
 * Admin: Everything, farm filter (sees all)
 */
export function getUIFeaturesForRole(role: Role | null | undefined): UIFeatures {
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

  switch (role) {
    case 'farmer':
      return {
        showFarmFilter: false, // Farmer only sees their farm
        showCreateCattle: true,
        showDeleteCattle: true,
        showBatchOperations: true,
        showFinancialReports: true,
        showAdminPanel: false,
        showExport: true,
        canEditValuation: false, // Farmers can't edit valuations
        canEditCattle: true,
      };

    case 'bank':
    case 'investor':
      return {
        showFarmFilter: true, // Financiers see multiple farms in portfolio
        showCreateCattle: false,
        showDeleteCattle: false,
        showBatchOperations: false,
        showFinancialReports: true,
        showAdminPanel: false,
        showExport: true,
        canEditValuation: role === 'bank', // Only banks can edit valuations
        canEditCattle: false,
      };

    case 'admin':
      return {
        showFarmFilter: true, // Admin sees all farms
        showCreateCattle: true,
        showDeleteCattle: true,
        showBatchOperations: true,
        showFinancialReports: true,
        showAdminPanel: true,
        showExport: true,
        canEditValuation: true,
        canEditCattle: true,
      };

    case 'user':
    default:
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
}

/**
 * Hook to get UI features for current user
 */
export function useRoleFeatures(): {
  features: UIFeatures;
  role: Role | null;
  isLoading: boolean;
} {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  const role = user?.role as Role | null;

  const features = useMemo(() => {
    return getUIFeaturesForRole(role);
  }, [role]);

  return {
    features,
    role: role || null,
    isLoading,
  };
}
