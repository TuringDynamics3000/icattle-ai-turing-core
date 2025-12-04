#!/usr/bin/env tsx
/**
 * Seed script for local development
 * Creates test data for iCattle Dashboard
 */

import { getDb } from '../server/db';
import { clients, cattle, users, lifecycleEvents, valuations } from '../drizzle/schema';

async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available. Make sure DATABASE_URL is set.');
  }

  try {
    // Create test user
    console.log('👤 Creating test user...');
    const [user] = await db.insert(users).values({
      openId: 'test_user_001',
      name: 'Test Admin',
      email: 'admin@icattle.local',
      role: 'admin',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Created user: ${user.name} (ID: ${user.id})`);

    // Create test clients
    console.log('\n🏢 Creating test clients...');
    const [client1] = await db.insert(clients).values({
      name: 'Riverside Cattle Station',
      abn: '12345678901',
      contactName: 'John Farmer',
      contactEmail: 'john@riverside.com.au',
      contactPhone: '+61 400 123 456',
      address: '123 Rural Road, Wagga Wagga',
      state: 'NSW',
      postcode: '2650',
      propertySize: 5000,
      clientType: 'producer',
      status: 'active',
    }).returning();
    console.log(`   ✅ Created client: ${client1.name} (ID: ${client1.id})`);

    const [client2] = await db.insert(clients).values({
      name: 'Highland Breeding Farm',
      abn: '98765432109',
      contactName: 'Sarah Breeder',
      contactEmail: 'sarah@highland.com.au',
      contactPhone: '+61 400 987 654',
      address: '456 Mountain View Road, Armidale',
      state: 'NSW',
      postcode: '2350',
      propertySize: 2000,
      clientType: 'breeder',
      status: 'active',
    }).returning();
    console.log(`   ✅ Created client: ${client2.name} (ID: ${client2.id})`);

    // Create test cattle for client 1
    console.log('\n🐄 Creating test cattle...');
    
    const cattleData = [
      {
        clientId: client1.id,
        nlisId: 'NAUS000000001',
        visualId: 'COW-001',
        breed: 'Angus',
        sex: 'cow' as const,
        dateOfBirth: new Date('2020-03-15'),
        cattleType: 'beef' as const,
        currentWeight: 550,
        currentValuation: 165000, // $1650 in cents
        acquisitionCost: 120000, // $1200 in cents
        acquisitionDate: new Date('2020-06-01'),
        status: 'active' as const,
        healthStatus: 'healthy' as const,
        currentLocation: 'Paddock A',
      },
      {
        clientId: client1.id,
        nlisId: 'NAUS000000002',
        visualId: 'BULL-001',
        breed: 'Wagyu',
        sex: 'bull' as const,
        dateOfBirth: new Date('2019-01-20'),
        cattleType: 'breeding' as const,
        currentWeight: 800,
        currentValuation: 500000, // $5000 in cents
        acquisitionCost: 450000, // $4500 in cents
        acquisitionDate: new Date('2019-08-15'),
        status: 'active' as const,
        healthStatus: 'healthy' as const,
        currentLocation: 'Breeding Yard',
      },
      {
        clientId: client1.id,
        nlisId: 'NAUS000000003',
        visualId: 'STEER-001',
        breed: 'Hereford',
        sex: 'steer' as const,
        dateOfBirth: new Date('2022-05-10'),
        cattleType: 'feeder' as const,
        currentWeight: 350,
        currentValuation: 105000, // $1050 in cents
        acquisitionCost: 80000, // $800 in cents
        acquisitionDate: new Date('2022-09-01'),
        status: 'active' as const,
        healthStatus: 'healthy' as const,
        currentLocation: 'Paddock B',
      },
      {
        clientId: client2.id,
        nlisId: 'NAUS000000004',
        visualId: 'HEIFER-001',
        breed: 'Angus',
        sex: 'heifer' as const,
        dateOfBirth: new Date('2023-02-14'),
        cattleType: 'breeding' as const,
        currentWeight: 280,
        currentValuation: 140000, // $1400 in cents
        acquisitionCost: 100000, // $1000 in cents
        acquisitionDate: new Date('2023-06-01'),
        status: 'active' as const,
        healthStatus: 'healthy' as const,
        currentLocation: 'Breeding Paddock',
      },
      {
        clientId: client2.id,
        nlisId: 'NAUS000000005',
        visualId: 'COW-002',
        breed: 'Wagyu',
        sex: 'cow' as const,
        dateOfBirth: new Date('2018-11-05'),
        cattleType: 'breeding' as const,
        currentWeight: 600,
        currentValuation: 350000, // $3500 in cents
        acquisitionCost: 300000, // $3000 in cents
        acquisitionDate: new Date('2019-03-20'),
        status: 'active' as const,
        healthStatus: 'healthy' as const,
        currentLocation: 'Main Paddock',
      },
    ];

    for (const data of cattleData) {
      const [animal] = await db.insert(cattle).values(data).returning();
      console.log(`   ✅ Created cattle: ${animal.visualId} - ${animal.breed} ${animal.sex} (ID: ${animal.id})`);

      // Create lifecycle event for acquisition
      await db.insert(lifecycleEvents).values({
        cattleId: animal.id,
        eventType: 'acquisition',
        eventDate: data.acquisitionDate,
        details: JSON.stringify({
          source: 'Purchase',
          vendor: 'Local Auction',
        }),
        amount: data.acquisitionCost,
        recordedBy: user.id,
        notes: 'Initial acquisition',
      });

      // Create initial valuation
      await db.insert(valuations).values({
        cattleId: animal.id,
        valuationDate: new Date(),
        valuationAmount: data.currentValuation,
        method: 'market',
        marketPrice: Math.floor(data.currentValuation / data.currentWeight), // Price per kg
        weight: data.currentWeight,
        dataSource: 'MLA',
        confidence: 'high',
        calculatedBy: 'system',
      });
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 1`);
    console.log(`   - Clients: 2`);
    console.log(`   - Cattle: ${cattleData.length}`);
    console.log(`   - Lifecycle Events: ${cattleData.length}`);
    console.log(`   - Valuations: ${cattleData.length}`);
    console.log('\n🚀 You can now start the development server with: pnpm dev');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
