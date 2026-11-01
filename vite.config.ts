import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' => funciona igual en GitHub Pages (subcarpeta) y en Vercel (raíz).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // App instalable (PWA): el juego se guarda en el dispositivo para cargar rápido y abrir sin conexión.
    // 'prompt': la versión nueva se descarga sola y UpdateToast avisa para recargar (nunca a mitad de partida).
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'ENDLESS RIFT',
        short_name: 'Endless Rift',
        description: 'Grietas infinitas de las que emergen hordas de enemigos. Elige tu héroe y sobrevive.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#110c1e',
        theme_color: '#110c1e',
        categories: ['games'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
        globIgnores: ['og.jpg'],   // la imagen para compartir no hace falta en el dispositivo
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // la primera visita queda controlada en cuanto se instala, para que el aviso de versión nueva funcione
        clientsClaim: true,
      },
    }),
  ],
  build: { target: 'es2020', chunkSizeWarningLimit: 1000 },
});
