import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    include: [
      'tailwindcss',
      'postcss',
      'autoprefixer'
    ]
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://denemebackend.vercel.app'
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})