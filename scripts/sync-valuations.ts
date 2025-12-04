#!/usr/bin/env tsx
/**
 * Sync Valuations to Cattle Records
 * Updates cattle.currentValuation from the valuations table
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cattle, valuations } from '../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

async function syncValuations() {
  console.log('🔄 Syncing valuations to cattle records...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  try {
    // Get all cattle
    const allCattle = await db.select().from(cattle);
    console.log(`📊 Found ${allCattle.length} cattle records\n`);

    let updated = 0;
    let skipped = 0;

    for (const cow of allCattle) {
      // Get the most recent valuation for this cattle
      const [latestValuation] = await db
        .select()
        .from(valuations)
        .where(eq(valuations.cattleId, cow.id))
        .orderBy(desc(valuations.valuationDate))
        .limit(1);

      if (latestValuation) {
        // Update cattle with the valuation
        await db
          .update(cattle)
          .set({ 
            currentValuation: latestValuation.valuationAmount,
          })
          .where(eq(cattle.id, cow.id));
        
        updated++;
        
        if (updated % 50 === 0) {
          console.log(`   ✅ Updated ${updated}/${allCattle.length} cattle...`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   - Updated: ${updated} cattle`);
    console.log(`   - Skipped: ${skipped} cattle (no valuation found)`);

    // Verify the update
    const cattleWithValues = await db
      .select({ count: sql<number>`count(*)` })
      .from(cattle)
      .where(sql`${cattle.currentValuation} IS NOT NULL`);

    console.log(`\n📊 Verification:`);
    console.log(`   - Cattle with valuations: ${cattleWithValues[0].count}`);

    // Calculate total portfolio value
    const portfolioValue = await db
      .select({
        totalValue: sql<number>`SUM(${cattle.currentValuation})`,
        avgValue: sql<number>`AVG(${cattle.currentValuation})`,
      })
      .from(cattle)
      .where(sql`${cattle.currentValuation} IS NOT NULL`);

    const formatCurrency = (cents: number | null) => {
      if (!cents) return 'N/A';
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(cents / 100);
    };

    console.log(`\n💰 Portfolio Value:`);
    console.log(`   - Total: ${formatCurrency(portfolioValue[0].totalValue)}`);
    console.log(`   - Average per head: ${formatCurrency(portfolioValue[0].avgValue)}`);

    console.log(`\n🎉 Dashboard should now display cattle values!`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

syncValuations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
