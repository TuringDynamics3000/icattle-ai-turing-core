#!/usr/bin/env tsx
/**
 * Test database connection
 */

import { getDb } from '../server/db';
import { users, clients, cattle } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available. Check DATABASE_URL environment variable.');
    }
    console.log('✅ Database connection established\n');

    // Test basic query
    console.log('📊 Testing basic query...');
    const result = await db.execute(sql`SELECT version()`);
    console.log(`   PostgreSQL version: ${result.rows[0]?.version}\n`);

    // Check if tables exist
    console.log('📋 Checking tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('   ⚠️  No tables found. Run "pnpm db:push" to create schema.\n');
    } else {
      console.log(`   ✅ Found ${tables.rows.length} tables:`);
      tables.rows.forEach((row: any) => {
        console.log(`      - ${row.table_name}`);
      });
      console.log('');

      // Count records
      console.log('📈 Record counts:');
      const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
      const [clientCount] = await db.select({ count: sql<number>`count(*)::int` }).from(clients);
      const [cattleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(cattle);
      
      console.log(`   - Users: ${userCount?.count || 0}`);
      console.log(`   - Clients: ${clientCount?.count || 0}`);
      console.log(`   - Cattle: ${cattleCount?.count || 0}`);
      console.log('');

      if ((cattleCount?.count || 0) === 0) {
        console.log('   💡 Tip: Run "pnpm db:seed" to add test data\n');
      }
    }

    console.log('✅ All tests passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure Docker is running: docker ps');
    console.error('   2. Start PostgreSQL: docker-compose up -d postgres');
    console.error('   3. Check DATABASE_URL in .env file');
    console.error('   4. Wait a few seconds for PostgreSQL to start\n');
    process.exit(1);
  }
}

testConnection();
