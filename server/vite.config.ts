import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  build: {
    target: 'esnext',
    outDir: '../dist/server',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.ts')
      },
      external: [
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        '@mapbox/node-pre-gyp',
        'node-pre-gyp'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['mock-aws-s3', 'aws-sdk', 'nock', '@mapbox/node-pre-gyp', 'node-pre-gyp']
  }
}); 