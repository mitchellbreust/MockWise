import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Set output directory outside the current directory.
    // This will create the 'dist' folder in the parent directory.
    outDir: '../dist'
  },
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min.js']
  }
});

