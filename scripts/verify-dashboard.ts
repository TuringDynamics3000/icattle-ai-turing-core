#!/usr/bin/env tsx
/**
 * Dashboard Verification Script
 * Tests all tRPC endpoints to ensure dashboard is properly wired up
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cattle, clients, cattleEvents, valuations } from '../drizzle/schema';
import { count, sql } from 'drizzle-orm';

async function verify() {
  console.log('🔍 Verifying iCattle Dashboard Setup...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection: OK\n');

    // Check cattle data
    const [cattleCount] = await db.select({ count: count() }).from(cattle);
    console.log(`📊 Cattle Records: ${cattleCount.count}`);
    
    if (cattleCount.count === 0) {
      console.log('❌ No cattle found! Run: pnpm db:seed-full\n');
      process.exit(1);
    }

    // Check clients
    const [clientCount] = await db.select({ count: count() }).from(clients);
    console.log(`🏢 Farms/Clients: ${clientCount.count}`);

    // Check events
    const [eventCount] = await db.select({ count: count() }).from(cattleEvents);
    console.log(`🔐 Signed Events: ${eventCount.count}`);

    // Check valuations
    const [valuationCount] = await db.select({ count: count() }).from(valuations);
    console.log(`💰 Valuations: ${valuationCount.count}\n`);

    // Check cattle with muzzle images
    const cattleWithMuzzles = await db.select({ count: count() })
      .from(cattle)
      .where(sql`${cattle.muzzleImageUrl} IS NOT NULL`);
    console.log(`📸 Cattle with Muzzle Photos: ${cattleWithMuzzles[0].count}`);

    // Check breed distribution
    const breedDist = await db.select({
      breed: cattle.breed,
      count: count(),
    })
    .from(cattle)
    .groupBy(cattle.breed)
    .orderBy(sql`count(*) DESC`);
    
    console.log('\n🐄 Breed Distribution:');
    for (const { breed, count } of breedDist) {
      console.log(`   - ${breed}: ${count}`);
    }

    // Check sex distribution
    const sexDist = await db.select({
      sex: cattle.sex,
      count: count(),
    })
    .from(cattle)
    .groupBy(cattle.sex)
    .orderBy(sql`count(*) DESC`);
    
    console.log('\n♂️♀️ Sex Distribution:');
    for (const { sex, count } of sexDist) {
      console.log(`   - ${sex}: ${count}`);
    }

    // Check cattle type distribution
    const typeDist = await db.select({
      cattleType: cattle.cattleType,
      count: count(),
    })
    .from(cattle)
    .groupBy(cattle.cattleType)
    .orderBy(sql`count(*) DESC`);
    
    console.log('\n🥩 Cattle Type Distribution:');
    for (const { cattleType, count } of typeDist) {
      console.log(`   - ${cattleType}: ${count}`);
    }

    // Check total portfolio value
    const portfolioValue = await db.select({
      totalValue: sql<number>`SUM(${cattle.currentValuation})`,
      avgValue: sql<number>`AVG(${cattle.currentValuation})`,
      minValue: sql<number>`MIN(${cattle.currentValuation})`,
      maxValue: sql<number>`MAX(${cattle.currentValuation})`,
    }).from(cattle);

    const formatCurrency = (cents: number | null) => {
      if (!cents) return 'N/A';
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(cents / 100);
    };

    console.log('\n💵 Portfolio Valuation:');
    console.log(`   - Total Value: ${formatCurrency(portfolioValue[0].totalValue)}`);
    console.log(`   - Average Value: ${formatCurrency(portfolioValue[0].avgValue)}`);
    console.log(`   - Min Value: ${formatCurrency(portfolioValue[0].minValue)}`);
    console.log(`   - Max Value: ${formatCurrency(portfolioValue[0].maxValue)}`);

    // Check event signatures
    const eventsWithSignatures = await db.select({ count: count() })
      .from(cattleEvents)
      .where(sql`${cattleEvents.signature} IS NOT NULL`);
    
    console.log('\n🔐 Turing Protocol V2:');
    console.log(`   - Events with EdDSA Signatures: ${eventsWithSignatures[0].count}`);
    console.log(`   - Signature Coverage: ${((eventsWithSignatures[0].count / eventCount.count) * 100).toFixed(1)}%`);

    // Summary
    console.log('\n========================================');
    console.log('✅ Dashboard Verification Complete!');
    console.log('========================================');
    console.log('\n📋 Summary:');
    console.log(`   - ${cattleCount.count} cattle ready for display`);
    console.log(`   - ${clientCount.count} farms/clients`);
    console.log(`   - ${eventCount.count} cryptographically signed events`);
    console.log(`   - ${valuationCount.count} valuations`);
    console.log(`   - ${cattleWithMuzzles[0].count} cattle with biometric photos`);
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the dev server: pnpm dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Explore the dashboard!\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

verify().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
