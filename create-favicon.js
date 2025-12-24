const sharp = require('sharp');

async function createFaviconsWithBlackBg() {
  const input = 'public/images/clear logo.png';
  
  // Create 32x32 PNG favicon with black background
  await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 }
    }
  })
  .composite([
    {
      input: await sharp(input)
        .resize(28, 28, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile('public/favicon.png');
  
  // Create 64x64 for apple touch icon with black background
  await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 }
    }
  })
  .composite([
    {
      input: await sharp(input)
        .resize(56, 56, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile('public/apple-touch-icon.png');
  
  console.log('Favicon files created with black background!');
}

createFaviconsWithBlackBg().catch(console.error);
