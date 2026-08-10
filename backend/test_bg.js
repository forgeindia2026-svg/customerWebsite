const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');

async function testBgRemoval() {
  const filePath = 'file:///d:/cctvmobileapp/assets/images/ip_camera.png';
  console.log('Removing bg...');
  const blob = await removeBackground(filePath);
  const buffer = Buffer.from(await blob.arrayBuffer());
  
  console.log('Trimming...');
  const trimmed = await sharp(buffer).trim().toBuffer();
  const metadata = await sharp(trimmed).metadata();
  console.log(`Trimmed size: ${metadata.width}x${metadata.height}`);
  
  const targetSize = Math.floor(Math.max(metadata.width, metadata.height) * 1.15);
  
  console.log('Padding...');
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
    .toFile('d:/cctvmobileapp/assets/images/ip_camera_test.png');
    
  console.log('Done!');
}
testBgRemoval();
