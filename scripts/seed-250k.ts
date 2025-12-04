/**
 * Comprehensive 250k Cattle Database Seed Script
 * Creates a fresh, compliant database with 250,000 cattle across 20 diverse Australian farms
 */

import 'dotenv/config';
import postgres from "postgres";

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateNLIS(index: number): string {
  return `NLIS${String(index).padStart(15, '0')}`;
}

function generateVisualId(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(6, '0')}`;
}

function generateGPS(baseLat: number, baseLng: number, variance: number = 0.5) {
  return {
    lat: (baseLat + (Math.random() - 0.5) * variance).toFixed(6),
    lng: (baseLng + (Math.random() - 0.5) * variance).toFixed(6),
  };
}

// Farm and region data
const FARMS = [
  { name: 'Riverside Cattle Station', owner: 'John Mitchell', prefix: 'RCS', state: 'NSW', region: 'Riverina', lat: -35.0282, lng: 147.3598 },
  { name: 'Highland Breeding Farm', owner: 'Sarah Thompson', prefix: 'HBF', state: 'NSW', region: 'Northern Tablelands', lat: -30.5, lng: 151.6 },
  { name: 'Golden Plains Pastoral', owner: 'Robert Chen', prefix: 'GPP', state: 'QLD', region: 'Darling Downs', lat: -27.5, lng: 151.9 },
  { name: 'Sunset Ridge Station', owner: 'Emma Wilson', prefix: 'SRS', state: 'QLD', region: 'Central Queensland', lat: -23.5, lng: 148.2 },
  { name: 'Ironbark Cattle Co', owner: 'Michael Brown', prefix: 'IBC', state: 'VIC', region: 'Gippsland', lat: -37.8, lng: 147.1 },
  { name: 'Bluegrass Livestock', owner: 'Jennifer Davis', prefix: 'BGL', state: 'VIC', region: 'Western District', lat: -38.1, lng: 142.5 },
  { name: 'Redgum Valley Ranch', owner: 'David Anderson', prefix: 'RVR', state: 'SA', region: 'South East', lat: -37.5, lng: 140.8 },
  { name: 'Silverleaf Pastoral', owner: 'Lisa Martin', prefix: 'SLP', state: 'SA', region: 'Mid North', lat: -33.8, lng: 138.6 },
  { name: 'Windmill Creek Station', owner: 'James Taylor', prefix: 'WCS', state: 'WA', region: 'South West', lat: -33.9, lng: 115.8 },
  { name: 'Eucalyptus Downs', owner: 'Patricia White', prefix: 'EUD', state: 'WA', region: 'Great Southern', lat: -34.5, lng: 117.9 },
  { name: 'Wattle Grove Cattle', owner: 'Thomas Harris', prefix: 'WGC', state: 'TAS', region: 'North West', lat: -41.2, lng: 145.8 },
  { name: 'Kookaburra Ridge Farm', owner: 'Margaret Lee', prefix: 'KRF', state: 'NT', region: 'Top End', lat: -12.5, lng: 131.0 },
  { name: 'Outback Heritage Station', owner: 'Christopher Moore', prefix: 'OHS', state: 'QLD', region: 'Channel Country', lat: -25.5, lng: 141.5 },
  { name: 'Coastal Breeze Ranch', owner: 'Amanda Clark', prefix: 'CBR', state: 'NSW', region: 'Mid North Coast', lat: -31.4, lng: 152.9 },
  { name: 'Mountain View Pastoral', owner: 'Daniel Rodriguez', prefix: 'MVP', state: 'VIC', region: 'High Country', lat: -36.9, lng: 147.3 },
  { name: 'Desert Springs Station', owner: 'Michelle Garcia', prefix: 'DSS', state: 'SA', region: 'Far North', lat: -29.0, lng: 137.8 },
  { name: 'Tropical Cattle Co', owner: 'Kevin Martinez', prefix: 'TCC', state: 'QLD', region: 'Far North Queensland', lat: -16.9, lng: 145.8 },
  { name: 'Southern Cross Ranch', owner: 'Nancy Robinson', prefix: 'SCR', state: 'WA', region: 'Wheatbelt', lat: -31.2, lng: 119.3 },
  { name: 'Pioneer Valley Farm', owner: 'Brian Walker', prefix: 'PVF', state: 'NSW', region: 'Hunter Valley', lat: -32.8, lng: 151.2 },
  { name: 'Heritage Hills Station', owner: 'Carol Young', prefix: 'HHS', state: 'QLD', region: 'Granite Belt', lat: -28.8, lng: 151.9 },
];

const BREEDS = ['Angus', 'Hereford', 'Brahman', 'Charolais', 'Limousin', 'Simmental', 'Wagyu', 'Murray Grey'];
const SEXES = ['male', 'female'] as const;

async function seed() {
  console.log('🌱 Starting 250k cattle database seed...\n');
  console.log('⚠️  This will TRUNCATE all existing data!\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    await sql`SELECT 1`;
    console.log('✅ Database connection established\n');

    // STEP 1: Truncate all tables
    console.log('🗑️  Truncating all tables...');
    await sql`TRUNCATE TABLE lifecycle_events CASCADE`;
    await sql`TRUNCATE TABLE valuations CASCADE`;
    await sql`TRUNCATE TABLE cattle CASCADE`;
    await sql`TRUNCATE TABLE clients CASCADE`;
    await sql`TRUNCATE TABLE users CASCADE`;
    await sql`TRUNCATE TABLE notifications CASCADE`;
    await sql`TRUNCATE TABLE market_data CASCADE`;
    await sql`TRUNCATE TABLE financial_reports CASCADE`;
    
    // Reset sequences
    await sql`ALTER SEQUENCE IF EXISTS cattle_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE IF EXISTS clients_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1`;
    console.log('✅ All tables truncated and sequences reset\n');

    // STEP 2: Create admin user
    console.log('👤 Creating admin user...');
    await sql`
      INSERT INTO users (open_id, name, email, role, login_method, last_signed_in)
      VALUES ('admin_250k', 'Demo Admin', 'admin@icattle.demo', 'admin', 'demo', NOW())
    `;
    console.log('✅ Admin user created\n');

    // STEP 3: Create farms (clients)
    console.log(`🏢 Creating ${FARMS.length} farms across Australia...`);
    const clientIds: number[] = [];
    
    for (const farm of FARMS) {
      const result = await sql`
        INSERT INTO clients (
          name, contact_name, email, phone, address, abn, 
          status, total_cattle, property_name
        ) VALUES (
          ${farm.name},
          ${farm.owner},
          ${farm.owner.toLowerCase().replace(' ', '.')}@${farm.prefix.toLowerCase()}.com.au,
          ${`+61 ${randomInt(2, 8)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`},
          ${`${randomInt(1, 999)} Pastoral Road, ${farm.region}, ${farm.state} ${randomInt(2000, 7000)}`},
          ${`${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)} ${randomInt(100, 999)}`},
          'active',
          0,
          ${farm.name}
        ) RETURNING id
      `;
      clientIds.push(result[0].id);
      console.log(`   ✅ ${farm.name} (${farm.state} - ${farm.region})`);
    }
    console.log(`\n✅ Created ${clientIds.length} farms\n`);

    // STEP 4: Generate 250,000 cattle
    console.log('🐄 Generating 250,000 cattle records...');
    console.log('   This will take several minutes...\n');
    
    const BATCH_SIZE = 1000;
    const TOTAL_CATTLE = 250000;
    
    let cattleCreated = 0;
    const startTime = Date.now();

    for (let batch = 0; batch < TOTAL_CATTLE / BATCH_SIZE; batch++) {
      const values: string[] = [];
      
      for (let i = 0; i < BATCH_SIZE; i++) {
        const cattleIndex = batch * BATCH_SIZE + i;
        
        // Distribute cattle across farms
        const farmIndex = cattleIndex % FARMS.length;
        const farm = FARMS[farmIndex];
        const clientId = clientIds[farmIndex];
        
        const breed = BREEDS[randomInt(0, BREEDS.length - 1)];
        const sex = SEXES[randomInt(0, 1)];
        const birthDate = randomDate(new Date('2018-01-01'), new Date('2023-12-31'));
        const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const baseWeight = sex === 'male' ? 600 : 500;
        const weight = Math.round(baseWeight + age * 50 + randomInt(-50, 50));
        const valuation = weight * randomInt(350, 450); // $3.50-$4.50/kg in cents
        const gps = generateGPS(farm.lat, farm.lng);
        const nlisId = generateNLIS(cattleIndex);
        const visualId = generateVisualId(farm.prefix, cattleIndex);
        const biometricId = `BIO${String(cattleIndex).padStart(16, '0')}`;
        const healthStatus = Math.random() > 0.95 ? 'sick' : 'healthy';
        const acquisitionDate = randomDate(birthDate, new Date());
        
        values.push(`(
          ${clientId},
          '${nlisId}',
          '${visualId}',
          '${breed}',
          '${sex}',
          'beef',
          '${birthDate.toISOString()}',
          'active',
          ${weight},
          ${valuation},
          '${acquisitionDate.toISOString()}',
          '${healthStatus}',
          '${farm.region} ${farm.state}',
          ${gps.lat},
          ${gps.lng},
          '${biometricId}'
        )`);
      }
      
      // Batch insert using raw SQL for maximum performance
      await sql.unsafe(`
        INSERT INTO cattle (
          client_id, nlis_id, visual_id, breed, sex, cattle_type,
          date_of_birth, status, current_weight, current_valuation,
          acquisition_date, health_status, current_location,
          latitude, longitude, biometric_id
        ) VALUES ${values.join(',')}
      `);
      
      cattleCreated += BATCH_SIZE;
      
      const progress = (cattleCreated / TOTAL_CATTLE * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = Math.round(cattleCreated / (Date.now() - startTime) * 1000);
      const remaining = Math.round((TOTAL_CATTLE - cattleCreated) / rate);
      
      process.stdout.write(`\r   Progress: ${progress}% (${cattleCreated.toLocaleString()}/${TOTAL_CATTLE.toLocaleString()}) - ${rate}/sec - ${elapsed}s elapsed - ~${remaining}s remaining`);
    }
    
    console.log('\n\n✅ All 250,000 cattle created!\n');

    // STEP 5: Generate lifecycle events
    console.log('📅 Creating lifecycle events for sample cattle...');
    const EVENTS_COUNT = 25000; // 10% of cattle
    const eventValues: string[] = [];
    
    for (let i = 0; i < EVENTS_COUNT; i++) {
      const cattleId = randomInt(1, TOTAL_CATTLE);
      const eventDate = randomDate(new Date('2023-01-01'), new Date());
      const eventTypes = ['weigh_in', 'health_check', 'vaccination', 'movement'];
      const eventType = eventTypes[randomInt(0, eventTypes.length - 1)];
      const weight = randomInt(400, 700);
      
      eventValues.push(`(
        ${cattleId},
        '${eventType}',
        '${eventDate.toISOString()}',
        ${weight},
        '${eventType.replace('_', ' ')} event'
      )`);
      
      if (eventValues.length >= 1000 || i === EVENTS_COUNT - 1) {
        await sql.unsafe(`
          INSERT INTO lifecycle_events (
            cattle_id, event_type, event_date, weight, notes
          ) VALUES ${eventValues.join(',')}
        `);
        eventValues.length = 0;
      }
    }
    
    console.log(`✅ Created ${EVENTS_COUNT.toLocaleString()} lifecycle events\n`);

    // STEP 6: Final statistics
    console.log('📊 Verifying database...');
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM cattle) as total_cattle,
        (SELECT COUNT(*) FROM cattle WHERE status = 'active') as active_cattle,
        (SELECT COUNT(*) FROM clients) as total_farms,
        (SELECT COUNT(*) FROM lifecycle_events) as total_events,
        (SELECT SUM(current_valuation) FROM cattle) as total_value
    `;
    
    const totalValue = Number(stats[0].total_value) / 100; // Convert cents to dollars
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Total Cattle: ${Number(stats[0].total_cattle).toLocaleString()}`);
    console.log(`✅ Active Cattle: ${Number(stats[0].active_cattle).toLocaleString()}`);
    console.log(`✅ Farms: ${stats[0].total_farms}`);
    console.log(`✅ Lifecycle Events: ${Number(stats[0].total_events).toLocaleString()}`);
    console.log(`✅ Total Portfolio Value: $${totalValue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed().catch(console.error);
