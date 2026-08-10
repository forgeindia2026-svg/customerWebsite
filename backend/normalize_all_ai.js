const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = 'd:/cctvmobileapp/assets/images';

async function normalizeAll() {
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') && !f.endsWith('_test.png'));
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
      console.log(`Processing ${file}...`);
      
      // 1. Remove background using AI (returns Blob)
      const blob = await removeBackground(`file:///${filePath.replace(/\\/g, '/')}`);
      const buffer = Buffer.from(await blob.arrayBuffer());
      
      // 2. Trim the now-transparent background exactly to object boundaries
      const trimmed = await sharp(buffer).trim().toBuffer();
      const metadata = await sharp(trimmed).metadata();
      
      // 3. Determine square canvas size with exactly 15% margin
      const maxDim = Math.max(metadata.width, metadata.height);
      const targetSize = Math.floor(maxDim * 1.15);
      
      // 4. Composite object into the center of a white square
      await sharp(trimmed)
        .resize({
          width: metadata.width,
          height: metadata.height,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: Math.floor((targetSize - metadata.height) / 2),
          bottom: Math.ceil((targetSize - metadata.height) / 2),
          left: Math.floor((targetSize - metadata.width) / 2),
          right: Math.ceil((targetSize - metadata.width) / 2),
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(filePath + '.tmp');
        
      fs.renameSync(filePath + '.tmp', filePath);
      console.log(`Normalized ${file}: product ${metadata.width}x${metadata.height}, canvas ${targetSize}x${targetSize}`);
    } catch (e) {
      console.error(`Failed to process ${file}:`, e);
    }
  }
}

normalizeAll();
