import { expect, test as base, type Page } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Run with playwright.csp.config.ts: dist/ served by nginx with deploy/nginx/security-headers.conf, reached
// through the production host names (the production build only routes workspaces on those hosts).
const servedHosts = ["lms.erg.edu.vn", "crm.erg.edu.vn", "auth.erg.edu.vn", "erg.edu.vn"];
const lms = "http://lms.erg.edu.vn:8088";
// playwright.csp.config.ts finds the hashed worker in dist/ (the app tsconfig has no Node types).
const test = base.extend<{ pdfWorkerUrl: string }>({ pdfWorkerUrl: ["", { option: true }] });
const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg"/>';

type Violation = { page: string; directive: string; blocked: string; source: string };

const violations: Violation[] = [];

async function watch(page: Page) {
  // Nothing leaves the machine: other hosts are stubbed (CSP is enforced before the request, so stubs hide nothing).
  // Context-level so service-worker fetches (workbox font caching) are stubbed too.
  await page.context().route((url) => !servedHosts.includes(url.hostname), (route) => {
    const url = route.request().url();
    if (/\.(png|jpe?g|webp|svg)(\?|$)/.test(url)) return route.fulfill({ body: emptySvg, contentType: "image/svg+xml" });
    return route.fulfill({ body: "", contentType: url.includes("fonts.googleapis.com") ? "text/css" : "text/plain" });
  });
  await setupPortalNetwork(page, "lms");
  await page.exposeFunction("__reportCsp", (violation: Omit<Violation, "page">) => violations.push({ page: page.url(), ...violation }));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      void (window as unknown as { __reportCsp: (value: object) => void }).__reportCsp({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
        source: `${event.sourceFile}:${event.lineNumber}`,
      });
    });
  });
  // Workers report only to the console.
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push({ page: page.url(), directive: "console", blocked: message.text(), source: message.location().url });
  });
}

async function visit(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load" });
  await expect(page.locator("#root > *").first()).toBeAttached({ timeout: 20_000 });
  // Calendar and timekeeping poll, so the network never idles; give lazy chunks, fonts and workers time to load.
  await page.waitForTimeout(2_000);
  if (!url.endsWith("/login")) await expect(page).toHaveURL(url);
}

test.afterEach(async ({ page }, testInfo) => {
  await page.close();
  const found = violations.splice(0);
  console.log(`[${testInfo.title}] CSP violations (${found.length}):\n${JSON.stringify(found, null, 2)}`);
  expect(found).toEqual([]);
});

for (const host of servedHosts) {
  test(`login page on ${host}`, async ({ page }) => {
    await watch(page);
    await visit(page, `http://${host}:8088/login`);
  });
}

test("student home, quiz media, PDF worker, push service worker", async ({ page, pdfWorkerUrl }) => {
  await watch(page);
  await seedAuthenticatedPortal(page, "lms");
  await visit(page, `${lms}/student`);

  // Quiz player media and the PDF viewer need backend content; make the same loads they make.
  await page.evaluate(async (workerUrl) => {
    const image = new Image();
    image.src = "https://media.erg.edu.vn/quiz/q1.png";
    const audio = new Audio();
    audio.src = "https://media.erg.edu.vn/quiz/q1.mp3";
    audio.load();
    const worker = new Worker(workerUrl, { type: "module" });
    await new Promise((done) => setTimeout(done, 1500));
    worker.terminate();
  }, pdfWorkerUrl);
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.ready.then(() => true)), { timeout: 15_000 }).toBe(true);
  // Workbox fetches Google Fonts from inside the worker, under the worker's own CSP (its errors never reach the page).
  const [serviceWorker] = page.context().serviceWorkers();
  const fontFetches = await serviceWorker.evaluate(() =>
    Promise.all(["https://fonts.googleapis.com/css2?family=Public+Sans", "https://fonts.gstatic.com/s/publicsans/v1.woff2"].map((url) =>
      fetch(url, { mode: "no-cors" }).then(() => "ok", (error: unknown) => `${url}: ${String(error)}`),
    )),
  );
  expect(fontFetches).toEqual(["ok", "ok"]);
});

test("teacher calendar and timekeeping", async ({ page }) => {
  await watch(page);
  await seedAuthenticatedPortal(page, "lms");
  await visit(page, `${lms}/teacher/calendar`);
  await visit(page, `${lms}/teacher/timekeeping`);
});

test("admin calendar, question bank, Google Sheets import, slide embeds, R2 upload", async ({ page }) => {
  await watch(page);
  await seedAuthenticatedPortal(page, "lms");
  await visit(page, `${lms}/admin/calendar`);
  await visit(page, `${lms}/admin/content/questions`);

  // Same requests as google-sheets-csv-adapter, the learning-resource embeds and upload-inline-images.
  await page.evaluate(async () => {
    await fetch("https://docs.google.com/spreadsheets/d/sheet/gviz/tq?tqx=out:json&gid=0").catch(() => undefined);
    await fetch("https://acc.r2.cloudflarestorage.com/erg/media/x.png", { method: "PUT", body: "x" }).catch(() => undefined);
    for (const src of ["https://docs.google.com/presentation/d/x/embed", "https://drive.google.com/file/d/x/preview"]) {
      const frame = document.createElement("iframe");
      frame.src = src;
      document.body.appendChild(frame);
    }
    await new Promise((done) => setTimeout(done, 1000));
  });
});
