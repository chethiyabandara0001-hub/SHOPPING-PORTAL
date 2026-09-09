import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    // Enable minification for production
    minify: "esbuild",
    // Generate sourcemaps for debugging (optional, remove for smaller builds)
    sourcemap: false,
    // Optimize chunking
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          charts: ["recharts"],
          motion: ["framer-motion"],
          // Firebase loaded lazily - keep in separate chunk
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/analytics"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/analytics"],
  },
});
