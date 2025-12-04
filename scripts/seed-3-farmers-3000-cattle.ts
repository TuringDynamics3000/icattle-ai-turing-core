import postgres from 'postgres';
import 'dotenv/config';

/**
 * SEED 3 FARMERS WITH 3,000 CATTLE
 * =================================
 * Creates 3 diverse farmers across NSW and QLD
 * Each farmer gets 1,000 cattle with realistic data
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// Cattle breeds distribution
const BREEDS = [
  'Angus', 'Hereford', 'Brahman', 'Charolais', 'Limousin',
  'Simmental', 'Murray Grey', 'Shorthorn', 'Droughtmaster', 'Santa Gertrudis'
];

// Cattle types
const CATTLE_TYPES = ['beef', 'dairy', 'breeding', 'feeder'];

// Sex distribution
const SEX_OPTIONS = ['bull', 'steer', 'cow', 'heifer', 'calf'];

// Health status (mostly healthy)
const HEALTH_STATUS = ['healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'sick', 'quarantine'];

// Generate random NLIS ID
function generateNLIS(farmCode: string, index: number): string {
  return `${farmCode}${String(index).padStart(7, '0')}`;
}

// Generate random visual ID
function generateVisualId(farmPrefix: string, index: number): string {
  return `${farmPrefix}-${String(index).padStart(4, '0')}`;
}

// Random date within last 5 years
function randomDateWithinYears(years: number): Date {
  const now = Date.now();
  const yearsInMs = years * 365 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * yearsInMs);
}

// Random weight based on age and type
function randomWeight(ageInMonths: number): number {
  if (ageInMonths < 6) return Math.floor(100 + Math.random() * 100); // Calves: 100-200kg
  if (ageInMonths < 12) return Math.floor(200 + Math.random() * 150); // Young: 200-350kg
  if (ageInMonths < 24) return Math.floor(350 + Math.random() * 200); // Growing: 350-550kg
  return Math.floor(450 + Math.random() * 350); // Mature: 450-800kg
}

// Random valuation based on weight and breed
function randomValuation(weight: number, breed: string): number {
  const basePrice = 350; // $3.50/kg in cents
  const breedPremium = ['Angus', 'Wagyu', 'Hereford'].includes(breed) ? 1.2 : 1.0;
  return Math.floor(weight * basePrice * breedPremium * (0.9 + Math.random() * 0.2));
}

// Random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed3Farmers3000Cattle() {
  console.log('🌱 Seeding 3 farmers with 3,000 cattle...\n');

  try {
    // Define 3 farmers
    const farmers = [
      {
        name: 'Riverside Cattle Station',
        abn: '12345678901',
        contactName: 'John Smith',
        contactEmail: 'john@riverside.com.au',
        contactPhone: '02 6921 1234',
        address: '1234 Sturt Highway',
        state: 'NSW',
        postcode: '2650',
        propertySize: 5000,
        clientType: 'producer',
        status: 'active',
        latitude: '-35.1082',
        longitude: '147.3598',
        farmCode: 'RCS',
        farmPrefix: 'RCS',
        cattleCount: 1000,
      },
      {
        name: 'Highland Breeding Farm',
        abn: '23456789012',
        contactName: 'Sarah Johnson',
        contactEmail: 'sarah@highland.com.au',
        contactPhone: '02 6772 5678',
        address: '567 New England Highway',
        state: 'NSW',
        postcode: '2350',
        propertySize: 3500,
        clientType: 'breeder',
        status: 'active',
        latitude: '-30.5131',
        longitude: '151.6653',
        farmCode: 'HBF',
        farmPrefix: 'HBF',
        cattleCount: 1000,
      },
      {
        name: 'Golden Plains Pastoral',
        abn: '34567890123',
        contactName: 'Michael Chen',
        contactEmail: 'michael@goldenplains.com.au',
        contactPhone: '07 4639 9012',
        address: '890 Warrego Highway',
        state: 'QLD',
        postcode: '4350',
        propertySize: 4200,
        clientType: 'producer',
        status: 'active',
        latitude: '-27.5598',
        longitude: '151.9507',
        farmCode: 'GPP',
        farmPrefix: 'GPP',
        cattleCount: 1000,
      },
    ];

    // Create farmers
    console.log('📋 Creating 3 farmers...');
    const createdFarmers = [];
    
    for (const farmer of farmers) {
      const [client] = await sql`
        INSERT INTO clients (
          name, abn, contact_name, contact_email, contact_phone,
          address, state, postcode, property_size, client_type, status,
          latitude, longitude, created_at, updated_at
        )
        VALUES (
          ${farmer.name}, ${farmer.abn}, ${farmer.contactName}, ${farmer.contactEmail}, ${farmer.contactPhone},
          ${farmer.address}, ${farmer.state}, ${farmer.postcode}, ${farmer.propertySize}, ${farmer.clientType}, ${farmer.status},
          ${farmer.latitude}, ${farmer.longitude}, NOW(), NOW()
        )
        RETURNING *
      `;
      
      createdFarmers.push({ ...client, ...farmer });
      console.log(`   ✅ ${client.name} (ID: ${client.id}, Status: ${client.status})`);
    }
    console.log('');

    // Create cattle for each farmer
    console.log('📋 Creating 3,000 cattle (1,000 per farmer)...');
    let totalCreated = 0;

    for (const farmer of createdFarmers) {
      console.log(`   🐄 Creating ${farmer.cattleCount} cattle for ${farmer.name}...`);
      
      const cattleBatch = [];
      
      for (let i = 1; i <= farmer.cattleCount; i++) {
        const dateOfBirth = randomDateWithinYears(5);
        const ageInMonths = Math.floor((Date.now() - dateOfBirth.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const weight = randomWeight(ageInMonths);
        const breed = randomElement(BREEDS);
        const valuation = randomValuation(weight, breed);
        const acquisitionDate = randomDateWithinYears(3);

        cattleBatch.push({
          nlisId: generateNLIS(farmer.farmCode, i),
          visualId: generateVisualId(farmer.farmPrefix, i),
          breed: breed,
          sex: randomElement(SEX_OPTIONS),
          dateOfBirth: dateOfBirth,
          clientId: farmer.id,
          currentLocation: farmer.address,
          currentWeight: weight,
          lastWeighDate: randomDateWithinYears(0.5),
          cattleType: randomElement(CATTLE_TYPES),
          healthStatus: randomElement(HEALTH_STATUS),
          lastHealthCheck: randomDateWithinYears(0.25),
          currentValuation: valuation,
          lastValuationDate: randomDateWithinYears(0.25),
          acquisitionCost: Math.floor(valuation * (0.8 + Math.random() * 0.3)),
          acquisitionDate: acquisitionDate,
          status: 'active',
          gpsLat: parseFloat(farmer.latitude) + (Math.random() - 0.5) * 0.1,
          gpsLng: parseFloat(farmer.longitude) + (Math.random() - 0.5) * 0.1,
        });
      }

      // Insert in batches of 100 for better performance
      const batchSize = 100;
      for (let i = 0; i < cattleBatch.length; i += batchSize) {
        const batch = cattleBatch.slice(i, i + batchSize);
        
        await sql`
          INSERT INTO cattle ${sql(batch, 
            'nlisId', 'visualId', 'breed', 'sex', 'dateOfBirth', 'clientId',
            'currentLocation', 'currentWeight', 'lastWeighDate', 'cattleType',
            'healthStatus', 'lastHealthCheck', 'currentValuation', 'lastValuationDate',
            'acquisitionCost', 'acquisitionDate', 'status', 'gpsLat', 'gpsLng'
          )}
        `;
        
        totalCreated += batch.length;
        process.stdout.write(`\r      Progress: ${totalCreated}/${farmer.cattleCount * createdFarmers.length} cattle created...`);
      }
      
      console.log(`\n      ✅ ${farmer.name}: ${farmer.cattleCount} cattle created\n`);
    }

    // Verify the seeding
    console.log('📋 Verifying seeding...');
    
    const clientStats = await sql`
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(ca.id) as cattle_count,
        SUM(ca.current_valuation) as total_value,
        AVG(ca.current_valuation) as avg_value,
        AVG(ca.current_weight) as avg_weight
      FROM clients c
      LEFT JOIN cattle ca ON ca.client_id = c.id AND ca.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.status
      ORDER BY c.id
    `;

    console.log('\n   📊 Final Statistics:');
    console.log('   ' + '='.repeat(80));
    
    let grandTotal = 0;
    let grandTotalValue = 0;
    
    clientStats.forEach(stat => {
      const count = Number(stat.cattle_count);
      const totalValue = Number(stat.total_value) / 100;
      const avgValue = Number(stat.avg_value) / 100;
      const avgWeight = Number(stat.avg_weight);
      
      grandTotal += count;
      grandTotalValue += totalValue;
      
      console.log(`   ${stat.name}:`);
      console.log(`      - Cattle: ${count.toLocaleString()}`);
      console.log(`      - Total Value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`      - Avg Value: $${avgValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`      - Avg Weight: ${avgWeight.toFixed(0)} kg`);
      console.log('');
    });

    console.log('   ' + '='.repeat(80));
    console.log(`   TOTAL: ${grandTotal.toLocaleString()} cattle worth $${grandTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log('   ' + '='.repeat(80));

    console.log('\n✅ Seeding complete!');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed3Farmers3000Cattle();
