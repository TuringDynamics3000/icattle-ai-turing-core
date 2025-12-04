/**
 * Generate cattle_list.csv from muzzle-mapping-complete.json
 * Creates 218 entries with real muzzle photos
 */

import * as fs from 'fs';
import * as path from 'path';

const muzzleMapping = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'muzzle-mapping-complete.json'), 'utf-8')
);

const entries: string[] = [];

// Add all 218 real cattle with muzzle photos
for (const [id, url] of Object.entries(muzzleMapping)) {
  const urlStr = url as string;
  // Extract cattle_XXXX and filename from URL
  const match = urlStr.match(/cattle-muzzles\/(cattle_\d+)\/(cattle_\d+_[^/]+\.jpg)/);
  if (match) {
    const cattleId = match[1];
    const filename = match[2];
    entries.push(`${cattleId},${filename}`);
  }
}

console.log(`✅ Added ${entries.length} cattle with real muzzle photos`);

// Write CSV content
const csvContent = entries.join('\n');

// Try /tmp first (Linux/Mac)
try {
  fs.writeFileSync('/tmp/cattle_list.csv', csvContent);
  console.log('✅ Written to /tmp/cattle_list.csv');
} catch (error) {
  console.log('⚠️  Could not write to /tmp (Windows?)');
}

// Write to project root (works on all platforms)
const projectRoot = path.join(__dirname, '..');
const localPath = path.join(projectRoot, 'cattle_list.csv');
fs.writeFileSync(localPath, csvContent);
console.log(`✅ Written to ${localPath}`);

// Write to scripts directory as backup
const scriptsPath = path.join(__dirname, 'cattle_list.csv');
fs.writeFileSync(scriptsPath, csvContent);
console.log(`✅ Written to ${scriptsPath}`);

console.log(`\n🎉 cattle_list.csv generated with ${entries.length} cattle!`);
