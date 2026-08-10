const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const imagesDir = 'd:/cctvmobileapp/assets/images';

async function normalizeImages() {
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
      const original = await Jimp.read(filePath);
      
      // 1. Autocrop the image to remove all unnecessary background
      original.autocrop({ tolerance: 0.1 });
      
      const pWidth = original.bitmap.width;
      const pHeight = original.bitmap.height;
      
      // 2. Determine the size for the new square canvas (add 10% padding so product fills 90%)
      const maxSize = Math.max(pWidth, pHeight);
      const canvasSize = Math.floor(maxSize * 1.15); // 15% margin to look nice
      
      // 3. Create a new white square canvas
      const canvas = new Jimp(canvasSize, canvasSize, '#FFFFFF');
      
      // 4. Calculate center position
      const x = Math.floor((canvasSize - pWidth) / 2);
      const y = Math.floor((canvasSize - pHeight) / 2);
      
      // 5. Composite product onto canvas
      canvas.composite(original, x, y);
      
      // 6. Overwrite the original file
      await canvas.write(filePath);
      console.log(`Normalized ${file}: product size ${pWidth}x${pHeight}, canvas ${canvasSize}x${canvasSize}`);
    } catch (e) {
      console.error(`Failed to normalize ${file}:`, e);
    }
  }
}

normalizeImages();
