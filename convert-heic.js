const fs = require('fs');
const path = require('path');
const convert = require('heic-convert');

const sourceDir = path.join(__dirname, 'public', 'images');
const files = fs.readdirSync(sourceDir);

async function convertHeicFiles() {
  for (const file of files) {
    if (file.toLowerCase().endsWith('.heic')) {
      const inputPath = path.join(sourceDir, file);
      const outputPath = path.join(sourceDir, file.replace(/\.heic$/i, '.jpeg'));
      
      try {
        const inputBuffer = fs.readFileSync(inputPath);
        const outputBuffer = await convert({
          blob: inputBuffer,
          toType: 'JPEG'
        });
        
        fs.writeFileSync(outputPath, outputBuffer);
        console.log(`✓ Converted ${file} to ${path.basename(outputPath)}`);
        fs.unlinkSync(inputPath);
      } catch (error) {
        console.error(`✗ Failed to convert ${file}:`, error.message);
      }
    }
  }
  
  console.log('\nConversion complete!');
  console.log('Files in public/images:');
  fs.readdirSync(sourceDir).forEach(f => console.log('  -', f));
}

convertHeicFiles();
