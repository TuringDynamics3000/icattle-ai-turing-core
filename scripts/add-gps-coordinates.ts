#!/usr/bin/env tsx
/**
 * Add GPS Coordinates to Farms and Cattle
 * Places cattle in rural grazing areas away from towns
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cattle, clients } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function addGPSCoordinates() {
  console.log('📍 Adding GPS coordinates to farms and cattle...\n');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  try {
    // Get all farms
    const farms = await db.select().from(clients);
    console.log(`🏢 Found ${farms.length} farms\n`);

    // Define rural GPS coordinates for each farm (away from towns)
    const farmLocations: Record<string, { lat: number; lng: number; name: string }> = {
      'Riverside Cattle Station': {
        name: 'Riverside Cattle Station',
        lat: -35.2847,  // Rural area 40km west of Wagga Wagga, NSW
        lng: 147.0234,
      },
      'Highland Breeding Farm': {
        name: 'Highland Breeding Farm',
        lat: -30.7234,  // Rural area 50km north of Armidale, NSW
        lng: 151.4567,
      },
      'Outback Beef Co': {
        name: 'Outback Beef Co',
        lat: -23.6789,  // Rural area 60km south of Longreach, QLD
        lng: 144.0123,
      },
      'Southern Cross Pastoral': {
        name: 'Southern Cross Pastoral',
        lat: -37.9876,  // Rural area 35km east of Mount Gambier, SA
        lng: 140.9234,
      },
      'Northern Territory Cattle Co': {
        name: 'Northern Territory Cattle Co',
        lat: -14.2345,  // Rural area 80km southwest of Katherine, NT
        lng: 132.0456,
      },
    };

    // Update farm locations
    for (const farm of farms) {
      const location = farmLocations[farm.name];
      if (location) {
        await db
          .update(clients)
          .set({
            latitude: location.lat,
            longitude: location.lng,
          })
          .where(eq(clients.id, farm.id));
        
        console.log(`✅ ${farm.name}: ${location.lat}, ${location.lng}`);
      }
    }

    console.log('\n🐄 Adding GPS coordinates to cattle...\n');

    // Get all cattle grouped by farm
    const allCattle = await db.select().from(cattle);
    
    let updated = 0;
    for (const cow of allCattle) {
      // Find the farm this cattle belongs to
      const farm = farms.find(f => f.id === cow.clientId);
      if (!farm) continue;

      const farmLocation = farmLocations[farm.name];
      if (!farmLocation) continue;

      // Add random offset to place cattle in grazing areas around the farm
      // Spread cattle within ~5km radius of farm center
      const latOffset = (Math.random() - 0.5) * 0.09; // ~5km in latitude
      const lngOffset = (Math.random() - 0.5) * 0.09; // ~5km in longitude

      const cattleLat = farmLocation.lat + latOffset;
      const cattleLng = farmLocation.lng + lngOffset;

      await db
        .update(cattle)
        .set({
          currentLatitude: cattleLat,
          currentLongitude: cattleLng,
        })
        .where(eq(cattle.id, cow.id));

      updated++;
      
      if (updated % 50 === 0) {
        console.log(`   ✅ Updated ${updated}/${allCattle.length} cattle...`);
      }
    }

    console.log(`\n✅ GPS coordinates added!`);
    console.log(`   - Farms: ${farms.length}`);
    console.log(`   - Cattle: ${updated}`);

    console.log('\n📊 Farm Locations:');
    for (const [name, loc] of Object.entries(farmLocations)) {
      console.log(`   - ${name}: ${loc.lat}, ${loc.lng}`);
    }

    console.log('\n🗺️  Cattle Distribution:');
    for (const farm of farms) {
      const cattleCount = allCattle.filter(c => c.clientId === farm.id).length;
      console.log(`   - ${farm.name}: ${cattleCount} cattle`);
    }

    console.log('\n🎉 Herd location map should now display cattle!');

  } catch (error) {
    console.error('❌ Failed to add GPS coordinates:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addGPSCoordinates().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
