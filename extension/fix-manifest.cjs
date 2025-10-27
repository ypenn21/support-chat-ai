// Script to fix manifest after build
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Add/update background section
manifest.background = {
  service_worker: "service-worker.js"
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Fixed manifest.json with correct service worker');
