import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Netlify serves this app from the site root. For GitHub Pages builds, set
// VITE_BASE_PATH=/harekrsnajapa/ before running the build.
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Mahamantra Chanting',
        short_name: 'Mahamantra',
        description: 'Hare Krishna Mahamantra Chanting App',
        theme_color: '#fff8ed',
        background_color: '#fff8ed',
        display: 'standalone',
        icons: [
          {
            src: '/icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
