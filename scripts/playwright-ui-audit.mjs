import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_ROOT = path.resolve("docs/1107/playwright-audit");
const EMAIL = process.env.UI_AUDIT_EMAIL ?? "admin@erg.edu.vn";
const PASSWORD = process.env.UI_AUDIT_PASSWORD ?? "Admin@2025";
const ROUTE_LIMIT = Number(process.env.UI_AUDIT_ROUTE_LIMIT ?? "0");
const ONLY_VIEWPORT = process.env.UI_AUDIT_VIEWPORT;
const ONLY_PORTAL = process.env.UI_AUDIT_PORTAL;

const portals = {
  lcms: {
    baseUrl: "https://lcms.erg.edu.local:3001",
    routes: [
      "/", "/schools", "/users", "/questions", "/quiz-bank", "/quiz-editor", "/assignments", "/rubrics",
      "/session-templates", "/report-templates", "/legal", "/settings", "/courses", "/classes", "/sessions",
      "/customers", "/center-tasks", "/students/list-center-student", "/students/list-student-course",
      "/students/list-class-enroll", "/students/list-student-session", "/students/list-student-assignment",
      "/students/student-absence", "/employees", "/employees/face-detection", "/employees/timesheet",
      "/employees/teacher-absence", "/finance/orders", "/finance/product-import-summaries", "/finance/incomes",
      "/finance/expenses", "/finance/refunds", "/finance/center-transactions", "/finance/center-transactions/coins",
      "/other/products", "/other/partners", "/report/dashboard-report", "/report/crm-report", "/report/student-report",
      "/report/task-report", "/report/cash-flow-report", "/report/pnl-report", "/report/sale-report",
      "/setting/setting-center-feature", "/setting/setting-center-role", "/setting/promotions/price-discount-programs",
      "/setting/promotions/vouchers", "/setting/promotions/discounts", "/setting/setting-center-task/task-status",
      "/setting/setting-center-customer/customer-status", "/setting/setting-class-room",
      "/setting/setting-calendar-event", "/setting/setting-criteria-score", "/setting/setting-income-expense",
      "/integration/setting-call-center", "/integration/setting-zalo-account", "/integration/setting-center-api-key",
      "/calendar", "/resources", "/profile", "/question-types", "/access-denied",
    ],
  },
  lms: {
    baseUrl: "https://lms.erg.edu.local:3001",
    routes: [
      "/home", "/dashboard", "/homework", "/homework/assign", "/homework/exercise-bank", "/homework/progress",
      "/homework/student-groups", "/homework/class", "/notifications", "/account", "/account/login-logs", "/score",
      "/attendance", "/calendar", "/class-log", "/reports", "/resources", "/profile", "/question-types",
    ],
  },
  crm: {
    baseUrl: "https://crm.erg.edu.local:3001",
    routes: ["/", "/seo", "/seo/schools", "/seo/opportunities", "/seo/pnl", "/seo/follow-ups", "/seo/handover", "/profile"],
  },
  elearning: {
    baseUrl: "https://elearning.erg.edu.local:3001",
    routes: ["/", "/student", "/profile"],
  },
};

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
].filter((viewport) => !ONLY_VIEWPORT || viewport.name === ONLY_VIEWPORT);

function slugify(route) {
  return route === "/" ? "index" : route.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/g, "");
}

