import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Aandata — Smart Farming. Better Decisions.',
        short_name: 'Aandata',
        description:
          'AI-powered agricultural marketplace and farming assistance platform for Indian farmers.',
        theme_color: '#2A6B3F',
        background_color: '#F7F8F3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing third-party code from app code so browsers
        // can cache vendor chunks across deploys instead of re-downloading
        // them every time app code changes. Also keeps the heaviest libs
        // (three.js, gsap, recharts) out of whichever page's chunk happens
        // to import them first.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('three')) return 'vendor-three'
          if (id.includes('gsap') || id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
