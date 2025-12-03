/**
 * BREED PREMIUM MULTIPLIERS
 * 
 * Applies breed-specific premiums to generic MLA market prices
 * Based on Australian cattle market research (December 2025)
 */

export type BreedName = 
  | 'Wagyu'
  | 'Angus'
  | 'Hereford'
  | 'Murray Grey'
  | 'Charolais'
  | 'Limousin'
  | 'Simmental'
  | 'Brahman'
  | 'Droughtmaster'
  | 'Santa Gertrudis'
  | 'Shorthorn'
  | 'Speckle Park'
  | 'Generic';

export type CattleCategory = 'Steer' | 'Heifer' | 'Bull' | 'Cow';

/**
 * Breed premium multipliers relative to generic MLA prices
 * 
 * Research sources:
 * - Wagyu: Premium marbling genetics, export demand (+35-45%)
 * - Angus: Consistent quality, brand recognition (+12-18%)
 * - Hereford: Baseline British breed (+5-10%)
 * - Murray Grey: Tender meat, moderate frame (+8-12%)
 * - European breeds (Charolais, Limousin, Simmental): Growth rate, yield (+10-15%)
 * - Tropical breeds (Brahman, Droughtmaster, Santa Gertrudis): Heat tolerance, tick resistance (+0-5%)
 * - Shorthorn: Dual purpose, moderate premium (+5-8%)
 * - Speckle Park: Emerging premium, marbling (+15-20%)
 */
const BREED_PREMIUMS: Record<BreedName, number> = {
  'Wagyu': 1.40,          // +40% premium (high marbling, export demand)
  'Angus': 1.15,          // +15% premium (consistent quality, brand)
  'Speckle Park': 1.18,   // +18% premium (emerging premium, marbling)
  'Murray Grey': 1.10,    // +10% premium (tender meat)
  'Charolais': 1.12,      // +12% premium (growth rate, yield)
  'Limousin': 1.13,       // +13% premium (lean meat, yield)
  'Simmental': 1.11,      // +11% premium (growth, milk)
  'Hereford': 1.07,       // +7% premium (baseline British)
  'Shorthorn': 1.06,      // +6% premium (dual purpose)
  'Brahman': 1.02,        // +2% premium (tropical adaptation)
  'Droughtmaster': 1.03,  // +3% premium (drought tolerance)
  'Santa Gertrudis': 1.04, // +4% premium (heat tolerance)
  'Generic': 1.00,        // Baseline (no premium)
};

/**
 * Category-specific adjustments
 * Bulls and breeding stock have additional premiums for genetics
 */
const CATEGORY_ADJUSTMENTS: Record<CattleCategory, number> = {
  'Steer': 1.00,   // Baseline (market cattle)
  'Heifer': 0.98,  // Slightly lower than steers
  'Bull': 1.25,    // +25% for breeding genetics
  'Cow': 0.92,     // Lower than steers (older, breeding stock)
};

/**
 * Calculate breed-adjusted market price
 * 
 * @param base_price - Generic MLA market price ($/kg)
 * @param breed - Cattle breed
 * @param category - Cattle category (Steer/Heifer/Bull/Cow)
 * @returns Breed-adjusted price ($/kg)
 */
export function calculateBreedAdjustedPrice(
  base_price: number,
  breed: string,
  category: CattleCategory
): number {
  // Normalize breed name
  const normalized_breed = normalizeBreedName(breed);
  
  // Get breed premium (default to Generic if unknown)
  const breed_premium = BREED_PREMIUMS[normalized_breed] || BREED_PREMIUMS['Generic'];
  
  // Get category adjustment
  const category_adjustment = CATEGORY_ADJUSTMENTS[category] || 1.00;
  
  // Calculate adjusted price
  const adjusted_price = base_price * breed_premium * category_adjustment;
  
  return Math.round(adjusted_price * 100) / 100; // Round to 2 decimal places
}

/**
 * Get breed premium percentage
 * 
 * @param breed - Cattle breed
 * @returns Premium percentage (e.g., 0.40 for Wagyu = 40%)
 */
export function getBreedPremiumPercentage(breed: string): number {
  const normalized_breed = normalizeBreedName(breed);
  const multiplier = BREED_PREMIUMS[normalized_breed] || BREED_PREMIUMS['Generic'];
  return multiplier - 1.00;
}

/**
 * Get category adjustment percentage
 * 
 * @param category - Cattle category
 * @returns Adjustment percentage (e.g., 0.25 for Bull = +25%)
 */
export function getCategoryAdjustmentPercentage(category: CattleCategory): number {
  const multiplier = CATEGORY_ADJUSTMENTS[category] || 1.00;
  return multiplier - 1.00;
}

/**
 * Normalize breed name to match known breeds
 */
function normalizeBreedName(breed: string): BreedName {
  const normalized = breed.trim();
  
  // Direct match
  if (normalized in BREED_PREMIUMS) {
    return normalized as BreedName;
  }
  
  // Case-insensitive match
  const lower = normalized.toLowerCase();
  for (const known_breed of Object.keys(BREED_PREMIUMS)) {
    if (known_breed.toLowerCase() === lower) {
      return known_breed as BreedName;
    }
  }
  
  // Partial match (e.g., "Black Angus" → "Angus")
  for (const known_breed of Object.keys(BREED_PREMIUMS)) {
    if (lower.includes(known_breed.toLowerCase())) {
      return known_breed as BreedName;
    }
  }
  
  // Default to Generic
  return 'Generic';
}

/**
 * Get all breed premiums for display
 */
export function getAllBreedPremiums(): Array<{ breed: BreedName; premium: number; percentage: string }> {
  return Object.entries(BREED_PREMIUMS).map(([breed, multiplier]) => ({
    breed: breed as BreedName,
    premium: multiplier,
    percentage: `${((multiplier - 1) * 100).toFixed(0)}%`,
  })).sort((a, b) => b.premium - a.premium); // Sort by premium descending
}

/**
 * Calculate total market value with breed premiums for a cattle
 */
export function calculateBreedAdjustedMarketValue(
  base_price_per_kg: number,
  weight_kg: number,
  breed: string,
  category: CattleCategory
): number {
  const adjusted_price_per_kg = calculateBreedAdjustedPrice(base_price_per_kg, breed, category);
  const total_value = adjusted_price_per_kg * weight_kg;
  return Math.round(total_value * 100) / 100;
}

/**
 * Export for use in market pricing
 */
export const BreedPremiums = {
  calculateAdjustedPrice: calculateBreedAdjustedPrice,
  calculateAdjustedValue: calculateBreedAdjustedMarketValue,
  getBreedPremium: getBreedPremiumPercentage,
  getCategoryAdjustment: getCategoryAdjustmentPercentage,
  getAllPremiums: getAllBreedPremiums,
};
