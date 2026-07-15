import path from "node:path";
import fs from "node:fs";
/// <reference types="vitest/config" />

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

const devHttpsPfx = path.resolve(__dirname, "certs/erg-dev.pfx");

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.BACKEND_URL?.trim();

  if (!backendUrl && command === "serve" && mode !== "test") {
    throw new Error("BACKEND_URL is required. Copy .env.example to .env and configure the backend URL.");
  }

  return {
    plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png", "pwa-maskable-512x512.png"],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        importScripts: ["pwa-push.js"],
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/sso\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/graphql(?:[/?#]|$)/i,
            handler: "NetworkOnly",
            method: "POST",
            options: {
              cacheName: "erg-graphql-network-v1",
            },
          },
          {
            urlPattern: /\/api\/(?:lms\/auth|v1\/auth|v1\/sessions|v1\/users\/me\/sessions|lms\/attempts|lms\/quizzes|lms\/scores|lms\/attendance)(?:[/?#]|$)/i,
            handler: "NetworkOnly",
            method: "GET",
            options: {
              cacheName: "erg-lms-network-only-v1",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "erg-google-font-css-v1",
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            method: "GET",
            options: {
              cacheName: "erg-google-font-files-v1",
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    modulePreload: {
      resolveDependencies(_filename, deps, context) {
        if (context.hostType !== "html") return deps;
        return deps.filter(
          (dep) =>
            !/^(assets\/)?(pdfjs|pdf\.worker|fullcalendar|dnd|radix|portal-brand-mark|learning-resource-library-page|teaching-schedule-panel|assign-homework-page)/.test(dep),
        );
      },
    },
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@fullcalendar")) return "fullcalendar";
            if (id.includes("pdfjs-dist")) return "pdfjs";
            if (id.includes("@tanstack/react-virtual")) return "virtual";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("radix-ui")) return "radix";
            if (id.includes("@dnd-kit")) return "dnd";
            if (id.includes("lucide-react")) return "icons";
          }
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/.codex-chrome-*/**"],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10_000,
    server: {
      deps: {
        inline: [/@mui\//, /react-transition-group/],
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    watch: {
      ignored: [
        "**/.codex-qa/**",
        "**/.codex-chrome-*/**",
        "**/dist/**",
      ],
    },
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
    },
    https: fs.existsSync(devHttpsPfx)
      ? {
          pfx: fs.readFileSync(devHttpsPfx),
          passphrase: "erg-local-dev",
        }
      : undefined,
    allowedHosts: [".erg.edu.local", ".erg.edu.vn", ".org.edu.local", ".org.edu.vn"],
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [".erg.edu.local", ".erg.edu.vn", ".org.edu.local", ".org.edu.vn"],
  },
    };
});
