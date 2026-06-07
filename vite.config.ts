import path from "node:path";
import fs from "node:fs";
/// <reference types="vitest/config" />

import tailwindcss from "@tailwindcss/vite";
import { type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const devHttpsPfx = path.resolve(__dirname, "certs/erg-dev.pfx");

function localMuiIconShim(): Plugin {
  const iconPrefix = "\0local-mui-icon:";

  return {
    name: "local-mui-icon-shim",
    enforce: "pre",
    resolveId(id) {
      if (id.startsWith("@mui/icons-material/")) {
        return `${iconPrefix}${id.slice("@mui/icons-material/".length)}`;
      }

      return null;
    },
    load(id) {
      if (!id.startsWith(iconPrefix)) {
        return null;
      }

      const displayName = id.slice(iconPrefix.length);

      // Keep legacy MUI icon import paths working without installing the heavy MUI packages.
      return [
        'import { createMuiIconShim } from "/src/components/mui-icon-shim.ts";',
        `export default createMuiIconShim(${JSON.stringify(displayName)});`,
      ].join("\n");
    },
  };
}

export default defineConfig({
  plugins: [localMuiIconShim(), react(), tailwindcss()],
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
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    https: fs.existsSync(devHttpsPfx)
      ? {
          pfx: fs.readFileSync(devHttpsPfx),
          passphrase: "erg-local-dev",
        }
      : undefined,
    allowedHosts: [".erg.edu.local", ".erg.edu.vn"],
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [".erg.edu.local", ".erg.edu.vn"],
  },
});
