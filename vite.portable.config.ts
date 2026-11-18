import { copyFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";

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

export default defineConfig(({ mode }) => {
  // Without a trusted Ed25519 key the app rejects every package, so fail the build instead of shipping a player that opens nothing.
  if (!loadEnv(mode, __dirname, "VITE_PORTABLE_").VITE_PORTABLE_PACKAGE_PUBLIC_KEYS) {
    throw new Error("VITE_PORTABLE_PACKAGE_PUBLIC_KEYS is missing: set it to the Ed25519 public keys ({\"kid\":\"base64 SPKI\"}) before building the portable app.");
  }
  return {
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
  };
});
