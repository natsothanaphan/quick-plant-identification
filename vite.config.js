import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/identifyPlant': {
        target: 'http://127.0.0.1:5001/quick-plant-identification/asia-southeast1/identifyPlant',
        changeOrigin: true
      }
    }
  }
})
