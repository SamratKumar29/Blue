import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep local Gemma provider in a separate chunk — lazy-loaded only when needed
          'local-gemma': ['./src/core/ai/localGemma'],
        }
      }
    }
  }
});
