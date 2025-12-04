import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL not found in environment variables');
}

const sql = postgres(DATABASE_URL);

async function create3Farmers() {
  console.log('🌱 Creating 3 farmers and redistributing 1,000 cattle...\n');

  try {
    // Define 3 diverse farmers
    const farmers = [
      {
        name: 'Riverside Cattle Station',
        location: 'Wagga Wagga, NSW',
        region: 'Riverina',
        lat: -35.1082,
        lng: 147.3598,
        cattleCount: 450, // 45% of herd
      },
      {
        name: 'Highland Breeding Farm',
        location: 'Armidale, NSW',
        region: 'Northern Tablelands',
        lat: -30.5131,
        lng: 151.6653,
        cattleCount: 350, // 35% of herd
      },
      {
        name: 'Golden Plains Pastoral',
        location: 'Toowoomba, QLD',
        region: 'Darling Downs',
        lat: -27.5598,
        lng: 151.9507,
        cattleCount: 200, // 20% of herd
      },
    ];

    // Step 1: Clear existing clients
    console.log('📋 Step 1: Clearing existing clients...');
    await sql`DELETE FROM clients`;
    console.log('✅ Existing clients cleared\n');

    // Step 2: Create 3 new farmers
    console.log('📋 Step 2: Creating 3 new farmers...');
    const createdFarmers = [];
    
    for (const farmer of farmers) {
      const [client] = await sql`
        INSERT INTO clients (name, location, region)
        VALUES (${farmer.name}, ${farmer.location}, ${farmer.region})
        RETURNING id, name, location, region
      `;
      createdFarmers.push({ ...client, ...farmer });
      console.log(`✅ Created: ${client.name} (${client.location})`);
    }
    console.log('');

    // Step 3: Get all cattle IDs
    console.log('📋 Step 3: Getting all cattle...');
    const allCattle = await sql`
      SELECT id FROM cattle ORDER BY id
    `;
    console.log(`✅ Found ${allCattle.length} cattle\n`);

    // Step 4: Redistribute cattle among farmers
    console.log('📋 Step 4: Redistributing cattle among farmers...');
    
    let cattleIndex = 0;
    for (const farmer of createdFarmers) {
      const cattleToAssign = allCattle.slice(cattleIndex, cattleIndex + farmer.cattleCount);
      const cattleIds = cattleToAssign.map(c => c.id);
      
      if (cattleIds.length > 0) {
        await sql`
          UPDATE cattle 
          SET 
            client_id = ${farmer.id},
            current_location = ${farmer.location},
            gps_lat = ${farmer.lat},
            gps_lng = ${farmer.lng}
          WHERE id = ANY(${cattleIds})
        `;
        
        console.log(`✅ ${farmer.name}: Assigned ${cattleIds.length} cattle`);
        console.log(`   Location: ${farmer.location}`);
        console.log(`   GPS: ${farmer.lat}, ${farmer.lng}\n`);
      }
      
      cattleIndex += farmer.cattleCount;
    }

    // Step 5: Verify distribution
    console.log('📋 Step 5: Verifying distribution...\n');
    const distribution = await sql`
      SELECT 
        c.name as farmer_name,
        c.location,
        COUNT(ca.id) as cattle_count
      FROM clients c
      LEFT JOIN cattle ca ON ca.client_id = c.id
      GROUP BY c.id, c.name, c.location
      ORDER BY cattle_count DESC
    `;

    console.log('📊 Final Distribution:');
    console.log('┌─────────────────────────────────┬──────────────────────┬──────────────┐');
    console.log('│ Farmer                          │ Location             │ Cattle Count │');
    console.log('├─────────────────────────────────┼──────────────────────┼──────────────┤');
    
    let totalCattle = 0;
    for (const row of distribution) {
      const count = Number(row.cattle_count);
      totalCattle += count;
      console.log(
        `│ ${row.farmer_name.padEnd(31)} │ ${row.location.padEnd(20)} │ ${String(count).padStart(12)} │`
      );
    }
    
    console.log('├─────────────────────────────────┴──────────────────────┼──────────────┤');
    console.log(`│ TOTAL                                                  │ ${String(totalCattle).padStart(12)} │`);
    console.log('└────────────────────────────────────────────────────────┴──────────────┘\n');

    console.log('✅ Successfully created 3 farmers and redistributed cattle!');
    console.log('🎉 Demo is ready with diverse farmer ownership!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

create3Farmers();
