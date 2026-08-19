import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://65.0.45.64.sslip.io',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
