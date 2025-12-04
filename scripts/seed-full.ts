#!/usr/bin/env tsx
/**
 * Comprehensive Seed Script with Turing Protocol Enforcement
 * Seeds 268 cattle with muzzle photos and cryptographically signed events
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Kafka } from 'kafkajs';
import { clients, cattle, users, lifecycleEvents, valuations, marketData, cattleEvents } from '../drizzle/schema';
import { generateKeyPair, createEventMetadata, signEvent, calculatePayloadHash, toHex } from '../server/_core/turingProtocolV2';
import * as fs from 'fs';
import * as path from 'path';

// Cattle breeds for variety
const BREEDS = ['Angus', 'Hereford', 'Wagyu', 'Brahman', 'Charolais', 'Simmental', 'Limousin', 'Murray Grey'];
const CATTLE_TYPES = ['beef', 'breeding', 'dairy'] as const;
const SEXES = ['male', 'female'] as const;

// Farm names for distribution
const FARMS = [
  { name: 'Riverside Cattle Station', location: 'Wagga Wagga, NSW 2650', contact: 'John Smith', email: 'john@riverside.com.au', phone: '+61 2 9876 5432', abn: '12 345 678 901' },
  { name: 'Highland Breeding Farm', location: 'Armidale, NSW 2350', contact: 'Sarah Johnson', email: 'sarah@highland.com.au', phone: '+61 3 5432 1098', abn: '98 765 432 109' },
  { name: 'Outback Beef Co', location: 'Longreach, QLD 4730', contact: 'Mike Williams', email: 'mike@outbackbeef.com.au', phone: '+61 7 4658 1234', abn: '45 678 901 234' },
  { name: 'Southern Cross Pastoral', location: 'Mount Gambier, SA 5290', contact: 'Emma Davis', email: 'emma@southerncross.com.au', phone: '+61 8 8725 3456', abn: '78 901 234 567' },
  { name: 'Northern Territory Cattle Co', location: 'Katherine, NT 0850', contact: 'Tom Anderson', email: 'tom@ntcattle.com.au', phone: '+61 8 8972 4567', abn: '23 456 789 012' },
];

async function seed() {
  console.log('🌱 Starting comprehensive database seed with Turing Protocol...\n');
  console.log('📊 Target: 268 cattle with muzzle biometrics\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  // Initialize Turing Protocol
  const keyPair = await generateKeyPair();
  console.log('🔐 Generated cryptographic key pair for Turing Protocol');
  console.log(`   Public Key: ${keyPair.publicKey.substring(0, 32)}...`);
  console.log(`   Private Key: ${keyPair.privateKey.substring(0, 32)}...\n`);

  // Initialize Kafka
  let kafka: Kafka | null = null;
  let producer: any = null;
  
  if (process.env.KAFKA_BROKERS) {
    try {
      kafka = new Kafka({
        clientId: 'icattle-seed',
        brokers: process.env.KAFKA_BROKERS.split(','),
      });
      producer = kafka.producer();
      await producer.connect();
      console.log('📡 Connected to Kafka for event sourcing\n');
    } catch (error) {
      console.warn('⚠️  Kafka not available, skipping event publishing\n');
    }
  }

  // Create direct connection for seeding
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    // Test connection
    await client`SELECT 1`;
    console.log('✅ Database connection established\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const [user] = await db.insert(users).values({
      openId: 'admin_001',
      name: 'System Administrator',
      email: 'admin@icattle.local',
      role: 'admin',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Created user: ${user.name} (ID: ${user.id})\n`);

    // Create farms
    console.log('🏢 Creating farms...');
    const createdFarms = [];
    for (const farm of FARMS) {
      const [created] = await db.insert(clients).values({
        name: farm.name,
        contactName: farm.contact,
        email: farm.email,
        phone: farm.phone,
        address: farm.location,
        abn: farm.abn,
        status: 'active',
        totalCattle: 0,
      }).returning();
      createdFarms.push(created);
      console.log(`   ✅ ${farm.name}`);
    }
    console.log(`\n   📊 Total farms: ${createdFarms.length}\n`);

    // Read cattle list
    const cattleListPath = '/tmp/cattle_list.csv';
    const cattleList = fs.readFileSync(cattleListPath, 'utf-8')
      .trim()
      .split('\n')
      .map(line => {
        const [id, img] = line.split(',');
        return { id, img };
      });

    console.log(`📋 Found ${cattleList.length} cattle with muzzle photos\n`);
    console.log('🐄 Creating cattle records with Turing Protocol enforcement...\n');

    const createdCattle = [];
    const allEvents = [];
    let eventCount = 0;

    for (let i = 0; i < cattleList.length; i++) {
      const { id, img } = cattleList[i];
      const cattleNum = id.replace('cattle_', '');
      
      // Distribute cattle across farms
      const farmIndex = i % createdFarms.length;
      const farm = createdFarms[farmIndex];
      
      // Generate realistic data
      const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
      const sex = SEXES[Math.floor(Math.random() * SEXES.length)];
      const cattleType = CATTLE_TYPES[Math.floor(Math.random() * CATTLE_TYPES.length)];
      const age = Math.floor(Math.random() * 5) + 1; // 1-5 years
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - age);
      const weight = Math.floor(Math.random() * 400) + 300; // 300-700 kg
      const acquisitionCost = Math.floor(Math.random() * 300000) + 150000; // $1,500-$4,500
      
      // Muzzle image URL
      const muzzleImageUrl = `/images/muzzles/${id}/${img}`;
      
      // Create cattle record
      const [cow] = await db.insert(cattle).values({
        clientId: farm.id,
        nlis: `NLIS982${cattleNum.padStart(9, '0')}`,
        visualId: `${farm.name.substring(0, 2).toUpperCase()}${cattleNum}`,
        name: `Cattle ${cattleNum}`,
        breed,
        sex,
        cattleType,
        dateOfBirth: birthDate,
        status: 'active',
        currentWeight: weight,
        acquisitionDate: birthDate,
        acquisitionCost,
        muzzleImageUrl,
      }).returning();
      
      createdCattle.push(cow);

      // Create birth event with Turing Protocol
      const birthEventData = {
        cattle_id: cow.id,
        event_type: 'CATTLE_CREATED',
        occurred_at: birthDate.toISOString(),
        payload: {
          nlis: cow.nlis,
          visual_id: cow.visualId,
          breed: cow.breed,
          sex: cow.sex,
          cattle_type: cow.cattleType,
          birth_date: birthDate.toISOString(),
          muzzle_image_url: muzzleImageUrl,
          farm: farm.name,
        },
        actor_id: user.openId,
        source_system: 'icattle-seed',
      };

      // Create event metadata
      const metadata = createEventMetadata({
        eventType: 'CATTLE_CREATED',
        actorId: user.openId,
        sourceSystem: 'icattle-seed',
      });

      // Calculate payload hash
      const payloadHash = calculatePayloadHash(birthEventData.payload);

      // Sign the event
      const signature = await signEvent(
        metadata,
        payloadHash,
        keyPair.privateKey
      );

      // Create signed event envelope
      const signedEvent = {
        ...metadata,
        payload: birthEventData.payload,
        event_hash: payloadHash,
        signature: toHex(signature),
        public_key: keyPair.publicKey,
      };

      // Store in cattle_events table
      await db.insert(cattleEvents).values({
        cattleId: cow.id,
        eventType: 'CATTLE_CREATED',
        occurredAt: new Date(birthDate),
        payload: birthEventData.payload,
        actorId: user.openId,
        sourceSystem: 'icattle-seed',
        eventHash: signedEvent.event_hash,
        signature: signedEvent.signature,
        publicKey: keyPair.publicKey,
        idempotencyKey: metadata.idempotency_key,
      });

      // Publish to Kafka
      if (producer) {
        try {
          await producer.send({
            topic: 'turing.cattle.events',
            messages: [{
              key: cow.nlis,
              value: JSON.stringify(signedEvent),
              headers: {
                'event-type': 'CATTLE_CREATED',
                'signature': signedEvent.signature,
                'public-key': keyPair.publicKey,
              },
            }],
          });
        } catch (kafkaError) {
          // Silently continue if Kafka fails
        }
      }

      allEvents.push(signedEvent);
      eventCount++;

      // Progress indicator
      if ((i + 1) % 25 === 0) {
        console.log(`   ✅ Created ${i + 1}/${cattleList.length} cattle...`);
      }
    }

    console.log(`\n   📊 Total cattle created: ${createdCattle.length}`);
    console.log(`   🔐 Total signed events: ${eventCount}\n`);

    // Create lifecycle events for sample cattle
    console.log('📅 Creating lifecycle events...');
    const lifecycleEventData = [];
    
    // Add events for first 50 cattle (to keep it manageable)
    for (let i = 0; i < Math.min(50, createdCattle.length); i++) {
      const cow = createdCattle[i];
      
      // Vaccination event
      const vaccinationDate = new Date();
      vaccinationDate.setMonth(vaccinationDate.getMonth() - 2);
      lifecycleEventData.push({
        cattleId: cow.id,
        eventType: 'vaccination' as const,
        eventDate: vaccinationDate,
        description: '7-in-1 vaccine administered',
        recordedBy: user.id,
      });

      // Weight check
      const weightDate = new Date();
      weightDate.setMonth(weightDate.getMonth() - 1);
      lifecycleEventData.push({
        cattleId: cow.id,
        eventType: 'weight_check' as const,
        eventDate: weightDate,
        weight: cow.currentWeight,
        description: 'Monthly weight check',
        recordedBy: user.id,
      });
    }

    await db.insert(lifecycleEvents).values(lifecycleEventData);
    console.log(`   ✅ Created ${lifecycleEventData.length} lifecycle events\n`);

    // Create valuations
    console.log('💰 Creating valuations...');
    const valuationData = [];
    for (const cow of createdCattle) {
      const baseValue = cow.cattleType === 'breeding' ? 500000 : 250000;
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
      { date: new Date(), category: 'Angus Steer', pricePerKg: 685, source: 'MLA' },
      { date: new Date(), category: 'Hereford Heifer', pricePerKg: 650, source: 'MLA' },
      { date: new Date(), category: 'Wagyu Steer', pricePerKg: 1250, source: 'MLA' },
      { date: new Date(), category: 'Brahman Bull', pricePerKg: 620, source: 'MLA' },
      { date: new Date(), category: 'Charolais Heifer', pricePerKg: 670, source: 'MLA' },
    ];

    await db.insert(marketData).values(marketDataEntries);
    console.log(`   ✅ Created ${marketDataEntries.length} market data entries\n`);

    // Update farm cattle counts
    console.log('🔄 Updating farm cattle counts...');
    for (const farm of createdFarms) {
      const count = createdCattle.filter(c => c.clientId === farm.id && c.status === 'active').length;
      await db.update(clients)
        .set({ totalCattle: count })
        .where(clients.id.eq(farm.id));
    }
    console.log('   ✅ Farm counts updated\n');

    // Summary
    console.log('========================================');
    console.log('🎉 Database seeded successfully!');
    console.log('========================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Users: 1`);
    console.log(`   - Farms: ${createdFarms.length}`);
    console.log(`   - Cattle: ${createdCattle.length}`);
    console.log(`   - Signed Events: ${eventCount}`);
    console.log(`   - Lifecycle Events: ${lifecycleEventData.length}`);
    console.log(`   - Valuations: ${valuationData.length}`);
    console.log(`   - Market Data: ${marketDataEntries.length}`);
    console.log(`\n🔐 Turing Protocol Enforcement:`);
    console.log(`   - All cattle creation events cryptographically signed`);
    console.log(`   - EdDSA (Ed25519) signatures`);
    console.log(`   - SHA-256 event hashing`);
    console.log(`   - Complete audit trail`);
    console.log(`   - Events published to Kafka: ${producer ? 'Yes' : 'No'}`);
    console.log(`\n🌐 Open http://localhost:3000 to view the dashboard\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    if (producer) {
      await producer.disconnect();
    }
    await client.end();
  }
}

seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
