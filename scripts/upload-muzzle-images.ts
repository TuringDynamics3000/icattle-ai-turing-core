import { storagePut } from '../server/storage';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MUZZLE_DATA_DIR = '/home/ubuntu/upload/BeefCattle_Muzzle_Individualized';

async function uploadMuzzleImages() {
  console.log('Starting muzzle image upload...');
  
  const cattleDirs = readdirSync(MUZZLE_DATA_DIR).filter(dir => dir.startsWith('cattle_'));
  console.log(`Found ${cattleDirs.length} cattle directories`);
  
  const uploadedImages: Array<{ cattleId: string; url: string }> = [];
  
  for (const cattleDir of cattleDirs) {
    const cattlePath = join(MUZZLE_DATA_DIR, cattleDir);
    const images = readdirSync(cattlePath).filter(file => file.endsWith('.jpg'));
    
    if (images.length === 0) continue;
    
    // Use the first image for each cattle
    const firstImage = images[0];
    const imagePath = join(cattlePath, firstImage);
    
    try {
      const imageBuffer = readFileSync(imagePath);
      const fileKey = `cattle-muzzles/${cattleDir}/${firstImage}`;
      
      const { url } = await storagePut(fileKey, imageBuffer, 'image/jpeg');
      
      uploadedImages.push({
        cattleId: cattleDir,
        url
      });
      
      console.log(`✓ Uploaded ${cattleDir}: ${url}`);
    } catch (error) {
      console.error(`✗ Failed to upload ${cattleDir}:`, error);
    }
  }
  
  console.log(`\nUpload complete! ${uploadedImages.length} images uploaded.`);
  
  // Save mapping to file
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/home/ubuntu/icattle-dashboard/scripts/muzzle-image-mapping.json',
    JSON.stringify(uploadedImages, null, 2)
  );
  
  console.log('Mapping saved to muzzle-image-mapping.json');
}

uploadMuzzleImages().catch(console.error);
