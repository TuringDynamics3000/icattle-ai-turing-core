/**
 * Test script to diagnose insert issues
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cattle } from '../drizzle/schema';

async function test() {
  console.log('🧪 Testing cattle insert...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    // Check current count
    const beforeCount = await client`SELECT COUNT(*) as count FROM cattle`;
    console.log(`Before insert: ${beforeCount[0].count} cattle\n`);

    // Try inserting a small batch
    console.log('Inserting 5 test cattle...');
    const testBatch = [];
    for (let i = 0; i < 5; i++) {
      testBatch.push({
        clientId: 1, // Assuming client 1 exists
        nlisId: `TEST${Date.now()}${i}`,
        visualId: `TEST${i}`,
        breed: 'Angus',
        sex: 'male',
        cattleType: 'beef' as const,
        dateOfBirth: new Date('2020-01-01'),
        status: 'active' as const,
        currentWeight: 500,
        currentValuation: 200000,
        acquisitionDate: new Date(),
        healthStatus: 'healthy',
        currentLocation: 'Test Location',
        latitude: '-35.0',
        longitude: '149.0',
        biometricId: `BIOTEST${i}`,
      });
    }

    const result = await db.insert(cattle).values(testBatch).returning();
    console.log(`✅ Inserted ${result.length} cattle`);
    console.log('Returned IDs:', result.map(c => c.id));

    // Check count after
    const afterCount = await client`SELECT COUNT(*) as count FROM cattle`;
    console.log(`\nAfter insert: ${afterCount[0].count} cattle`);
    console.log(`Difference: ${Number(afterCount[0].count) - Number(beforeCount[0].count)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

test();
