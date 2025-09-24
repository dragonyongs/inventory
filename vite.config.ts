// vite.config.ts - TailwindCSS v4 완전 대응
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // ✅ v4 전용 플러그인
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ✅ TailwindCSS v4 플러그인 추가
    VitePWA({
      registerType: "prompt",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}"],
        runtimeCaching: [
          {
            urlPattern: /^\/src\/.*\.(ts|tsx|js|jsx)$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "dev-source-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
        skipWaiting: false,
        clientsClaim: false,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "재고관리 - Smart Inventory",
        short_name: "재고관리",
        description: "효율적인 재고관리를 위한 PWA 애플리케이션",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5200,
    host: true,
    hmr: {
      port: 5201,
    },
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["lucide-react"],
          stores: ["zustand"],
        },
      },
    },
    target: "esnext",
    minify: "terser",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "zustand/middleware",
      "lucide-react",
    ],
    exclude: ["fsevents"],
    force: true,
    esbuildOptions: {
      external: ["*.node"],
      define: {
        global: "globalThis",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
});
