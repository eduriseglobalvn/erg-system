import { copyFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

function portableIndexHtmlPlugin(): Plugin {
  return {
    name: "erg-portable-index-html",
    closeBundle() {
      copyFileSync(
        path.resolve(__dirname, "dist-portable/portable.html"),
        path.resolve(__dirname, "dist-portable/index.html"),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), portableIndexHtmlPlugin()],
  publicDir: false,
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
  build: {
    emptyOutDir: true,
    outDir: "dist-portable",
    target: "esnext",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: path.resolve(__dirname, "portable.html"),
      output: { manualChunks: undefined },
    },
  },
});
