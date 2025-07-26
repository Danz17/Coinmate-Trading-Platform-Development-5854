import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
          charts: ['echarts', 'echarts-for-react'],
          utils: ['date-fns', 'papaparse', 'jspdf', 'jspdf-autotable']
        }
      }
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['@questlabs/react-sdk', '@supabase/supabase-js']
  }
});