import { getDb } from '../server/db.ts';
import { cattle } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';

const mapping = JSON.parse(
  readFileSync('/home/ubuntu/icattle-dashboard/scripts/muzzle-mapping-complete.json', 'utf-8')
);

const db = await getDb();
if (!db) {
  console.error('Failed to connect to database');
  process.exit(1);
}

console.log(`Linking ${Object.keys(mapping).length} muzzle images to cattle records...`);

let updated = 0;
for (const [cattleIdStr, imageUrl] of Object.entries(mapping)) {
  const cattleId = parseInt(cattleIdStr);
  
  await db
    .update(cattle)
    .set({ muzzleImageUrl: imageUrl as string })
    .where(eq(cattle.id, cattleId));
  
  updated++;
  if (updated % 20 === 0) {
    console.log(`Linked ${updated}/${Object.keys(mapping).length} images...`);
  }
}

console.log(`\n✅ Complete! Linked ${updated} muzzle images to cattle records.`);
console.log(`Total cattle with muzzle images: 268 (IDs 1-268)`);

process.exit(0);
