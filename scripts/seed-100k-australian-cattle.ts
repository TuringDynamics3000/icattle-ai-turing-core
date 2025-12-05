import postgres from 'postgres';
import 'dotenv/config';

/**
 * SEED 100,000 AUSTRALIAN BEEF CATTLE
 * ====================================
 * Creates realistic Australian beef cattle dataset with:
 * - 20+ farms across all Australian states
 * - Authentic Australian beef breeds
 * - Realistic geographic distribution
 * - Industry-standard metrics
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// Australian beef cattle breeds with market distribution
const AUSTRALIAN_BREEDS = [
  { name: 'Angus', weight: 25 },           // Most popular
  { name: 'Hereford', weight: 15 },
  { name: 'Brahman', weight: 12 },         // Northern Australia
  { name: 'Charolais', weight: 10 },
  { name: 'Droughtmaster', weight: 8 },    // Tropical breeds
  { name: 'Santa Gertrudis', weight: 7 },
  { name: 'Limousin', weight: 6 },
  { name: 'Murray Grey', weight: 5 },      // Australian breed
  { name: 'Shorthorn', weight: 4 },
  { name: 'Simmental', weight: 3 },
  { name: 'Wagyu', weight: 2 },            // Premium
  { name: 'Belmont Red', weight: 2 },      // Australian breed
  { name: 'Brangus', weight: 1 },
];

// Cattle types distribution
const CATTLE_TYPES = [
  { type: 'beef', weight: 70 },
  { type: 'breeding', weight: 20 },
  { type: 'feeder', weight: 10 },
];

// Sex distribution
const SEX_OPTIONS = [
  { sex: 'steer', weight: 40 },
  { sex: 'cow', weight: 35 },
  { sex: 'heifer', weight: 15 },
  { sex: 'bull', weight: 8 },
  { sex: 'calf', weight: 2 },
];

// Health status (realistic distribution)
const HEALTH_STATUS = [
  { status: 'healthy', weight: 92 },
  { status: 'sick', weight: 5 },
  { status: 'quarantine', weight: 3 },
];

// 25 Australian cattle farms across all states
const AUSTRALIAN_FARMS = [
  // Queensland (30% of cattle)
  { name: 'Kidman Cattle Station', state: 'QLD', region: 'Channel Country', lat: -25.2744, lng: 139.5068, size: 15000, type: 'producer', cattle: 12000 },
  { name: 'Consolidated Pastoral', state: 'QLD', region: 'Gulf Country', lat: -18.2871, lng: 142.1599, size: 12000, type: 'producer', cattle: 10000 },
  { name: 'Stanbroke Pastoral', state: 'QLD', region: 'Central Queensland', lat: -23.3382, lng: 150.5144, size: 10000, type: 'producer', cattle: 8000 },
  { name: 'Darling Downs Beef', state: 'QLD', region: 'Darling Downs', lat: -27.5598, lng: 151.9507, size: 5000, type: 'feedlot', cattle: 6000 },
  
  // New South Wales (25% of cattle)
  { name: 'Australian Agricultural Company', state: 'NSW', region: 'Northern Tablelands', lat: -30.5131, lng: 151.6653, size: 8000, type: 'producer', cattle: 10000 },
  { name: 'Riverina Beef Producers', state: 'NSW', region: 'Riverina', lat: -35.1082, lng: 147.3598, size: 6000, type: 'producer', cattle: 7000 },
  { name: 'New England Pastoral', state: 'NSW', region: 'New England', lat: -31.0927, lng: 151.1647, size: 5000, type: 'breeder', cattle: 5000 },
  { name: 'Western Plains Cattle Co', state: 'NSW', region: 'Western Plains', lat: -32.7920, lng: 147.8632, size: 4000, type: 'producer', cattle: 3000 },
  
  // Northern Territory (15% of cattle)
  { name: 'Tipperary Station', state: 'NT', region: 'Top End', lat: -13.4784, lng: 131.1129, size: 20000, type: 'producer', cattle: 8000 },
  { name: 'Wave Hill Station', state: 'NT', region: 'Victoria River', lat: -17.3975, lng: 130.8189, size: 18000, type: 'producer', cattle: 7000 },
  
  // Western Australia (10% of cattle)
  { name: 'Kimberley Pastoral', state: 'WA', region: 'Kimberley', lat: -17.5549, lng: 124.2906, size: 15000, type: 'producer', cattle: 6000 },
  { name: 'Pilbara Cattle Co', state: 'WA', region: 'Pilbara', lat: -22.5689, lng: 117.8920, size: 8000, type: 'producer', cattle: 4000 },
  
  // South Australia (8% of cattle)
  { name: 'Flinders Ranges Beef', state: 'SA', region: 'Flinders Ranges', lat: -31.5333, lng: 138.6333, size: 4000, type: 'producer', cattle: 4000 },
  { name: 'Yorke Peninsula Pastoral', state: 'SA', region: 'Yorke Peninsula', lat: -34.3667, lng: 137.5667, size: 3000, type: 'producer', cattle: 4000 },
  
  // Victoria (10% of cattle)
  { name: 'Gippsland Premium Beef', state: 'VIC', region: 'Gippsland', lat: -37.8333, lng: 147.1333, size: 3000, type: 'producer', cattle: 5000 },
  { name: 'Western District Cattle', state: 'VIC', region: 'Western District', lat: -38.1667, lng: 142.5000, size: 2500, type: 'breeder', cattle: 5000 },
  
  // Tasmania (2% of cattle)
  { name: 'Tasmanian Premium Beef', state: 'TAS', region: 'Midlands', lat: -42.1333, lng: 147.1333, size: 1500, type: 'producer', cattle: 2000 },
  
  // Additional diversification
  { name: 'Central Queensland Feedlot', state: 'QLD', region: 'Central Highlands', lat: -23.8333, lng: 148.6000, size: 2000, type: 'feedlot', cattle: 5000 },
  { name: 'Hunter Valley Beef', state: 'NSW', region: 'Hunter Valley', lat: -32.7167, lng: 151.2000, size: 2000, type: 'producer', cattle: 3000 },
  { name: 'Barkly Tableland Station', state: 'NT', region: 'Barkly', lat: -19.6500, lng: 135.8833, size: 12000, type: 'producer', cattle: 5000 },
  { name: 'Gascoyne Pastoral', state: 'WA', region: 'Gascoyne', lat: -24.8833, lng: 113.6500, size: 6000, type: 'producer', cattle: 3000 },
  { name: 'Eyre Peninsula Beef', state: 'SA', region: 'Eyre Peninsula', lat: -33.8667, lng: 135.8667, size: 2500, type: 'producer', cattle: 2000 },
  { name: 'High Country Cattle Co', state: 'VIC', region: 'High Country', lat: -36.7333, lng: 146.9167, size: 2000, type: 'breeder', cattle: 2000 },
  { name: 'North West Pastoral', state: 'TAS', region: 'North West', lat: -41.1833, lng: 145.7333, size: 1000, type: 'producer', cattle: 1000 },
  { name: 'Atherton Tablelands Beef', state: 'QLD', region: 'Atherton Tablelands', lat: -17.2667, lng: 145.4667, size: 3000, type: 'producer', cattle: 3000 },
];

// Weighted random selection
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

function generateNLIS(stateCode: string, farmId: number, index: number): string {
  return `${stateCode}${String(farmId).padStart(3, '0')}${String(index).padStart(7, '0')}`;
}

function generateVisualId(farmPrefix: string, index: number): string {
  return `${farmPrefix}-${String(index).padStart(5, '0')}`;
}

function randomDateWithinYears(years: number): Date {
  const now = Date.now();
  const yearsInMs = years * 365 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * yearsInMs);
}

function randomWeight(ageInMonths: number, breed: string): number {
  // Wagyu and premium breeds are lighter
  const breedFactor = breed === 'Wagyu' ? 0.85 : 1.0;
  
  if (ageInMonths < 6) return Math.floor((100 + Math.random() * 100) * breedFactor);
  if (ageInMonths < 12) return Math.floor((200 + Math.random() * 150) * breedFactor);
  if (ageInMonths < 24) return Math.floor((350 + Math.random() * 200) * breedFactor);
  return Math.floor((450 + Math.random() * 350) * breedFactor);
}

function randomValuation(weight: number, breed: string): number {
  // Australian beef prices (in cents per kg)
  let basePrice = 380; // $3.80/kg average
  
  // Premium breeds
  if (breed === 'Wagyu') basePrice = 950;
  else if (breed === 'Angus') basePrice = 420;
  else if (breed === 'Murray Grey') basePrice = 400;
  
  // Market variation
  const marketFactor = 0.85 + Math.random() * 0.3;
  
  return Math.floor(weight * basePrice * marketFactor);
}

async function seed100kCattle() {
  console.log('🐄 SEEDING 100,000 AUSTRALIAN BEEF CATTLE');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Create farms
    console.log('📋 Creating 25 Australian cattle farms...');
    const createdFarms = [];
    
    for (let i = 0; i < AUSTRALIAN_FARMS.length; i++) {
      const farm = AUSTRALIAN_FARMS[i];
      const [client] = await sql`
        INSERT INTO clients (
          name, contact_name, contact_email, contact_phone,
          address, state, postcode, property_size, client_type, status,
          latitude, longitude, created_at, updated_at
        )
        VALUES (
          ${farm.name},
          ${'Station Manager'},
          ${farm.name.toLowerCase().replace(/\s+/g, '') + '@example.com'},
          ${'1800 ' + String(100000 + i).slice(-6)},
          ${farm.region + ', ' + farm.state},
          ${farm.state},
          ${'0000'},
          ${farm.size},
          ${farm.type},
          ${'active'},
          ${farm.lat.toString()},
          ${farm.lng.toString()},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      
      createdFarms.push({ ...client, ...farm });
      console.log(`   ✅ ${farm.name} (${farm.state}) - ${farm.cattle.toLocaleString()} cattle`);
    }
    
    console.log('');
    console.log('📋 Creating 100,000 cattle with Australian breed distribution...');
    console.log('');
    
    let totalCreated = 0;
    const batchSize = 500;
    
    for (const farm of createdFarms) {
      const farmPrefix = farm.state + farm.id;
      console.log(`   🐄 ${farm.name}: Creating ${farm.cattle.toLocaleString()} cattle...`);
      
      for (let batch = 0; batch < Math.ceil(farm.cattle / batchSize); batch++) {
        const cattleInBatch = Math.min(batchSize, farm.cattle - (batch * batchSize));
        const cattleBatch = [];
        
        for (let i = 0; i < cattleInBatch; i++) {
          const globalIndex = totalCreated + i + 1;
          const breed = weightedRandom(AUSTRALIAN_BREEDS).name;
          const cattleType = weightedRandom(CATTLE_TYPES).type;
          const sex = weightedRandom(SEX_OPTIONS).sex;
          const healthStatus = weightedRandom(HEALTH_STATUS).status;
          
          const dateOfBirth = randomDateWithinYears(6);
          const ageInMonths = Math.floor((Date.now() - dateOfBirth.getTime()) / (30 * 24 * 60 * 60 * 1000));
          const weight = randomWeight(ageInMonths, breed);
          const valuation = randomValuation(weight, breed);
          
          cattleBatch.push({
            nlisId: generateNLIS(farm.state, farm.id, globalIndex),
            visualId: generateVisualId(farmPrefix, globalIndex),
            breed,
            sex,
            dateOfBirth,
            clientId: farm.id,
            currentLocation: farm.region + ', ' + farm.state,
            currentWeight: weight,
            lastWeighDate: randomDateWithinYears(0.5),
            cattleType,
            healthStatus,
            lastHealthCheck: randomDateWithinYears(0.25),
            currentValuation: valuation,
            lastValuationDate: randomDateWithinYears(0.25),
            acquisitionCost: Math.floor(valuation * (0.75 + Math.random() * 0.35)),
            acquisitionDate: randomDateWithinYears(4),
            status: 'active',
            gpsLat: farm.lat + (Math.random() - 0.5) * 0.2,
            gpsLng: farm.lng + (Math.random() - 0.5) * 0.2,
          });
        }
        
        await sql`
          INSERT INTO cattle ${sql(cattleBatch,
            'nlisId', 'visualId', 'breed', 'sex', 'dateOfBirth', 'clientId',
            'currentLocation', 'currentWeight', 'lastWeighDate', 'cattleType',
            'healthStatus', 'lastHealthCheck', 'currentValuation', 'lastValuationDate',
            'acquisitionCost', 'acquisitionDate', 'status', 'gpsLat', 'gpsLng'
          )}
        `;
        
        totalCreated += cattleInBatch;
        process.stdout.write(`\r      Progress: ${totalCreated.toLocaleString()}/100,000 cattle created (${((totalCreated/100000)*100).toFixed(1)}%)...`);
      }
      
      console.log(`\n      ✅ ${farm.name}: ${farm.cattle.toLocaleString()} cattle complete\n`);
    }
    
    // Final statistics
    console.log('\n📊 Verifying database...');
    
    const stats = await sql`
      SELECT 
        COUNT(*) as total_cattle,
        SUM(current_valuation) as total_value,
        AVG(current_valuation) as avg_value,
        AVG(current_weight) as avg_weight
      FROM cattle
      WHERE status = 'active'
    `;
    
    const breedStats = await sql`
      SELECT 
        breed,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
      FROM cattle
      WHERE status = 'active'
      GROUP BY breed
      ORDER BY count DESC
    `;
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(80));
    console.log(`Total Cattle: ${Number(stats[0].total_cattle).toLocaleString()}`);
    console.log(`Total Value: $${(Number(stats[0].total_value) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log(`Average Value: $${(Number(stats[0].avg_value) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log(`Average Weight: ${Number(stats[0].avg_weight).toFixed(0)} kg`);
    console.log('');
    console.log('Breed Distribution:');
    breedStats.forEach(stat => {
      console.log(`  ${stat.breed.padEnd(20)} ${Number(stat.count).toLocaleString().padStart(8)} (${stat.percentage}%)`);
    });
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed100kCattle();
