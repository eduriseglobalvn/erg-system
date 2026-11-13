import { readdirSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Walks the production build under the enforced CSP. No dev server: serve dist/ through the
// production nginx config first (same headers file the Docker image ships), then run
// `bunx playwright test -c playwright.csp.config.ts`:
//   bun run build:vercel
//   docker run -d --rm --name erg-csp-e2e -p 8088:80 -e BACKEND_UPSTREAM=http://127.0.0.1:9 \
//     -v "$PWD/dist:/usr/share/nginx/html:ro" \
//     -v "$PWD/deploy/nginx/default.conf.template:/etc/nginx/templates/default.conf.template:ro" \
//     -v "$PWD/deploy/nginx/security-headers.conf:/etc/nginx/security-headers.conf:ro" nginx:1.27-alpine
const pdfWorker = readdirSync("dist/assets").find((file) => /^pdf\.worker-.*\.mjs$/.test(file));
const hosts = ["lms.erg.edu.vn", "crm.erg.edu.vn", "auth.erg.edu.vn", "erg.edu.vn"];

export default defineConfig<{ pdfWorkerUrl: string }>({
  testDir: "./src/test/e2e",
  testMatch: /csp-enforced\.spec\.ts/,
  workers: 1,
  reporter: [["line"]],
  use: {
    ...devices["Desktop Chrome"],
    // The headless shell ignores --unsafely-treat-insecure-origin-as-secure; Chrome honours it.
    channel: "chrome",
    launchOptions: {
      // The production host names resolve to the local nginx (the build only routes workspaces there); the spec stubs
      // every other host. Plain http, so mark them secure for the service worker.
      args: [`--host-resolver-rules=${hosts.map((host) => `MAP ${host} 127.0.0.1`).join(", ")}`, `--unsafely-treat-insecure-origin-as-secure=${hosts.map((host) => `http://${host}:8088`).join(",")}`],
    },
    pdfWorkerUrl: `/assets/${pdfWorker}`,
    trace: "off",
    video: "off",
  },
});
