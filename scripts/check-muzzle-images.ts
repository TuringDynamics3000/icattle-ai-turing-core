import { getDb } from '../server/db.ts';
import { cattle } from '../drizzle/schema.ts';
import { isNotNull } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('Failed to connect to database');
  process.exit(1);
}

const cattleWithImages = await db
  .select({
    id: cattle.id,
    visualId: cattle.visualId,
    muzzleImageUrl: cattle.muzzleImageUrl
  })
  .from(cattle)
  .where(isNotNull(cattle.muzzleImageUrl))
  .limit(10);

console.log(`Found ${cattleWithImages.length} cattle with muzzle images:`);
console.log(JSON.stringify(cattleWithImages, null, 2));

process.exit(0);
