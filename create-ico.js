const fs = require('fs');

// Copy the favicon.png to favicon.ico
// Modern browsers (including Safari) support PNG as ICO format
fs.copyFileSync('public/favicon.png', 'public/favicon.ico');

console.log('favicon.ico created from favicon.png');
