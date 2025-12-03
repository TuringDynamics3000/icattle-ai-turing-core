import { getDb } from '../server/db';
import { cattle } from '../drizzle/schema';
import { readFileSync } from 'fs';
import { eq } from 'drizzle-orm';

async function linkMuzzleImages() {
  console.log('Linking muzzle images to cattle records...');
  
  // Read the mapping file
  const mapping = JSON.parse(
    readFileSync('/home/ubuntu/icattle-dashboard/scripts/muzzle-image-mapping.json', 'utf-8')
  ) as Array<{ cattleId: string; url: string }>;
  
  console.log(`Found ${mapping.length} muzzle images to link`);
  
  // Get all cattle records
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const allCattle = await db.select().from(cattle);
  console.log(`Found ${allCattle.length} cattle records in database`);
  
  let updated = 0;
  
  // Map the first 50 cattle to the first 50 muzzle images
  for (let i = 0; i < Math.min(50, allCattle.length); i++) {
    const cattleRecord = allCattle[i];
    const muzzleImage = mapping[i];
    
    if (!muzzleImage) break;
    
    await db.update(cattle)
      .set({ muzzleImageUrl: muzzleImage.url })
      .where(eq(cattle.id, cattleRecord.id));
    
    updated++;
    console.log(`✓ Linked ${cattleRecord.visualId} (ID: ${cattleRecord.id}) → ${muzzleImage.cattleId}`);
  }
  
  console.log(`\nComplete! Updated ${updated} cattle records with muzzle images.`);
  console.log(`Remaining ${allCattle.length - updated} cattle will use placeholder images.`);
}

linkMuzzleImages().catch(console.error).finally(() => process.exit(0));
