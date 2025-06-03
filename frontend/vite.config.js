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
        target: 'https://denemebackend.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})