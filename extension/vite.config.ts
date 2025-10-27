import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'
import path from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    // Copy service worker after build
    {
      name: 'copy-service-worker',
      writeBundle() {
        // Ensure dist directory exists
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        copyFileSync('public/service-worker.js', 'dist/service-worker.js')
        console.log('✓ Copied service-worker.js to dist/')
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html'
      },
      output: {
        // Inline all service worker code into a single bundle
        inlineDynamicImports: false,
        manualChunks: undefined
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts']
  }
})
