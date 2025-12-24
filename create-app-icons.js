const sharp = require('sharp');
const fs = require('fs');

async function createAppIcons() {
  const input = 'Images/favicon logo.png';
  
  // Create icon.png (32x32) with circular black background for browser tabs
  const svgCircle32 = Buffer.from(`<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
  </svg>`);
  
  const logoBuffer32 = await sharp(input)
    .resize(24, 24, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  await sharp(svgCircle32)
    .composite([{ input: logoBuffer32, gravity: 'center' }])
    .png()
    .toFile('src/app/icon.png');
  
  // Create apple-icon.png (180x180) for iOS
  const svgCircle180 = Buffer.from(`<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
    <circle cx="90" cy="90" r="90" fill="#000000"/>
  </svg>`);
  
  const logoBuffer180 = await sharp(input)
    .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  await sharp(svgCircle180)
    .composite([{ input: logoBuffer180, gravity: 'center' }])
    .png()
    .toFile('src/app/apple-icon.png');
  
  // Copy icon.png to favicon.ico in src/app
  fs.copyFileSync('src/app/icon.png', 'src/app/favicon.ico');
  
  console.log('App icons created successfully!');
}

createAppIcons().catch(console.error);
