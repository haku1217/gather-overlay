import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/content.ts'),
      formats: ['iife'],
      name: 'GatherOverlay',
      fileName: () => 'gather-overlay.js',
    },
    outDir: 'dist-snippet',
  },
  resolve: {
    alias: {
      '@gather-overlay/shared': resolve(__dirname, '../packages/shared/src/index.ts'),
    },
  },
});
