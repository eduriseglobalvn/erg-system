import path from "node:path";
import fs from "node:fs";
/// <reference types="vitest/config" />

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";
import { filterPwaPrecacheManifest } from "./scripts/pwa-precache-policy.mjs";

const devHttpsPfx = path.resolve(__dirname, "certs/erg-dev.pfx");
// Top-level copies only: nested ones (x-date-pickers bundles its own @mui/utils) stay with their owner.
const muiModules = /^(?!.*node_modules.*node_modules).*node_modules[\\/](@mui[\\/](material|system|utils|styled-engine|private-theming|icons-material)|@emotion|@popperjs|react-transition-group|stylis|clsx|hoist-non-react-statics|react-is|prop-types)[\\/]/;

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.BACKEND_URL?.trim();

  // Times render in the device's zone; pin the users' zone (process-wide, before test workers start) so a UTC CI runner sees what dev machines see.
  if (mode === "test") process.env.TZ = "Asia/Ho_Chi_Minh";

  if (!backendUrl && command === "serve" && mode !== "test") {
    throw new Error("BACKEND_URL is required. Copy .env.example to .env and configure the backend URL.");
  }

  return {
    plugins: [
    react(),
    tailwindcss(),
    // Skip the PWA plugin in test mode: workbox/service-worker generation keeps
    // handles open and prevents the vitest worker process from exiting.
    ...(mode === "test"
      ? []
      : [
          VitePWA({
      registerType: "prompt",
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png", "pwa-maskable-512x512.png"],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        importScripts: ["pwa-push.js"],
        skipWaiting: false,
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        globIgnores: ["**/mock/**", "**/*-latin-ext-*.woff2", "**/*-cyrillic-*.woff2", "**/*-greek-*.woff2"],
        manifestTransforms: [
          (entries) => filterPwaPrecacheManifest(entries, path.resolve(__dirname, "dist/index.html")),
        ],
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
        ]),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
      modulePreload: {
        resolveDependencies(filename, deps, context) {
          // Dynamic route chunks fetch their own graph on demand; preloading
          // every dependency eagerly inflated the entry and defeated route
          // code-splitting on mobile/PWA cold starts.
          // Exception: the student portal is the cold-start path for whole school labs, so its
          // dependencies are fetched in parallel when the route loads instead of as a waterfall.
          if (context.hostType !== "html") return /(^|\/)student-page-/.test(filename) ? deps : [];
          return deps.filter(
            (dep) =>
              !/^(assets\/)?(pdfjs|pdf\.worker|dnd|radix|portal-brand-mark|learning-resource-library-page|teaching-schedule-panel|assign-homework-page)/.test(dep),
          );
        },
      },
    reportCompressedSize: true,
    rollupOptions: {
      treeshake: {
        // The erg-mui barrel re-exports every wrapper (charts -> recharts, tables -> table-core). Its
        // modules are pure component definitions, so let unused ones drop instead of being kept as side effects.
        moduleSideEffects: [{ test: /[\\/]src[\\/]components[\\/]erg-mui[\\/]/, sideEffects: false }],
      },
      output: {
        // pdfjs is not grouped: a manual pdfjs chunk captured Vite's preload helper, so the entry
        // downloaded ~120 KB of pdfjs on every cold start. It now stays inside the lazy PDF viewer chunk.
        // Groups pull in their dependencies, so React gets its own higher-priority group; otherwise it
        // landed in `dnd` and every page fetched @dnd-kit with it.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: "virtual", test: /node_modules[\\/]@tanstack[\\/](react-)?virtual/, priority: 20 },
            { name: "tanstack-table", test: /node_modules[\\/]@tanstack[\\/](react-)?table/, priority: 20 },
            { name: "tanstack", test: /node_modules[\\/]@tanstack[\\/]/, priority: 10 },
            { name: "radix", test: /node_modules[\\/].*radix-ui/, priority: 10 },
            { name: "dnd", test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 10 },
            { name: "icons", test: /node_modules[\\/]lucide-react[\\/]/, priority: 10 },
            // MUI is hundreds of tiny modules; left alone it became ~100 sub-KB chunks per route (one
            // request each on weak school networks). `mui` = what the entry needs; `mui-lazy` = pieces
            // shared by 2+ lazy routes. Pieces used by a single route stay inside that route's chunk.
            { name: "mui", test: muiModules, priority: 6, tags: ["$initial"] },
            { name: "mui-lazy", test: muiModules, priority: 5, minShareCount: 2 },
            // App code the entry statically needs (auth, i18n, api client, route shell) in one chunk instead of ~40 small ones.
            { name: "shell", test: /[\\/]src[\\/]/, priority: 1, tags: ["$initial"] },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.agent-artifacts/**",
      "**/.codex-chrome-*/**",
      // Agent worktrees are full repo copies with their own node_modules (two Reacts).
      "**/.claude/**",
      "**/scripts/**",
      "src/test/e2e/**/*.spec.ts",
    ],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10_000,
    // The default `forks` pool never exits after the suite finishes on this
    // project (a lingering handle blocks the parent), and re-transforms MUI in
    // every child. `threads` terminates workers deterministically and shares
    // the jsdom transform cache. Inline @mui/material so Vite (which honors the
    // `module` field) resolves MUI's react-transition-group subpath directory
    // imports; Node's native ESM resolver used by thread workers rejects them.
    // Keep @mui/icons-material external so its barrel isn't transformed per run.
    pool: "threads",
    // The default CPU-sized worker pool makes jsdom/MUI tests contend heavily:
    // files that pass alone exceed the 10s test timeout in the full suite.
    // Two workers keeps per-test latency below the timeout across the complete
    // jsdom/MUI suite; four workers still caused isolated 10s timeouts under
    // contention even though those files passed when run alone.
    maxWorkers: 2,
    server: {
      deps: {
        inline: [/@mui\/material/, /@mui\/x-date-pickers/, /react-transition-group/],
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
        "**/src-tauri/**",
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
