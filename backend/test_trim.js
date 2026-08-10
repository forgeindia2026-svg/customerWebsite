const sharp = require('sharp');
const fs = require('fs');

async function testTrim() {
  const file = 'd:/cctvmobileapp/assets/images/dvr.png';
  const file2 = 'd:/cctvmobileapp/assets/images/ip_camera.png';
  
  // Test high threshold
  let trimmed1 = await sharp(file).trim({ threshold: 80 }).toBuffer();
  let meta1 = await sharp(trimmed1).metadata();
  console.log(`dvr.png trimmed size: ${meta1.width}x${meta1.height}`);
  
  let trimmed2 = await sharp(file2).trim({ threshold: 80 }).toBuffer();
  let meta2 = await sharp(trimmed2).metadata();
  console.log(`ip_camera.png trimmed size: ${meta2.width}x${meta2.height}`);
}

testTrim();
