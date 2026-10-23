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
    { name: "lcms", testMatch: /lcms\.smoke\.spec\.ts/, use: { baseURL: portalHost("lcms") } },
    { name: "workspace-responsive", testMatch: /workspace-responsive\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "teacher-pwa-calendar-home", testMatch: /teacher-pwa-calendar-home\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "teacher-mobile-calendar", testMatch: /teacher-mobile-calendar\.spec\.ts/, use: { baseURL: portalHost("lms") } },
    { name: "crm", testMatch: /crm\.smoke\.spec\.ts/, use: { baseURL: portalHost("crm") } },
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
