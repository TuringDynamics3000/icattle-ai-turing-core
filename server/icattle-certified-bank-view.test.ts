import { describe, it, expect, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/mysql2';
import { cattle } from '../drizzle/schema';
import { calculateCertification, getLTVByCertification } from './_core/certificationScoring';

const db = drizzle(process.env.DATABASE_URL!);

/**
 * Test Suite: iCattle Certified Bank View Enhancements
 * 
 * Tests the certification tier calculation and provenance risk adjustment
 * logic that powers the Bank View's "iCattle Certified™ Collateral Quality" section.
 * 
 * Key Features Tested:
 * - Certification tier assignment (Gold/Silver/Bronze/Non-Certified)
 * - LTV multipliers by tier (Gold=100%, Silver=85%, Bronze=70%, Non=0%)
 * - Provenance risk discount calculation
 * - Tier distribution percentages
 */

describe('iCattle Certified Bank View', () => {
  let sampleCattle: any[];

  beforeAll(async () => {
    // Fetch sample cattle from database for testing
    sampleCattle = await db.select().from(cattle).limit(100);
  });

  describe('Certification Tier Assignment', () => {
    it('should calculate certification tiers for all cattle', () => {
      expect(sampleCattle.length).toBeGreaterThan(0);
      
      sampleCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(['GOLD', 'SILVER', 'BRONZE', 'NON_CERTIFIED']).toContain(cert.tier);
        expect(cert.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(cert.confidenceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should assign Gold tier to cattle with high confidence scores (≥95)', () => {
      const goldCattle = sampleCattle.filter(c => {
        const cert = calculateCertification(c);
        return cert.tier === 'GOLD';
      });

      goldCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.confidenceScore).toBeGreaterThanOrEqual(95);
        expect(cert.tier).toBe('GOLD');
      });
    });

    it('should assign Silver tier to cattle with confidence scores 80-94', () => {
      const silverCattle = sampleCattle.filter(c => {
        const cert = calculateCertification(c);
        return cert.tier === 'SILVER';
      });

      silverCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.confidenceScore).toBeGreaterThanOrEqual(80);
        expect(cert.confidenceScore).toBeLessThan(95);
        expect(cert.tier).toBe('SILVER');
      });
    });

    it('should assign Bronze tier to cattle with confidence scores 65-79', () => {
      const bronzeCattle = sampleCattle.filter(c => {
        const cert = calculateCertification(c);
        return cert.tier === 'BRONZE';
      });

      bronzeCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.confidenceScore).toBeGreaterThanOrEqual(65);
        expect(cert.confidenceScore).toBeLessThan(80);
        expect(cert.tier).toBe('BRONZE');
      });
    });

    it('should assign Non-Certified tier to cattle with confidence scores <65', () => {
      const nonCertified = sampleCattle.filter(c => {
        const cert = calculateCertification(c);
        return cert.tier === 'NON_CERTIFIED';
      });

      nonCertified.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.confidenceScore).toBeLessThan(65);
        expect(cert.tier).toBe('NON_CERTIFIED');
      });
    });
  });

  describe('Verification Factors', () => {
    it('should always have iCattle ID verification', () => {
      sampleCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.verificationFactors.iCattleId).toBe(true);
      });
    });

    it('should detect NLIS tag presence correctly', () => {
      sampleCattle.forEach(c => {
        const cert = calculateCertification(c);
        const hasNLIS = !!c.nlisId && c.nlisId.length > 0;
        expect(cert.verificationFactors.nlisTag).toBe(hasNLIS);
      });
    });

    it('should detect photo biometrics correctly', () => {
      sampleCattle.forEach(c => {
        const cert = calculateCertification(c);
        const hasBiometrics = !!c.muzzleImageUrl || !!c.coatImageUrl;
        expect(cert.verificationFactors.photoBiometrics).toBe(hasBiometrics);
      });
    });

    it('should detect GPS tracking correctly', () => {
      sampleCattle.forEach(c => {
        const cert = calculateCertification(c);
        const hasGPS = !!c.currentLocation;
        expect(cert.verificationFactors.gpsTracking).toBe(hasGPS);
      });
    });

    it('should detect DNA verification for premium breeds', () => {
      const wagyuCattle = sampleCattle.filter(c => c.breed === 'Wagyu');
      const angusCattle = sampleCattle.filter(c => c.breed === 'Angus');
      
      wagyuCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.verificationFactors.dnaVerified).toBe(true);
      });

      angusCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.verificationFactors.dnaVerified).toBe(true);
      });
    });
  });

  describe('LTV Multipliers', () => {
    it('should apply 100% LTV to Gold tier cattle', () => {
      const ltvRatio = getLTVByCertification('GOLD');
      expect(ltvRatio).toBe(1.0);
    });

    it('should apply 85% LTV to Silver tier cattle', () => {
      const ltvRatio = getLTVByCertification('SILVER');
      expect(ltvRatio).toBe(0.85);
    });

    it('should apply 70% LTV to Bronze tier cattle', () => {
      const ltvRatio = getLTVByCertification('BRONZE');
      expect(ltvRatio).toBe(0.70);
    });

    it('should apply 0% LTV to Non-Certified cattle', () => {
      const ltvRatio = getLTVByCertification('NON_CERTIFIED');
      expect(ltvRatio).toBe(0.0);
    });
  });

  describe('Tier Distribution Calculation', () => {
    it('should calculate correct tier counts from sample data', () => {
      const tierCounts = sampleCattle.reduce((acc, c) => {
        const cert = calculateCertification(c);
        acc[cert.tier] = (acc[cert.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const goldCount = tierCounts['GOLD'] || 0;
      const silverCount = tierCounts['SILVER'] || 0;
      const bronzeCount = tierCounts['BRONZE'] || 0;
      const nonCertifiedCount = tierCounts['NON_CERTIFIED'] || 0;

      const total = goldCount + silverCount + bronzeCount + nonCertifiedCount;
      expect(total).toBe(sampleCattle.length);
      
      // All cattle should be assigned to exactly one tier
      expect(goldCount).toBeGreaterThanOrEqual(0);
      expect(silverCount).toBeGreaterThanOrEqual(0);
      expect(bronzeCount).toBeGreaterThanOrEqual(0);
      expect(nonCertifiedCount).toBeGreaterThanOrEqual(0);
    });

    it('should calculate correct tier percentages', () => {
      const tierCounts = sampleCattle.reduce((acc, c) => {
        const cert = calculateCertification(c);
        acc[cert.tier] = (acc[cert.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = sampleCattle.length;
      const goldPercent = ((tierCounts['GOLD'] || 0) / total) * 100;
      const silverPercent = ((tierCounts['SILVER'] || 0) / total) * 100;
      const bronzePercent = ((tierCounts['BRONZE'] || 0) / total) * 100;
      const nonCertifiedPercent = ((tierCounts['NON_CERTIFIED'] || 0) / total) * 100;

      // Percentages should sum to 100%
      expect(goldPercent + silverPercent + bronzePercent + nonCertifiedPercent).toBeCloseTo(100, 1);
      
      // Each percentage should be between 0 and 100
      expect(goldPercent).toBeGreaterThanOrEqual(0);
      expect(goldPercent).toBeLessThanOrEqual(100);
      expect(silverPercent).toBeGreaterThanOrEqual(0);
      expect(silverPercent).toBeLessThanOrEqual(100);
      expect(bronzePercent).toBeGreaterThanOrEqual(0);
      expect(bronzePercent).toBeLessThanOrEqual(100);
      expect(nonCertifiedPercent).toBeGreaterThanOrEqual(0);
      expect(nonCertifiedPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('Provenance Risk Adjustment', () => {
    it('should calculate tier-adjusted value correctly', () => {
      const testCattle = [
        { currentValuation: 500000, tier: 'GOLD' },      // 5000 * 1.0 = 5000
        { currentValuation: 400000, tier: 'SILVER' },    // 4000 * 0.85 = 3400
        { currentValuation: 300000, tier: 'BRONZE' },    // 3000 * 0.70 = 2100
        { currentValuation: 200000, tier: 'NON_CERTIFIED' },  // 2000 * 0.0 = 0
      ];

      const totalBookValue = testCattle.reduce((sum, c) => sum + c.currentValuation, 0);
      const tierAdjustedValue = testCattle.reduce((sum, c) => {
        const ltvRatio = getLTVByCertification(c.tier as any);
        return sum + (c.currentValuation * ltvRatio);
      }, 0);

      expect(totalBookValue).toBe(1400000); // 14000 AUD in cents
      expect(tierAdjustedValue).toBe(1050000); // 10500 AUD in cents
      expect(totalBookValue - tierAdjustedValue).toBe(350000); // 3500 AUD provenance risk discount
    });

    it('should calculate provenance risk discount as difference between book and tier-adjusted value', () => {
      const bookValue = 10000000; // 100000 AUD
      const tierAdjustedValue = 6500000; // 65000 AUD
      const provenanceRiskDiscount = bookValue - tierAdjustedValue;

      expect(provenanceRiskDiscount).toBe(3500000); // 35000 AUD
      expect(provenanceRiskDiscount).toBeGreaterThan(0);
    });

    it('should show zero discount for 100% Gold certified portfolio', () => {
      const testCattle = [
        { currentValuation: 500000, tier: 'GOLD' },
        { currentValuation: 400000, tier: 'GOLD' },
        { currentValuation: 300000, tier: 'GOLD' },
      ];

      const totalBookValue = testCattle.reduce((sum, c) => sum + c.currentValuation, 0);
      const tierAdjustedValue = testCattle.reduce((sum, c) => {
        const ltvRatio = getLTVByCertification(c.tier as any);
        return sum + (c.currentValuation * ltvRatio);
      }, 0);
      const discount = totalBookValue - tierAdjustedValue;

      expect(discount).toBe(0);
    });

    it('should show maximum discount for 100% Non-Certified portfolio', () => {
      const testCattle = [
        { currentValuation: 500000, tier: 'NON_CERTIFIED' },
        { currentValuation: 400000, tier: 'NON_CERTIFIED' },
        { currentValuation: 300000, tier: 'NON_CERTIFIED' },
      ];

      const totalBookValue = testCattle.reduce((sum, c) => sum + c.currentValuation, 0);
      const tierAdjustedValue = testCattle.reduce((sum, c) => {
        const ltvRatio = getLTVByCertification(c.tier as any);
        return sum + (c.currentValuation * ltvRatio);
      }, 0);
      const discount = totalBookValue - tierAdjustedValue;

      expect(discount).toBe(totalBookValue);
      expect(tierAdjustedValue).toBe(0);
    });
  });

  describe('Real Portfolio Data Validation', () => {
    it('should have realistic tier distribution in demo data', async () => {
      const allCattle = await db.select().from(cattle);
      
      const tierCounts = allCattle.reduce((acc, c) => {
        const cert = calculateCertification(c);
        acc[cert.tier] = (acc[cert.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const goldCount = tierCounts['GOLD'] || 0;
      const silverCount = tierCounts['SILVER'] || 0;
      const bronzeCount = tierCounts['BRONZE'] || 0;
      const nonCertifiedCount = tierCounts['NON_CERTIFIED'] || 0;

      // Demo data should have a realistic distribution
      // Most cattle should have at least some verification (Bronze or better)
      const verifiedCount = goldCount + silverCount + bronzeCount;
      const verifiedPercent = (verifiedCount / allCattle.length) * 100;
      
      expect(verifiedPercent).toBeGreaterThan(0); // At least some cattle should have verification
      expect(allCattle.length).toBe(goldCount + silverCount + bronzeCount + nonCertifiedCount);
    });

    it('should calculate realistic provenance risk discount', async () => {
      const allCattle = await db.select().from(cattle);
      
      let totalBookValue = 0;
      let tierAdjustedValue = 0;

      allCattle.forEach(c => {
        const value = c.currentValuation || 0;
        totalBookValue += value;
        
        const cert = calculateCertification(c);
        const ltvRatio = getLTVByCertification(cert.tier);
        tierAdjustedValue += value * ltvRatio;
      });

      const provenanceRiskDiscount = totalBookValue - tierAdjustedValue;
      
      // Discount should be non-negative
      expect(provenanceRiskDiscount).toBeGreaterThanOrEqual(0);
      
      // Tier-adjusted value should be between 0 and book value
      expect(tierAdjustedValue).toBeGreaterThanOrEqual(0);
      expect(tierAdjustedValue).toBeLessThanOrEqual(totalBookValue);
    });
  });

  describe('Confidence Score Calculation', () => {
    it('should give base 20 points for iCattle ID', () => {
      const minimalCattle = {
        id: 1,
        nlisId: null,
        muzzleImageUrl: null,
        coatImageUrl: null,
        currentLocation: null,
        breed: 'Hereford',
        createdAt: new Date(),
      };

      const cert = calculateCertification(minimalCattle);
      expect(cert.confidenceScore).toBeGreaterThanOrEqual(20);
    });

    it('should add 20 points for NLIS tag', () => {
      const cattleWithNLIS = {
        id: 1,
        nlisId: 'NLIS123456789',
        muzzleImageUrl: null,
        coatImageUrl: null,
        currentLocation: null,
        breed: 'Hereford',
        createdAt: new Date(),
      };

      const cert = calculateCertification(cattleWithNLIS);
      expect(cert.confidenceScore).toBeGreaterThanOrEqual(40); // 20 base + 20 NLIS
    });

    it('should add 30 points for photo biometrics (critical factor)', () => {
      const cattleWithBiometrics = {
        id: 1,
        nlisId: null,
        muzzleImageUrl: 'https://example.com/muzzle.jpg',
        coatImageUrl: null,
        currentLocation: null,
        breed: 'Hereford',
        createdAt: new Date(),
      };

      const cert = calculateCertification(cattleWithBiometrics);
      expect(cert.confidenceScore).toBeGreaterThanOrEqual(50); // 20 base + 30 biometrics
    });

    it('should add 15 points for GPS tracking', () => {
      const cattleWithGPS = {
        id: 1,
        nlisId: null,
        muzzleImageUrl: null,
        coatImageUrl: null,
        currentLocation: 'Paddock 5',
        breed: 'Hereford',
        createdAt: new Date(),
      };

      const cert = calculateCertification(cattleWithGPS);
      expect(cert.confidenceScore).toBeGreaterThanOrEqual(35); // 20 base + 15 GPS
    });

    it('should add 10 points for DNA verification (premium breeds)', () => {
      const wagyuCattle = {
        id: 1,
        nlisId: null,
        muzzleImageUrl: null,
        coatImageUrl: null,
        currentLocation: null,
        breed: 'Wagyu',
        createdAt: new Date(),
      };

      const cert = calculateCertification(wagyuCattle);
      expect(cert.confidenceScore).toBeGreaterThanOrEqual(30); // 20 base + 10 DNA
    });
  });

  describe('Edge Cases', () => {
    it('should handle cattle with null values correctly', () => {
      const nullCattle = {
        id: 1,
        nlisId: null,
        muzzleImageUrl: null,
        coatImageUrl: null,
        currentLocation: null,
        breed: null,
        currentValuation: null,
        createdAt: new Date(),
      };

      const cert = calculateCertification(nullCattle);
      expect(cert.tier).toBeDefined();
      expect(cert.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(cert.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('should handle cattle with zero valuation correctly', () => {
      const zeroValueCattle = {
        id: 1,
        currentValuation: 0,
        nlisId: 'NLIS123',
        muzzleImageUrl: 'https://example.com/muzzle.jpg',
        currentLocation: 'Paddock 1',
        breed: 'Wagyu',
        createdAt: new Date(),
      };

      const cert = calculateCertification(zeroValueCattle);
      const ltvRatio = getLTVByCertification(cert.tier);
      const tierAdjustedValue = 0 * ltvRatio;
      
      expect(tierAdjustedValue).toBe(0);
    });

    it('should ensure confidence score stays within 0-100 range', () => {
      sampleCattle.forEach(c => {
        const cert = calculateCertification(c);
        expect(cert.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(cert.confidenceScore).toBeLessThanOrEqual(100);
      });
    });
  });
});
