import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Environment variables'ı yükle
  const env = loadEnv(mode, process.cwd(), ['VITE_']);

  // Proxy hedefini dinamik olarak belirle
  const proxyTarget = env.VITE_API_URL || 
    (mode === 'development' 
      ? 'http://localhost:5001/api' 
      : 'https://denemebackend.vercel.app/api');

  return {
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
      host: true, // Container dışından erişim için
      port: 3000, // Docker-compose ile eşleşen port
      strictPort: true, // Port değişmesini engelle
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false
        }
      }
    },
    define: {
      'process.env': {}
    }
  };
});