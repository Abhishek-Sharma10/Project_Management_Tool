import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Allow overriding the dev port via VITE_PORT in .env.
  // Falls back to 5173; if that port is occupied Vite will automatically
  // choose the next available port (e.g. 5174) and print a warning.
  const port = Number(env.VITE_PORT) || 5173;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      // Don't fail hard if port is busy — let Vite choose the next free port
      // and tell the developer which one it picked.
      strictPort: false,
      proxy: {
        // Proxy /api/* to the Express backend so the browser never hits CORS.
        '/api': {
          target: env.VITE_API_URL
            ? env.VITE_API_URL.replace('/api', '')
            : 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
