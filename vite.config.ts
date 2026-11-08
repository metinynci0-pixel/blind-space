import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rawPort = process.env.PORT ?? '5173';

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

export default defineConfig({
  base: basePath || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'app/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname, 'app'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'app/dist'),
    emptyOutDir: true,
  },
  server: {
    port: port || 5173,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port: port || 4173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
