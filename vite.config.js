import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifestFilename: "manifest.json",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "재고 관리 PWA",
        short_name: "재고관리",
        description: "재고 관리 시스템",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "ko",
        categories: ["business", "productivity", "utilities"],
        icons: [
          {
            src: "icon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
          },
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-256x256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              // React 관련 라이브러리 분리
              if (id.includes("react") || id.includes("react-dom")) {
                return "react-vendor";
              }

              // UI 라이브러리 분리 (lucide-react 등)
              if (id.includes("lucide-react") || id.includes("@headlessui")) {
                return "ui-vendor";
              }

              // 상태 관리 라이브러리 분리
              if (id.includes("zustand") || id.includes("react-hook-form")) {
                return "state-vendor";
              }

              // 기타 node_modules 패키지들
              if (id.includes("node_modules")) {
                return "vendor";
              }
            },
          },
        },
      },
    }),
  ],
  server: {
    host: true, // 네트워크에서 접근 가능하도록 설정
    port: 5200,
  },
});
