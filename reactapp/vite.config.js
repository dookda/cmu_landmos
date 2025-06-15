// client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Necessary for the container to expose the server
    port: 5173,
    // Proxy API requests
    proxy: {
      // Requests to /api will be sent to the Node.js server
      '/api': {
        target: 'http://server:5000', // 'server' is the service name in docker-compose
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})