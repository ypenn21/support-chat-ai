// Script to fix manifest after build
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Add/update background section
// @crxjs/vite-plugin creates service-worker-loader.js which imports the compiled service worker
manifest.background = {
  service_worker: "service-worker-loader.js",
  type: "module"  // Required for ES6 imports in service worker
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Fixed manifest.json with correct service worker');
