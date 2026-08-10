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
      // Auto-crop with some tolerance
      image.autocrop({ tolerance: 0.1 }); 
      await image.write(filePath);
      console.log(`Cropped: ${file}`);
    } catch (e) {
      console.error(`Failed to crop ${file}:`, e);
    }
  }
}

cropImages();