async function authenticate(context, portal, baseUrl) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(800);
    if (!page.url().includes("/login")) return { ok: true, method: "existing-session", consoleErrors };

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    if (!(await emailInput.count()) || !(await passwordInput.count())) {
      return { ok: false, method: "form-not-found", consoleErrors };
    }

    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click({ timeout: 8_000 });
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(1_200);
    return { ok: !page.url().includes("/login"), method: "password", finalUrl: page.url(), portal, consoleErrors };
  } finally {
    await page.close();
  }
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      const className = typeof element.className === "string" ? element.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
      return `${element.tagName.toLowerCase()}${className ? `.${className}` : ""}`;
    };
    const all = [...document.querySelectorAll("body *")].filter(visible);
    const controls = all.filter((element) => element.matches("button, a[href], input, select, textarea, [role='button'], [role='link']"));
    const formFields = all.filter((element) => element.matches("input:not([type='hidden']), select, textarea"));
    const bodyText = document.body.innerText.replace(/\s+/g, " ").trim();
    const root = document.documentElement;
    const overflowing = all
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > root.clientWidth + 2 || rect.left < -2;
      })
      .slice(0, 20)
      .map((element) => ({ selector: selectorFor(element), rect: element.getBoundingClientRect().toJSON() }));
    const unlabeledFields = formFields
      .filter((element) => {
        const id = element.getAttribute("id");
        return !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby") && !(id && document.querySelector(`label[for='${CSS.escape(id)}']`)) && !element.closest("label");
      })
      .slice(0, 30)
      .map(selectorFor);
    const iconButtonsMissingName = all
      .filter((element) => element.matches("button, [role='button']"))
      .filter((element) => !element.innerText.trim() && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby") && !element.getAttribute("title"))
      .slice(0, 30)
      .map(selectorFor);
    const smallTargets = controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 32 || rect.height < 32;
      })
      .slice(0, 30)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { selector: selectorFor(element), width: Math.round(rect.width), height: Math.round(rect.height) };
      });
    const tinyText = all
      .filter((element) => element.children.length === 0 && element.textContent?.trim())
      .filter((element) => Number.parseFloat(window.getComputedStyle(element).fontSize) < 11)
      .slice(0, 30)
      .map((element) => ({ selector: selectorFor(element), text: element.textContent.trim().slice(0, 80) }));
    const nestedSurfaces = all
      .filter((element) => element.matches(".MuiPaper-root, [class*='card'], [data-slot='card']"))
      .filter((element) => element.parentElement?.closest(".MuiPaper-root, [class*='card'], [data-slot='card']"))
      .length;
    const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(visible).map((element) => ({ level: element.tagName, text: element.textContent.trim().slice(0, 120) }));
    const header = all.find((element) => element.matches("header, [role='banner']"));
    const sidebar = all.find((element) => element.matches("aside, nav[aria-label*='sidebar' i], [data-sidebar='sidebar']"));

    return {
      bodyTextLength: bodyText.length,
      mojibakeSamples: [...new Set(bodyText.match(/\S*(?:Ã|Â|Ä|áº|á»|�|T\?t|ch\?)\S*/g) ?? [])].slice(0, 30),
      blankCandidate: bodyText.length < 120,
      pageOverflow: root.scrollWidth > root.clientWidth + 2,
      documentSize: { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, clientHeight: root.clientHeight, scrollHeight: root.scrollHeight },
      overflowing,
      unlabeledFields,
      iconButtonsMissingName,
      smallTargets,
      tinyText,
      imagesMissingAlt: [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("alt")).length,
      nestedSurfaces,
      headings,
      h1Count: headings.filter((heading) => heading.level === "H1").length,
      controls: controls.length,
      formFields: formFields.length,
      tables: document.querySelectorAll("table, [role='grid'], [role='table']").length,
      dialogs: document.querySelectorAll("[role='dialog']").length,
      muiElements: all.filter((element) => typeof element.className === "string" && element.className.includes("Mui")).length,
      legacyUtilityElements: all.filter((element) => typeof element.className === "string" && /(?:^|\s)(?:rounded-|bg-|text-|border-)/.test(element.className)).length,
      shell: {
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null,
      },
    };
  });
}

