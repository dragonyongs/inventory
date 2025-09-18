// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^\/$/],
      },
      manifest: {
        name: "Inventory PWA",
        short_name: "Inventory",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
  },
  server: {
    host: true, // 네트워크에서 접근 가능하도록 설정
    port: 5200,
  },
});
