import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spaFallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Don't rewrite API calls
          if (req.url?.startsWith('/api')) {
            return next();
          }
          // Don't rewrite static assets
          if (req.url?.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
            return next();
          }
          // For all other routes, serve index.html
          if (req.url && !req.url.startsWith('/@') && !req.url.includes('.')) {
            req.url = '/index.html';
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "wouter"],
  },
  server: {
    host: "0.0.0.0",
    port: 3003,
    strictPort: false,
    allowedHosts: [
      "csapp.unraidlab.online",
      "localhost",
      "127.0.0.1",
      "192.168.88.14"
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    // Enable history API fallback for SPA routing
    hmr: {
      clientPort: 3003,
    },
  },
  // Ensure all non-API routes fallback to index.html
  preview: {
    port: 3003,
    strictPort: false,
  },
});
