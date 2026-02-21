import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    build: { target: 'node20' },
    plugins: [externalizeDepsPlugin({ exclude: ['@gather-overlay/shared'] })],
  },
  preload: {
    build: { target: 'node20' },
    plugins: [externalizeDepsPlugin({ exclude: ['@gather-overlay/shared'] })],
  },
  renderer: {
    build: {
      target: 'chrome132',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          control: resolve(__dirname, 'src/renderer/control.html'),
        },
      },
    },
  },
});
