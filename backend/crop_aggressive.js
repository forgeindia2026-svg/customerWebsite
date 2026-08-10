const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const imagesDir = 'd:/cctvmobileapp/assets/images';

async function cropImages() {
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
      const image = await Jimp.read(filePath);
      // Extremely aggressive autocrop
      image.autocrop({ tolerance: 0.4 }); 
      console.log(`Cropped ${file} to: ${image.bitmap.width}x${image.bitmap.height}`);
      await image.write(filePath);
    } catch (e) {
      console.error(`Failed to crop ${file}:`, e);
    }
  }
}

cropImages();