async function auditRoute(context, portalName, portal, route, viewport) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
  });

  const screenshotDir = path.join(OUTPUT_ROOT, "screenshots", viewport.name, portalName);
  await mkdir(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `${slugify(route)}.png`);
  const startedAt = Date.now();

  try {
    const response = await page.goto(`${portal.baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1_200);
    const finalUrl = page.url();
    const metrics = await inspectPage(page);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    return {
      portal: portalName,
      route,
      viewport: viewport.name,
      requestedUrl: `${portal.baseUrl}${route}`,
      finalUrl,
      redirectedToLogin: finalUrl.includes("/login"),
      status: response?.status() ?? null,
      title: await page.title(),
      durationMs: Date.now() - startedAt,
      screenshot: path.relative(process.cwd(), screenshotPath).replaceAll("\\", "/"),
      consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
      pageErrors: [...new Set(pageErrors)].slice(0, 20),
      failedResponses: failedResponses.filter((item, index, array) => array.findIndex((other) => other.status === item.status && other.url === item.url) === index).slice(0, 30),
      ...metrics,
    };
  } catch (error) {
    return {
      portal: portalName,
      route,
      viewport: viewport.name,
      requestedUrl: `${portal.baseUrl}${route}`,
      finalUrl: page.url(),
      durationMs: Date.now() - startedAt,
      fatalError: error instanceof Error ? error.message : String(error),
      screenshot: null,
      consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
      pageErrors: [...new Set(pageErrors)].slice(0, 20),
      failedResponses: failedResponses.slice(0, 30),
    };
  } finally {
    await page.close();
  }
}

function score(result) {
  if (result.fatalError || result.redirectedToLogin) return 100;
  return Math.min(99,
    (result.pageErrors?.length ?? 0) * 15 +
    (result.consoleErrors?.length ?? 0) * 4 +
    (result.pageOverflow ? 14 : 0) +
    (result.blankCandidate ? 12 : 0) +
    (result.mojibakeSamples?.length ?? 0) * 3 +
    Math.min(result.unlabeledFields?.length ?? 0, 8) * 2 +
    Math.min(result.iconButtonsMissingName?.length ?? 0, 8) * 2 +
    Math.min(result.smallTargets?.length ?? 0, 8) +
    Math.min(result.failedResponses?.length ?? 0, 5) * 2);
}

function markdownReport(results, authResults) {
  const ranked = [...results].map((result) => ({ ...result, riskScore: score(result) })).sort((a, b) => b.riskScore - a.riskScore);
  const count = (predicate) => results.filter(predicate).length;
  const lines = [
    "# Playwright UI audit results",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Coverage",
    "",
    `- Captures: ${results.length}`,
    `- Unique routes: ${new Set(results.map((result) => `${result.portal}:${result.route}`)).size}`,
    `- Viewports: ${[...new Set(results.map((result) => result.viewport))].join(", ")}`,
    `- Fatal/redirected: ${count((result) => result.fatalError || result.redirectedToLogin)}`,
    `- Horizontal overflow: ${count((result) => result.pageOverflow)}`,
    `- Blank candidates: ${count((result) => result.blankCandidate)}`,
    `- Mojibake candidates: ${count((result) => result.mojibakeSamples?.length)}`,
    `- Pages with console/page errors: ${count((result) => result.consoleErrors?.length || result.pageErrors?.length)}`,
    "",
    "## Authentication",
    "",
    "| Portal/viewport | Result | Method | Final URL |",
    "| --- | --- | --- | --- |",
    ...authResults.map((result) => `| ${result.portal}/${result.viewport} | ${result.ok ? "pass" : "fail"} | ${result.method} | ${result.finalUrl ?? ""} |`),
    "",
    "## Highest-risk captures",
    "",
    "| Score | Portal | Route | Viewport | Key signals | Screenshot |",
    "| ---: | --- | --- | --- | --- | --- |",
    ...ranked.slice(0, 40).map((result) => {
      const signals = [
        result.fatalError ? "fatal" : "",
        result.redirectedToLogin ? "login redirect" : "",
        result.pageOverflow ? "overflow" : "",
        result.blankCandidate ? "blank" : "",
        result.mojibakeSamples?.length ? `mojibake:${result.mojibakeSamples.length}` : "",
        result.unlabeledFields?.length ? `unlabeled:${result.unlabeledFields.length}` : "",
        result.iconButtonsMissingName?.length ? `icon-name:${result.iconButtonsMissingName.length}` : "",
        result.consoleErrors?.length || result.pageErrors?.length ? `errors:${(result.consoleErrors?.length ?? 0) + (result.pageErrors?.length ?? 0)}` : "",
      ].filter(Boolean).join(", ") || "none";
      return `| ${result.riskScore} | ${result.portal} | \`${result.route}\` | ${result.viewport} | ${signals} | ${result.screenshot ? `[image](../../${result.screenshot.replace(/^docs\/1107\//, "")})` : ""} |`;
    }),
    "",
    "Full machine-readable evidence is in `report.json`.",
  ];
  return lines.join("\n");
}

async function main() {
  await mkdir(OUTPUT_ROOT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const authResults = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ignoreHTTPSErrors: true,
        locale: "vi-VN",
        serviceWorkers: "block",
      });

      for (const [portalName, portal] of Object.entries(portals).filter(([name]) => !ONLY_PORTAL || name === ONLY_PORTAL)) {
        process.stdout.write(`${viewport.name.padEnd(7)} ${portalName.padEnd(9)} authenticating...\n`);
        const auth = await authenticate(context, portalName, portal.baseUrl);
        authResults.push({ ...auth, portal: portalName, viewport: viewport.name });
        process.stdout.write(`${viewport.name.padEnd(7)} ${portalName.padEnd(9)} auth ${auth.ok ? "OK" : "FAIL"}\n`);
        const routes = ROUTE_LIMIT > 0 ? portal.routes.slice(0, ROUTE_LIMIT) : portal.routes;
        for (const route of routes) {
          const result = await auditRoute(context, portalName, portal, route, viewport);
          results.push(result);
          process.stdout.write(`${viewport.name.padEnd(7)} ${portalName.padEnd(9)} ${route} ${result.fatalError ? "FATAL" : result.redirectedToLogin ? "LOGIN" : "OK"}\n`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    viewports,
    auth: authResults,
    results: results.map((result) => ({ ...result, riskScore: score(result) })),
  };
  await writeFile(path.join(OUTPUT_ROOT, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(OUTPUT_ROOT, "results.md"), `${markdownReport(results, authResults)}\n`, "utf8");
}

await main();
