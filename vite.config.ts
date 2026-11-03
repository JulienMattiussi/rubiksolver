import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  // From the domain's root: each puzzle has its own path (`/fr/3x3`, see
  // lib/app/route.ts), whose pages all load the same assets.
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 6661,
    strictPort: true,
  },
  preview: {
    port: 6661,
    strictPort: true,
  },
})
