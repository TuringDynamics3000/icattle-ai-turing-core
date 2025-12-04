/**
 * Cleanup script to remove old cattle records
 * Deletes cattle with IDs < 6,000,000 (the old 1,000 test records)
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { clients, cattle, users, lifecycleEvents, valuations } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function cleanup() {
  console.log('🧹 Starting database cleanup...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    await client`SELECT 1`;
    console.log('✅ Database connection established\n');

    // Count old records before deletion
    console.log('📊 Checking old data...');
    const oldCattleCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM cattle WHERE id < 6000000
    `);
    const oldClientsCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM clients WHERE id < 100
    `);
    const oldEventsCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM lifecycle_events WHERE cattle_id < 6000000
    `);
    
    console.log(`   Old cattle records: ${oldCattleCount.rows[0].count}`);
    console.log(`   Old client records: ${oldClientsCount.rows[0].count}`);
    console.log(`   Old event records: ${oldEventsCount.rows[0].count}\n`);

    if (oldCattleCount.rows[0].count === '0') {
      console.log('✅ No old data found. Database is clean!\n');
      return;
    }

    // Delete old lifecycle events first (foreign key constraint)
    console.log('🗑️  Deleting old lifecycle events...');
    const deletedEvents = await db.execute(sql`
      DELETE FROM lifecycle_events WHERE cattle_id < 6000000
    `);
    console.log(`   ✅ Deleted ${deletedEvents.count} lifecycle events\n`);

    // Delete old valuations
    console.log('🗑️  Deleting old valuations...');
    const deletedValuations = await db.execute(sql`
      DELETE FROM valuations WHERE cattle_id < 6000000
    `);
    console.log(`   ✅ Deleted ${deletedValuations.count} valuations\n`);

    // Delete old cattle
    console.log('🗑️  Deleting old cattle records...');
    const deletedCattle = await db.execute(sql`
      DELETE FROM cattle WHERE id < 6000000
    `);
    console.log(`   ✅ Deleted ${deletedCattle.count} cattle records\n`);

    // Delete old clients (those with no cattle)
    console.log('🗑️  Deleting old client records...');
    const deletedClients = await db.execute(sql`
      DELETE FROM clients 
      WHERE id < 100 
      AND id NOT IN (SELECT DISTINCT client_id FROM cattle WHERE client_id IS NOT NULL)
    `);
    console.log(`   ✅ Deleted ${deletedClients.count} client records\n`);

    // Delete old users (test users)
    console.log('🗑️  Deleting old test users...');
    const deletedUsers = await db.execute(sql`
      DELETE FROM users WHERE open_id LIKE 'test_%'
    `);
    console.log(`   ✅ Deleted ${deletedUsers.count} test users\n`);

    // Verify cleanup
    console.log('📊 Verifying cleanup...');
    const remainingCattle = await db.execute(sql`
      SELECT COUNT(*) as count FROM cattle
    `);
    const remainingClients = await db.execute(sql`
      SELECT COUNT(*) as count FROM clients
    `);
    
    console.log(`   Remaining cattle: ${remainingCattle.rows[0].count}`);
    console.log(`   Remaining clients: ${remainingClients.rows[0].count}\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 CLEANUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Old data removed successfully`);
    console.log(`📊 Database now contains only the new 100k cattle records`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

cleanup().catch(console.error);
