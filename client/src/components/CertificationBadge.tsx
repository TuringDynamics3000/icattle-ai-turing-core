/**
 * iCattle Certified Badge Component
 * 
 * Displays certification tier with icon and color coding
 */

import { Badge } from "@/components/ui/badge";
import type { CertificationTier } from "../../../server/_core/certificationScoring";

interface CertificationBadgeProps {
  tier: CertificationTier;
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CertificationBadge({ 
  tier, 
  score, 
  showScore = false,
  size = 'md'
}: CertificationBadgeProps) {
  const getColor = () => {
    switch (tier) {
      case 'GOLD':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-700';
      case 'SILVER':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-600';
      case 'BRONZE':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-orange-700';
      case 'NON_CERTIFIED':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getIcon = () => {
    switch (tier) {
      case 'GOLD':
        return '🏆';
      case 'SILVER':
        return '🥈';
      case 'BRONZE':
        return '🥉';
      case 'NON_CERTIFIED':
        return '⚠️';
    }
  };

  const getLabel = () => {
    switch (tier) {
      case 'GOLD':
        return 'Gold Certified';
      case 'SILVER':
        return 'Silver Certified';
      case 'BRONZE':
        return 'Bronze Certified';
      case 'NON_CERTIFIED':
        return 'Not Certified';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge 
      className={`${getColor()} ${sizeClasses[size]} font-semibold border-2`}
      variant="outline"
    >
      <span className="mr-1">{getIcon()}</span>
      {getLabel()}
      {showScore && <span className="ml-2 opacity-90">({score}%)</span>}
    </Badge>
  );
}

/**
 * Certification tier explanation tooltip content
 */
export function getCertificationExplanation(tier: CertificationTier): string {
  switch (tier) {
    case 'GOLD':
      return 'Gold Certified (95-100%): Biometric verification + NLIS + GPS + Complete event history. Unforgeable identity with 100% accuracy. Eligible for 100% LTV loans.';
    case 'SILVER':
      return 'Silver Certified (80-94%): Biometric verification + NLIS + Partial GPS. Strong provenance confidence. Eligible for 85% LTV loans.';
    case 'BRONZE':
      return 'Bronze Certified (65-79%): NLIS + Partial verification. Basic provenance confidence. Eligible for 70% LTV loans.';
    case 'NON_CERTIFIED':
      return 'Not Certified (<65%): Incomplete verification. High fraud risk. Not eligible for livestock-backed loans.';
  }
}
