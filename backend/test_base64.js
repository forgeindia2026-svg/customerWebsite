const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');

async function testBase64() {
  const file = 'd:/cctvmobileapp/assets/images/ip_camera.png';
  const dataUrl = 'data:image/png;base64,' + fs.readFileSync(file, 'base64');
  
  try {
    const blob = await removeBackground(dataUrl);
    console.log("Success with Data URL!");
  } catch (e) {
    console.log("Failed with Data URL:", e);
  }
}

testBase64();
