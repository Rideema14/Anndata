import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'

// Fontsource ships every @font-face with `font-display: swap`. That means
// on a visitor's very first (uncached) load, the browser paints with a
// fallback font, then swaps to Inter/Manrope/Hind mid-render once the
// woff2 finishes downloading — visible font + spacing jump. Repeat visits
// look fine because the service worker has the fonts cached by then.
// Rewriting to `font-display: optional` fixes the first-load case too: the
// browser only uses the real font if it's ready within ~100ms, otherwise
// it keeps the fallback for that whole page load instead of swapping in
// later. Self-hosted subsetted fonts are small enough to make that window
// almost every time, so the correct font just shows from first paint.
function fontDisplayOptional() {
  return {
    name: 'font-display-optional',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (id.includes('@fontsource') && id.endsWith('.css')) {
        return code.replace(/font-display:\s*swap/g, 'font-display: optional')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    fontDisplayOptional(),
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