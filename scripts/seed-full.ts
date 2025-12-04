#!/usr/bin/env tsx
/**
 * Comprehensive Seed Script with Turing Protocol Enforcement
 * Seeds 218 cattle with muzzle photos and cryptographically signed events
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Kafka } from 'kafkajs';
import { clients, cattle, users, lifecycleEvents, valuations, marketData, cattleEvents } from '../drizzle/schema';
import { generateKeyPair, createEventMetadata, signEvent, calculatePayloadHash, toHex } from '../server/_core/turingProtocolV2';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cattle breeds for variety
const BREEDS = ['Angus', 'Hereford', 'Wagyu', 'Brahman', 'Charolais', 'Simmental', 'Limousin', 'Murray Grey'];
const CATTLE_TYPES = ['beef', 'breeding', 'dairy'] as const;
// Sex categories: bull (intact male), steer (castrated male), cow (mature female), heifer (young female), calf (young)
const SEXES = ['bull', 'steer', 'cow', 'heifer'] as const; // Exclude 'calf' as it's age-based

// Farm names for distribution
const FARMS = [
  { name: 'Riverside Cattle Station', location: 'Wagga Wagga, NSW 2650', contact: 'John Smith', email: 'john@riverside.com.au', phone: '+61 2 9876 5432', abn: '12 345 678 901', clientType: 'producer' as const },
  { name: 'Highland Breeding Farm', location: 'Armidale, NSW 2350', contact: 'Sarah Johnson', email: 'sarah@highland.com.au', phone: '+61 3 5432 1098', abn: '98 765 432 109', clientType: 'breeder' as const },
  { name: 'Outback Beef Co', location: 'Longreach, QLD 4730', contact: 'Mike Williams', email: 'mike@outbackbeef.com.au', phone: '+61 7 4658 1234', abn: '45 678 901 234', clientType: 'producer' as const },
  { name: 'Southern Cross Pastoral', location: 'Mount Gambier, SA 5290', contact: 'Emma Davis', email: 'emma@southerncross.com.au', phone: '+61 8 8725 3456', abn: '78 901 234 567', clientType: 'feedlot' as const },
  { name: 'Northern Territory Cattle Co', location: 'Katherine, NT 0850', contact: 'Tom Anderson', email: 'tom@ntcattle.com.au', phone: '+61 8 8972 4567', abn: '23 456 789 012', clientType: 'producer' as const },
];

async function seed() {
  console.log('🌱 Starting comprehensive database seed with Turing Protocol...\n');
  console.log('📊 Target: 218 cattle with muzzle biometrics\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  // Initialize Turing Protocol
  const keyPair = await generateKeyPair();
  const publicKeyHex = toHex(keyPair.publicKey);
  const privateKeyHex = toHex(keyPair.privateKey);
  console.log('🔐 Generated cryptographic key pair for Turing Protocol');
  console.log(`   Public Key: ${publicKeyHex.substring(0, 32)}...`);
  console.log(`   Private Key: ${privateKeyHex.substring(0, 32)}...\n`);

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

  // Create direct connection for seeding using node-postgres (pg)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established\n');

    // Clear existing data (in reverse order of foreign key dependencies)
    console.log('🗑️  Clearing existing data...');
    const tablesToClear = [
      'fraud_alerts',
      'cattle_events',
      'notifications',
      'agriwebbSyncStatus',
      'financialReports',
      'marketData',
      'valuations',
      'lifecycleEvents',
      'cattle',
      'clients',
      'users'
    ];
    
    for (const table of tablesToClear) {
      try {
        await pool.query(`DELETE FROM "${table}"`);
      } catch (error: any) {
        // Ignore if table doesn't exist yet
        if (error.code !== '42P01') {
          throw error;
        }
      }
    }
    console.log('   ✅ Database cleared\n');

    // Create test users with different roles
    console.log('👤 Creating test users...');
    
    const [adminUser] = await db.insert(users).values({
      openId: 'admin_001',
      name: 'System Administrator',
      email: 'admin@icattle.local',
      role: 'admin',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Admin: ${adminUser.name} (ID: ${adminUser.id})`);
    
    const [farmerUser1] = await db.insert(users).values({
      openId: 'farmer_001',
      name: 'John Smith',
      email: 'john@riverside.com.au',
      role: 'farmer',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Farmer: ${farmerUser1.name} (ID: ${farmerUser1.id})`);
    
    const [farmerUser2] = await db.insert(users).values({
      openId: 'farmer_002',
      name: 'Sarah Johnson',
      email: 'sarah@highland.com.au',
      role: 'farmer',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Farmer: ${farmerUser2.name} (ID: ${farmerUser2.id})`);
    
    const [bankUser] = await db.insert(users).values({
      openId: 'bank_001',
      name: 'ANZ Agribusiness',
      email: 'agri@anz.com.au',
      role: 'bank',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Bank: ${bankUser.name} (ID: ${bankUser.id})`);
    
    const [investorUser] = await db.insert(users).values({
      openId: 'investor_001',
      name: 'Rural Funds Management',
      email: 'invest@ruralfunds.com.au',
      role: 'investor',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Investor: ${investorUser.name} (ID: ${investorUser.id})\n`);
    
    const allUsers = [adminUser, farmerUser1, farmerUser2, bankUser, investorUser];

    // Create farms
    console.log('🏢 Creating farms...');
    const createdFarms = [];
    for (const farm of FARMS) {
      const [created] = await db.insert(clients).values({
        name: farm.name,
        contactName: farm.contact,
        contactEmail: farm.email,
        contactPhone: farm.phone,
        address: farm.location,
        abn: farm.abn,
        clientType: farm.clientType,
        status: 'active',
      }).returning();
      createdFarms.push(created);
      console.log(`   ✅ ${farm.name}`);
    }
    console.log(`\n   📊 Total farms: ${createdFarms.length}\n`);
    
    // Create user-farm relationships (farmers own their farms)
    console.log('🔗 Creating user-farm relationships...');
    const { userClients, portfolios } = await import('../drizzle/schema.js');
    
    // Farmer 1 owns Riverside Cattle Station (farm 0)
    await db.insert(userClients).values({
      userId: farmerUser1.id,
      clientId: createdFarms[0].id,
      role: 'owner',
    });
    console.log(`   ✅ ${farmerUser1.name} → ${createdFarms[0].name}`);
    
    // Farmer 2 owns Highland Breeding Farm (farm 1)
    await db.insert(userClients).values({
      userId: farmerUser2.id,
      clientId: createdFarms[1].id,
      role: 'owner',
    });
    console.log(`   ✅ ${farmerUser2.name} → ${createdFarms[1].name}`);
    
    console.log('\n💼 Creating financier portfolios...');
    
    // Bank portfolio: Riverside, Outback Beef, Southern Cross (farms 0, 2, 3)
    await db.insert(portfolios).values({
      userId: bankUser.id,
      clientId: createdFarms[0].id,
      financierType: 'bank',
      loanAmount: 250000000, // $2.5M in cents
      equity: 40,
      startDate: new Date('2023-01-01'),
      active: true,
    });
    await db.insert(portfolios).values({
      userId: bankUser.id,
      clientId: createdFarms[2].id,
      financierType: 'bank',
      loanAmount: 180000000, // $1.8M in cents
      equity: 35,
      startDate: new Date('2023-03-15'),
      active: true,
    });
    await db.insert(portfolios).values({
      userId: bankUser.id,
      clientId: createdFarms[3].id,
      financierType: 'bank',
      loanAmount: 320000000, // $3.2M in cents
      equity: 45,
      startDate: new Date('2023-06-01'),
      active: true,
    });
    console.log(`   ✅ ${bankUser.name} portfolio: 3 farms ($7.5M total loans)`);
    
    // Investor portfolio: Highland, Northern Territory (farms 1, 4)
    await db.insert(portfolios).values({
      userId: investorUser.id,
      clientId: createdFarms[1].id,
      financierType: 'investor',
      equity: 25,
      startDate: new Date('2023-02-01'),
      active: true,
    });
    await db.insert(portfolios).values({
      userId: investorUser.id,
      clientId: createdFarms[4].id,
      financierType: 'investor',
      equity: 30,
      startDate: new Date('2023-05-01'),
      active: true,
    });
    console.log(`   ✅ ${investorUser.name} portfolio: 2 farms\n`);

    // Read cattle list
    const cattleListPath = process.platform === 'win32' 
      ? path.join(__dirname, '..', 'cattle_list.csv')
      : '/tmp/cattle_list.csv';
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
        nlisId: `NLIS982${cattleNum.padStart(9, '0')}`,
        visualId: `${farm.name.substring(0, 2).toUpperCase()}${cattleNum}`,
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
          nlis: cow.nlisId,
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
        event_type: 'CATTLE_CREATED',
        event_ref: `cattle-${cow.id}-created`,
        cattle_id: cow.id,
        occurred_at: birthDate,
        idempotency_key: `cattle-${cow.id}-birth-${Date.now()}`,
        source_system: 'iCattle',
        created_by: user.openId,
        public_key: publicKeyHex,
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
        public_key: publicKeyHex,
      };

      // Store in cattle_events table
      await db.insert(cattleEvents).values({
        eventId: metadata.event_id,
        eventType: metadata.event_type,
        eventRef: metadata.event_ref,
        cattleId: metadata.cattle_id,
        occurredAt: new Date(metadata.occurred_at),
        recordedAt: new Date(metadata.recorded_at),
        idempotencyKey: metadata.idempotency_key,
        correlationId: metadata.correlation_id,
        causationId: metadata.causation_id,
        sourceSystem: metadata.source_system,
        schemaVersion: metadata.schema_version,
        createdBy: metadata.created_by,
        publicKey: metadata.public_key,
        payload: JSON.stringify(birthEventData.payload),
        payloadHash: payloadHash,
        signature: signature,
      });

      // Publish to Kafka
      if (producer) {
        try {
          await producer.send({
            topic: 'turing.cattle.events',
            messages: [{
              key: cow.nlisId,
              value: JSON.stringify(signedEvent),
              headers: {
                'event-type': 'CATTLE_CREATED',
                'signature': signedEvent.signature,
                'public-key': publicKeyHex,
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
        details: JSON.stringify({ vaccine: '7-in-1', notes: 'Routine vaccination' }),
        recordedBy: user.id,
      });

      // Weight update
      const weightDate = new Date();
      weightDate.setMonth(weightDate.getMonth() - 1);
      lifecycleEventData.push({
        cattleId: cow.id,
        eventType: 'weight_update' as const,
        eventDate: weightDate,
        weight: cow.currentWeight,
        details: JSON.stringify({ weight: cow.currentWeight, notes: 'Monthly weight check' }),
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
        valuationAmount: Math.floor(baseValue * weightFactor),
        method: 'market' as const,
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

    // Note: Farm cattle counts can be calculated via query when needed
    // (totalCattle field doesn't exist in schema)

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
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
