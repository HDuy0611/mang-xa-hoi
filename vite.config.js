import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5080',
      '/uploads': 'http://localhost:5080',
      '/hubs': { target: 'http://localhost:5080', ws: true },
    },
    watch: {
      ignored: ['**/backend-nodejs/**', '**/backend-c#/**'],
    },
  },
})
