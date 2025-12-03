import { storagePut } from '../server/storage.ts';
import { readdir } from 'fs/promises';
import { readFileSync } from 'fs';
import { join } from 'path';

const MUZZLE_DIR = '/home/ubuntu/upload/BeefCattle_Muzzle_Individualized';
const START_INDEX = 51; // Start from cattle 51 (we already did 1-50)
const BATCH_SIZE = 218; // Upload remaining 218 images

async function uploadRemainingMuzzles() {
  console.log(`Starting upload of remaining ${BATCH_SIZE} muzzle images...`);
  
  const cattleDirs = (await readdir(MUZZLE_DIR))
    .filter(name => name.startsWith('cattle_'))
    .sort();
  
  const mapping: Record<number, string> = {};
  let uploaded = 0;
  
  // Skip first 50, upload next 218
  const dirsToProcess = cattleDirs.slice(START_INDEX - 1, START_INDEX - 1 + BATCH_SIZE);
  
  for (const cattleDir of dirsToProcess) {
    const cattleIndex = START_INDEX + uploaded;
    const dirPath = join(MUZZLE_DIR, cattleDir);
    
    // Get first image from this cattle's directory
    const images = (await readdir(dirPath))
      .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png)$/));
    
    if (images.length === 0) {
      console.log(`No images found in ${cattleDir}, skipping...`);
      continue;
    }
    
    const firstImage = images[0];
    const imagePath = join(dirPath, firstImage);
    const imageBuffer = readFileSync(imagePath);
    
    // Upload to S3
    const s3Key = `cattle-muzzles/${cattleDir}/${firstImage}`;
    const { url } = await storagePut(s3Key, imageBuffer, 'image/jpeg');
    
    mapping[cattleIndex] = url;
    uploaded++;
    
    if (uploaded % 10 === 0) {
      console.log(`Uploaded ${uploaded}/${BATCH_SIZE} images...`);
    }
  }
  
  // Save mapping to file
  const { writeFileSync } = await import('fs');
  writeFileSync(
    '/home/ubuntu/icattle-dashboard/scripts/muzzle-mapping-complete.json',
    JSON.stringify(mapping, null, 2)
  );
  
  console.log(`\n✅ Upload complete! ${uploaded} images uploaded.`);
  console.log(`Mapping saved to scripts/muzzle-mapping-complete.json`);
}

uploadRemainingMuzzles().catch(console.error);
