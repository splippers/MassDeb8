import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: Vite proxies API + WS to the arena (default port 8787).
// Prod: arena serves built assets at / and /assets; same-origin /api and /ws.
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so other machines can open http://eddie:5173 (dev).
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
      '/ws': { target: 'ws://127.0.0.1:8787', ws: true },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
})
