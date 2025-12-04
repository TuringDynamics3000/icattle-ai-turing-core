/**
 * Seed script for 100,000 cattle with geographic diversity
 * Creates 12+ farmers across Australian states with realistic data
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { clients, cattle, users, lifecycleEvents, valuations } from '../drizzle/schema';

// Australian regions with GPS coordinates
const REGIONS = [
  { state: 'NSW', region: 'Riverina', lat: -35.1082, lng: 147.3598, name: 'Wagga Wagga' },
  { state: 'NSW', region: 'Northern Tablelands', lat: -30.5033, lng: 151.6617, name: 'Armidale' },
  { state: 'QLD', region: 'Darling Downs', lat: -27.5598, lng: 151.9507, name: 'Toowoomba' },
  { state: 'QLD', region: 'Central Queensland', lat: -23.3382, lng: 150.5136, name: 'Rockhampton' },
  { state: 'VIC', region: 'Gippsland', lat: -38.1079, lng: 147.3598, name: 'Sale' },
  { state: 'VIC', region: 'Western District', lat: -38.3830, lng: 142.4917, name: 'Warrnambool' },
  { state: 'SA', region: 'South East', lat: -37.8292, lng: 140.7831, name: 'Mount Gambier' },
  { state: 'SA', region: 'Mid North', lat: -33.8568, lng: 138.6200, name: 'Clare' },
  { state: 'WA', region: 'South West', lat: -33.3256, lng: 115.6361, name: 'Bunbury' },
  { state: 'WA', region: 'Great Southern', lat: -34.9574, lng: 117.8765, name: 'Albany' },
  { state: 'TAS', region: 'North West', lat: -41.0329, lng: 145.7689, name: 'Devonport' },
  { state: 'NT', region: 'Top End', lat: -14.4426, lng: 132.2681, name: 'Katherine' },
];

// Farm names and owner details
const FARMS = [
  { name: 'Riverside Cattle Station', owner: 'John Smith', prefix: 'RIV' },
  { name: 'Highland Breeding Farm', owner: 'Sarah Johnson', prefix: 'HBF' },
  { name: 'Golden Plains Pastoral', owner: 'Michael Chen', prefix: 'GPP' },
  { name: 'Sunset Ridge Station', owner: 'Emma Wilson', prefix: 'SRS' },
  { name: 'Ironbark Cattle Co', owner: 'David Thompson', prefix: 'IBC' },
  { name: 'Bluegrass Livestock', owner: 'Lisa Anderson', prefix: 'BGL' },
  { name: 'Redgum Valley Ranch', owner: 'Robert Martinez', prefix: 'RVR' },
  { name: 'Silverleaf Pastoral', owner: 'Jennifer Lee', prefix: 'SLP' },
  { name: 'Windmill Creek Station', owner: 'James Brown', prefix: 'WCS' },
  { name: 'Eucalyptus Downs', owner: 'Patricia Davis', prefix: 'EUD' },
  { name: 'Wattle Grove Cattle', owner: 'Christopher Taylor', prefix: 'WGC' },
  { name: 'Kookaburra Ridge Farm', owner: 'Amanda White', prefix: 'KRF' },
];

const BREEDS = ['Angus', 'Hereford', 'Brahman', 'Charolais', 'Limousin', 'Simmental', 'Wagyu', 'Murray Grey'];
const SEXES = ['male', 'female'] as const;

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNLIS(index: number): string {
  return `NLIS${String(982000000000 + index).padStart(12, '0')}`;
}

function generateVisualId(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(6, '0')}`;
}

// Generate GPS coordinates near a region with some variance
function generateGPS(baseLat: number, baseLng: number) {
  const variance = 0.5; // ~50km radius
  return {
    lat: (baseLat + (Math.random() - 0.5) * variance).toFixed(6),
    lng: (baseLng + (Math.random() - 0.5) * variance).toFixed(6),
  };
}

async function seed() {
  console.log('🌱 Starting 100k cattle database seed...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    await client`SELECT 1`;
    console.log('✅ Database connection established\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const [user] = await db.insert(users).values({
      openId: 'admin_100k',
      name: 'Demo Admin',
      email: 'admin@icattle.demo',
      role: 'admin',
      loginMethod: 'local',
    }).returning();
    console.log(`   ✅ Created user: ${user.name}\n`);

    // Create 12 diverse farms
    console.log('🏢 Creating 12 farms across Australia...');
    const createdClients = [];
    
    for (let i = 0; i < FARMS.length; i++) {
      const farm = FARMS[i];
      const region = REGIONS[i];
      
      const [newClient] = await db.insert(clients).values({
        name: farm.name,
        contactName: farm.owner,
        email: `${farm.owner.toLowerCase().replace(' ', '.')}@${farm.prefix.toLowerCase()}.com.au`,
        phone: `+61 ${randomInt(2, 8)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
        address: `${randomInt(1, 999)} Pastoral Road, ${region.name}, ${region.state} ${randomInt(2000, 7000)}`,
        abn: `${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
        status: 'active',
        totalCattle: 0,
        propertyName: farm.name,
      }).returning();
      
      createdClients.push({ ...newClient, region, prefix: farm.prefix });
      console.log(`   ✅ ${farm.name} (${region.state})`);
    }
    console.log(`\n✅ Created ${createdClients.length} farms\n`);

    // Generate 100,000 cattle
    console.log('🐄 Generating 100,000 cattle records...');
    console.log('   This will take a few minutes...\n');
    
    const BATCH_SIZE = 1000;
    const TOTAL_CATTLE = 100000;
    const START_ID = 6000000;
    
    let cattleCreated = 0;
    const startTime = Date.now();

    for (let batch = 0; batch < TOTAL_CATTLE / BATCH_SIZE; batch++) {
      const cattleBatch = [];
      
      for (let i = 0; i < BATCH_SIZE; i++) {
        const cattleIndex = batch * BATCH_SIZE + i;
        const cattleId = START_ID + cattleIndex;
        
        // Distribute cattle across farms (weighted by farm size)
        const clientIndex = cattleIndex % createdClients.length;
        const client = createdClients[clientIndex];
        
        const breed = BREEDS[randomInt(0, BREEDS.length - 1)];
        const sex = SEXES[randomInt(0, 1)];
        const birthDate = randomDate(new Date('2018-01-01'), new Date('2023-12-31'));
        const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const baseWeight = sex === 'male' ? 600 : 500;
        const weight = Math.round(baseWeight + age * 50 + randomInt(-50, 50));
        const gps = generateGPS(client.region.lat, client.region.lng);
        
        cattleBatch.push({
          clientId: client.id,
          nlisId: generateNLIS(START_ID + cattleIndex),
          visualId: generateVisualId(client.prefix, cattleIndex),
          breed,
          sex,
          cattleType: 'beef' as const,
          dateOfBirth: birthDate,
          status: 'active' as const,
          currentWeight: weight,
          currentValuation: weight * randomInt(350, 450), // $3.50-$4.50/kg in cents
          acquisitionDate: randomDate(birthDate, new Date()),
          healthStatus: Math.random() > 0.95 ? 'sick' : 'healthy',
          currentLocation: `${client.region.name} ${client.region.state}`,
          latitude: gps.lat,
          longitude: gps.lng,
          biometricId: `BIO${String(START_ID + cattleIndex).padStart(16, '0')}`,
        });
      }
      
      await db.insert(cattle).values(cattleBatch);
      cattleCreated += BATCH_SIZE;
      
      const progress = (cattleCreated / TOTAL_CATTLE * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = Math.round(cattleCreated / (Date.now() - startTime) * 1000);
      
      process.stdout.write(`\r   Progress: ${progress}% (${cattleCreated.toLocaleString()}/${TOTAL_CATTLE.toLocaleString()}) - ${rate}/sec - ${elapsed}s elapsed`);
    }
    
    console.log('\n\n✅ All cattle created!\n');

    // Generate lifecycle events for a sample of cattle
    console.log('📅 Creating lifecycle events for sample cattle...');
    const EVENTS_SAMPLE = 10000; // Add events for 10k cattle
    const eventBatch = [];
    
    for (let i = 0; i < EVENTS_SAMPLE; i++) {
      const cattleId = START_ID + randomInt(0, TOTAL_CATTLE - 1);
      const eventDate = randomDate(new Date('2023-01-01'), new Date());
      const eventTypes = ['weigh_in', 'health_check', 'vaccination', 'movement'] as const;
      const eventType = eventTypes[randomInt(0, eventTypes.length - 1)];
      
      eventBatch.push({
        cattleId,
        eventType,
        eventDate,
        weight: randomInt(400, 700),
        notes: `${eventType.replace('_', ' ')} event`,
        recordedBy: user.id,
      });
      
      if (eventBatch.length >= 1000) {
        await db.insert(lifecycleEvents).values(eventBatch);
        eventBatch.length = 0;
        process.stdout.write(`\r   Created ${i.toLocaleString()} events...`);
      }
    }
    
    if (eventBatch.length > 0) {
      await db.insert(lifecycleEvents).values(eventBatch);
    }
    
    console.log(`\n✅ Created ${EVENTS_SAMPLE.toLocaleString()} lifecycle events\n`);

    // Update client cattle counts
    console.log('📊 Updating farm statistics...');
    for (const client of createdClients) {
      const count = await db.select().from(cattle).where(
        (c: any) => c.clientId === client.id
      );
      
      await db.update(clients)
        .set({ totalCattle: count.length })
        .where((c: any) => c.id === client.id);
    }
    console.log('✅ Farm statistics updated\n');

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 Total Cattle: ${TOTAL_CATTLE.toLocaleString()}`);
    console.log(`🏢 Total Farms: ${createdClients.length}`);
    console.log(`📅 Lifecycle Events: ${EVENTS_SAMPLE.toLocaleString()}`);
    console.log(`🌏 Geographic Coverage: ${REGIONS.length} regions across Australia`);
    console.log(`⏱️  Total Time: ${totalTime}s`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
