import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => funciona igual en GitHub Pages (subcarpeta) y en Vercel (raíz).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
});
