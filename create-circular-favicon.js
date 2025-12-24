const sharp = require('sharp');

async function createCircularFavicons() {
  const input = 'Images/favicon logo.png';
  
  // Create 32x32 PNG favicon with circular black background
  const svgCircle32 = Buffer.from(`<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
  </svg>`);
  
  const logoBuffer32 = await sharp(input)
    .resize(24, 24, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  await sharp(svgCircle32)
    .composite([{ input: logoBuffer32, gravity: 'center' }])
    .png()
    .toFile('public/favicon.png');
  
  // Create 64x64 for apple touch icon with circular black background
  const svgCircle64 = Buffer.from(`<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="32" fill="#000000"/>
  </svg>`);
  
  const logoBuffer64 = await sharp(input)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  await sharp(svgCircle64)
    .composite([{ input: logoBuffer64, gravity: 'center' }])
    .png()
    .toFile('public/apple-touch-icon.png');
  
  console.log('Circular favicons created successfully!');
}

createCircularFavicons().catch(console.error);
