/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 8100,
        allowedHosts: true,          // altfel Vite respinge host-ul de tunnel (*.devtunnels.ms)
        proxy: {
            '/users': 'http://localhost:8080',
            '/orders': 'http://localhost:8080',
            '/restaurants': 'http://localhost:8080',
            '/images': 'http://localhost:8080',
            '/mywebsockets': { target: 'http://localhost:8080', ws: true },
        },
    },
  plugins: [
    react(),
    legacy()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
