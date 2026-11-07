import { defineConfig, devices } from "@playwright/test";

const portalHost = (portal: string) => `https://${portal}.erg.edu.local:3001`;

export default defineConfig({
  testDir: "./src/test/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["line"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/portal-smoke.xml" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    channel: process.env.CI ? undefined : "chrome",
    launchOptions: {
      args: ["--host-resolver-rules=MAP *.erg.edu.local 127.0.0.1"],
    },
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    { name: "lms", testMatch: /lms\.smoke\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "guest-redirect-loop", testMatch: /guest-redirect-loop\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "lcms", testMatch: /admin\.smoke\.spec\.ts/, use: { baseURL: portalHost("lcms") } },
    { name: "workspace-responsive", testMatch: /workspace-responsive\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "teacher-pwa-calendar-home", testMatch: /teacher-pwa-calendar-home\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "teacher-mobile-calendar", testMatch: /teacher-mobile-calendar\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "mobile-dock", testMatch: /mobile-dock[.]spec[.]ts/, use: { baseURL: portalHost("lms") } },
    {
      name: "timekeeping-punch",
      testMatch: /timekeeping-punch[.]spec[.]ts/,
      use: {
        baseURL: portalHost("lms"),
        geolocation: { latitude: 21.0285, longitude: 105.8542, accuracy: 20 },
        launchOptions: {
          // Chrome serves a synthetic camera and auto-accepts the permission prompt; launchOptions replaces the default, so keep the host rule.
          args: ["--host-resolver-rules=MAP *.erg.edu.local 127.0.0.1", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
        permissions: ["geolocation", "camera"],
        viewport: { width: 375, height: 667 },
      },
    },
    { name: "timekeeping-admin-mobile", testMatch: /timekeeping-admin-mobile[.]spec[.]ts/, use: { baseURL: portalHost("lcms"), viewport: { width: 375, height: 667 } } },
    { name: "crm", testMatch: /crm\.smoke\.spec\.ts/, use: { baseURL: portalHost("crm") } },
    { name: "quiz-player-grid", testMatch: /quiz-player-grid.spec.ts/, use: { baseURL: "https://127.0.0.1:3001" } },
    { name: "elearning", testMatch: /elearning\.smoke\.spec\.ts/, use: { baseURL: portalHost("elearning") } },
  ],
  webServer: {
    command: "bun run dev -- --mode test --host 0.0.0.0 --port 3001",
    url: "https://127.0.0.1:3001",
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
