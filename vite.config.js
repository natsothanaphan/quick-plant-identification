import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const config = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001/quick-plant-identification/asia-southeast1/app',
        changeOrigin: true,
      },
    },
  },
});

export default config;
