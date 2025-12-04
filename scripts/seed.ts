#!/usr/bin/env tsx
/**
 * Seed script for local development
 * Creates realistic test data for iCattle Dashboard
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { clients, cattle, users, lifecycleEvents, valuations, marketData } from '../drizzle/schema';

async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  // Create direct connection for seeding
  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
  });
  const db = drizzle(client);

  try {
    // Test connection
    await client`SELECT 1`;
    console.log('✅ Database connection established\n');

    // Create test user
    console.log('👤 Creating test user...');
    const [user] = await db.insert(users).values({
      openId: 'test_admin_001',
      name: 'Admin User',
      email: 'admin@icattle.local',
      role: 'admin',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Created user: ${user.name} (ID: ${user.id})\n`);

    // Create test clients (farms)
    console.log('🏢 Creating test clients (farms)...');
    const [client1] = await db.insert(clients).values({
      name: 'Riverside Cattle Station',
      contactName: 'John Smith',
      email: 'john@riverside.com.au',
      phone: '+61 2 9876 5432',
      address: '123 Cattle Road, Wagga Wagga, NSW 2650',
      abn: '12 345 678 901',
      status: 'active',
      totalCattle: 0,
    }).returning();
    console.log(`   ✅ Created client: ${client1.name}`);

    const [client2] = await db.insert(clients).values({
      name: 'Highland Breeding Farm',
      contactName: 'Sarah Johnson',
      email: 'sarah@highland.com.au',
      phone: '+61 3 5432 1098',
      address: '456 Pastoral Lane, Armidale, NSW 2350',
      abn: '98 765 432 109',
      status: 'active',
      totalCattle: 0,
    }).returning();
    console.log(`   ✅ Created client: ${client2.name}\n`);

    // Create cattle with variety
    console.log('🐄 Creating cattle...');
    
    const cattleData = [
      {
        clientId: client1.id,
        nlis: 'NLIS982000123456',
        visualId: 'RS001',
        name: 'Blackie',
        breed: 'Angus',
        sex: 'male' as const,
        cattleType: 'beef' as const,
        dateOfBirth: new Date('2021-03-15'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 650,
        acquisitionDate: new Date('2021-04-01'),
        acquisitionCost: 180000, // $1,800 in cents
      },
      {
        clientId: client1.id,
        nlis: 'NLIS982000123457',
        visualId: 'RS002',
        name: 'Bessie',
        breed: 'Hereford',
        sex: 'female' as const,
        cattleType: 'beef' as const,
        dateOfBirth: new Date('2020-11-20'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 580,
        acquisitionDate: new Date('2021-01-10'),
        acquisitionCost: 165000, // $1,650 in cents
      },
      {
        clientId: client1.id,
        nlis: 'NLIS982000123458',
        visualId: 'RS003',
        name: 'Thunder',
        breed: 'Angus',
        sex: 'male' as const,
        cattleType: 'breeding' as const,
        dateOfBirth: new Date('2019-05-10'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 850,
        acquisitionDate: new Date('2020-06-15'),
        acquisitionCost: 450000, // $4,500 in cents
        pedigreeDetails: 'Champion bloodline, multiple show wins',
      },
      {
        clientId: client2.id,
        nlis: 'NLIS982000234567',
        visualId: 'HF001',
        name: 'Daisy',
        breed: 'Wagyu',
        sex: 'female' as const,
        cattleType: 'breeding' as const,
        dateOfBirth: new Date('2020-02-14'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 520,
        acquisitionDate: new Date('2020-08-20'),
        acquisitionCost: 650000, // $6,500 in cents
        pedigreeDetails: 'Premium Wagyu genetics, F1 cross',
      },
      {
        clientId: client2.id,
        nlis: 'NLIS982000234568',
        visualId: 'HF002',
        name: 'Duke',
        breed: 'Wagyu',
        sex: 'male' as const,
        cattleType: 'beef' as const,
        dateOfBirth: new Date('2021-08-05'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 420,
        acquisitionDate: new Date('2021-09-01'),
        acquisitionCost: 380000, // $3,800 in cents
      },
      {
        clientId: client2.id,
        nlis: 'NLIS982000234569',
        visualId: 'HF003',
        name: 'Ruby',
        breed: 'Hereford',
        sex: 'female' as const,
        cattleType: 'beef' as const,
        dateOfBirth: new Date('2022-01-20'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 380,
        acquisitionDate: new Date('2022-02-15'),
        acquisitionCost: 195000, // $1,950 in cents
      },
      {
        clientId: client1.id,
        nlis: 'NLIS982000123459',
        visualId: 'RS004',
        name: 'Brownie',
        breed: 'Angus',
        sex: 'female' as const,
        cattleType: 'beef' as const,
        dateOfBirth: new Date('2021-06-30'),
        sireId: null,
        damId: null,
        status: 'sold' as const,
        currentWeight: 550,
        acquisitionDate: new Date('2021-08-01'),
        acquisitionCost: 175000, // $1,750 in cents
      },
      {
        clientId: client1.id,
        nlis: 'NLIS982000123460',
        visualId: 'RS005',
        name: 'Champion',
        breed: 'Angus',
        sex: 'male' as const,
        cattleType: 'breeding' as const,
        dateOfBirth: new Date('2018-09-12'),
        sireId: null,
        damId: null,
        status: 'active' as const,
        currentWeight: 950,
        acquisitionDate: new Date('2019-01-20'),
        acquisitionCost: 850000, // $8,500 in cents
        pedigreeDetails: 'Elite sire, proven genetics',
      },
    ];

    const insertedCattle = [];
    for (const cattleItem of cattleData) {
      const [inserted] = await db.insert(cattle).values(cattleItem).returning();
      insertedCattle.push(inserted);
      console.log(`   ✅ Created cattle: ${inserted.name} (${inserted.visualId}) - ${inserted.breed}`);
    }
    console.log(`\n   📊 Total cattle created: ${insertedCattle.length}\n`);

    // Create lifecycle events
    console.log('📅 Creating lifecycle events...');
    const events = [];
    
    // Birth events
    for (const cow of insertedCattle) {
      events.push({
        cattleId: cow.id,
        eventType: 'birth' as const,
        eventDate: cow.dateOfBirth!,
        description: `Born at ${cow.clientId === client1.id ? 'Riverside' : 'Highland'}`,
        recordedBy: user.id,
      });
    }

    // Weaning events (for cattle old enough)
    const oldEnough = insertedCattle.filter(c => {
      const age = (Date.now() - c.dateOfBirth!.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return age > 6; // older than 6 months
    });

    for (const cow of oldEnough) {
      const weaningDate = new Date(cow.dateOfBirth!);
      weaningDate.setMonth(weaningDate.getMonth() + 6);
      events.push({
        cattleId: cow.id,
        eventType: 'weaning' as const,
        eventDate: weaningDate,
        description: 'Weaned from mother',
        weight: Math.floor(cow.currentWeight! * 0.4), // Approximate weaning weight
        recordedBy: user.id,
      });
    }

    // Vaccination events
    for (const cow of insertedCattle.filter(c => c.status === 'active')) {
      const vaccinationDate = new Date();
      vaccinationDate.setMonth(vaccinationDate.getMonth() - 2);
      events.push({
        cattleId: cow.id,
        eventType: 'vaccination' as const,
        eventDate: vaccinationDate,
        description: '7-in-1 vaccine administered',
        recordedBy: user.id,
      });
    }

    // Weight check events
    for (const cow of insertedCattle.filter(c => c.status === 'active')) {
      const weightDate = new Date();
      weightDate.setMonth(weightDate.getMonth() - 1);
      events.push({
        cattleId: cow.id,
        eventType: 'weight_check' as const,
        eventDate: weightDate,
        weight: cow.currentWeight,
        description: 'Monthly weight check',
        recordedBy: user.id,
      });
    }

    await db.insert(lifecycleEvents).values(events);
    console.log(`   ✅ Created ${events.length} lifecycle events\n`);

    // Create valuations
    console.log('💰 Creating valuations...');
    const valuationData = [];
    for (const cow of insertedCattle.filter(c => c.status === 'active')) {
      const baseValue = cow.cattleType === 'breeding' ? 500000 : 250000; // $5000 or $2500
      const weightFactor = (cow.currentWeight || 500) / 500;
      valuationData.push({
        cattleId: cow.id,
        valuationDate: new Date(),
        marketValue: Math.floor(baseValue * weightFactor),
        method: 'market_comparison' as const,
        calculatedBy: 'system',
        notes: 'Based on current market prices and weight',
      });
    }

    await db.insert(valuations).values(valuationData);
    console.log(`   ✅ Created ${valuationData.length} valuations\n`);

    // Create market data
    console.log('📈 Creating market data...');
    const marketDataEntries = [
      {
        date: new Date(),
        category: 'Angus Steer',
        pricePerKg: 685, // $6.85/kg in cents
        source: 'MLA',
      },
      {
        date: new Date(),
        category: 'Hereford Heifer',
        pricePerKg: 650, // $6.50/kg in cents
        source: 'MLA',
      },
      {
        date: new Date(),
        category: 'Wagyu Steer',
        pricePerKg: 1250, // $12.50/kg in cents
        source: 'MLA',
      },
    ];

    await db.insert(marketData).values(marketDataEntries);
    console.log(`   ✅ Created ${marketDataEntries.length} market data entries\n`);

    // Update client cattle counts
    await db.update(clients)
      .set({ totalCattle: insertedCattle.filter(c => c.clientId === client1.id && c.status === 'active').length })
      .where(clients.id.eq(client1.id));
    
    await db.update(clients)
      .set({ totalCattle: insertedCattle.filter(c => c.clientId === client2.id && c.status === 'active').length })
      .where(clients.id.eq(client2.id));

    console.log('✅ Updated client cattle counts\n');

    console.log('========================================');
    console.log('🎉 Database seeded successfully!');
    console.log('========================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Users: 1`);
    console.log(`   - Clients (Farms): 2`);
    console.log(`   - Cattle: ${insertedCattle.length}`);
    console.log(`   - Lifecycle Events: ${events.length}`);
    console.log(`   - Valuations: ${valuationData.length}`);
    console.log(`   - Market Data: ${marketDataEntries.length}`);
    console.log(`\n🌐 Open http://localhost:3000 to view the dashboard\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
