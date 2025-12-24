const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertToFavicon() {
  try {
    const inputPath = path.join(__dirname, 'public/images/clear logo.png');
    const outputPath = path.join(__dirname, 'public/favicon.ico');
    
    console.log('Converting logo to favicon.ico...');
    
    // Resize to 32x32 and convert to ICO format
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(outputPath.replace('.ico', '.png'));
    
    // For ICO format, we'll create a proper favicon
    // Using a library would be better, but for now let's create a simple PNG favicon
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log('Favicon created at:', outputPath);
  } catch (error) {
    console.error('Error converting favicon:', error);
  }
}

convertToFavicon();
