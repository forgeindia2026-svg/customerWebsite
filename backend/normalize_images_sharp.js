const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = 'd:/cctvmobileapp/assets/images';

async function normalizeImages() {
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
      // 1. Trim background
      const trimmed = await sharp(filePath).trim({ threshold: 25 }).toBuffer();
      const metadata = await sharp(trimmed).metadata();
      
      // 2. Find max dimension and add 10% padding
      const maxDim = Math.max(metadata.width, metadata.height);
      const targetSize = Math.floor(maxDim * 1.10);
      
      // 3. Resize and pad onto a square white canvas
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
        
      // Replace original
      fs.renameSync(filePath + '.tmp', filePath);
      console.log(`Normalized ${file}: product ${metadata.width}x${metadata.height}, canvas ${targetSize}x${targetSize}`);
    } catch (e) {
      console.error(`Failed to normalize ${file}:`, e);
    }
  }
}

normalizeImages();
