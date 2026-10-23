import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkBudget, collectPerformanceMetrics } from "./check-bundle-budget.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("flags a chunk that exceeds its budget", () => {
  const { violations } = checkBudget(
    [{ name: "mui-icons-abc123.js", size: 4_800_000 }],
    { "mui-icons": 4_700_000 },
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].chunk, "mui-icons");
  assert.equal(violations[0].over, 100_000);
});

test("passes a chunk at or under its budget", () => {
  const { violations } = checkBudget(
    [{ name: "pdfjs-x.js", size: 475_000 }],
    { pdfjs: 475_000 },
  );
  assert.deepEqual(violations, []);
});

test("sums sub-chunks sharing a prefix (tanstack + tanstack-form)", () => {
  const { violations, checked } = checkBudget(
    [
      { name: "tanstack-a.js", size: 260_000 },
      { name: "tanstack-form-b.js", size: 60_000 },
    ],
    { tanstack: 305_000 },
  );
  assert.equal(checked[0].actual, 320_000);
  assert.equal(checked[0].matched, 2);
  assert.equal(violations.length, 1);
});

test("ignores reserved underscore keys and prefix false-positives", () => {
  const { violations, checked } = checkBudget(
    // "icons-*" must not match the "mui-icons-*" budget or vice versa.
    [{ name: "icons-z.js", size: 20_000 }],
    { _comment: "docs", "mui-icons": 100, icons: 24_000 },
  );
  assert.deepEqual(violations, []);
  assert.deepEqual(checked.map((c) => c.chunk), ["mui-icons", "icons"]);
  assert.equal(checked.find((c) => c.chunk === "mui-icons").matched, 0);
});

test("treats a missing chunk (0 bytes) as within budget", () => {
  const { violations } = checkBudget([], { fullcalendar: 900_000 });
  assert.deepEqual(violations, []);
});

test("measures the entry gzip and generated PWA precache instead of only raw chunk bytes", () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "erg-bundle-metrics-"));
  const assetsDir = path.join(fixtureDir, "assets");
  fs.mkdirSync(assetsDir);
  fs.writeFileSync(path.join(fixtureDir, "index.html"), '<script type="module" src="/assets/index-fixture.js"></script><link rel="modulepreload" href="/assets/shell-fixture.js">');
  fs.writeFileSync(path.join(assetsDir, "index-fixture.js"), "console.log('entry');");
  fs.writeFileSync(path.join(assetsDir, "shell-fixture.js"), "console.log('shell');");
  fs.writeFileSync(path.join(assetsDir, "lazy-fixture.js"), "console.log('lazy');");
  fs.writeFileSync(path.join(fixtureDir, "sw.js"), 'precacheAndRoute([{url:"index.html"},{url:"assets/index-fixture.js"},{url:"assets/shell-fixture.js"}]);');
  try {
    const metrics = collectPerformanceMetrics(assetsDir);
    assert.equal(metrics.initialJavaScriptCount, 2);
    assert.ok(metrics.entryGzipBytes > 0);
    assert.equal(metrics.precacheEntries, 3);
    assert.equal(metrics.precacheJavaScriptEntries, 2);
    assert.equal(metrics.precacheMissing.length, 0);
    assert.deepEqual(metrics.precacheUnexpectedJavaScript, []);
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("CI builds before enforcing the canonical budget and always uploads its report", () => {
  const workflowPath = path.join(ROOT, ".github/workflows/frontend-performance-budget.yml");
  const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, "utf8") : "";
  const buildIndex = workflow.indexOf("bun run build");
  const budgetIndex = workflow.indexOf("bun run budget:check");

  assert.ok(buildIndex >= 0, "performance workflow must build the production bundle");
  assert.ok(budgetIndex > buildIndex, "budget gate must run after the production build");
  assert.match(workflow, /bun run budget:test/);
  assert.match(workflow, /if:\s*always\(\)/);
  assert.match(workflow, /bundle-budget-report\.txt/);
  assert.doesNotMatch(workflow, /(?:index|pdfjs|tanstack|dnd|icons):\s*\d+/);
});

test("CLI exits non-zero and prints the offending chunk when a built asset exceeds budget", () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "erg-bundle-budget-"));
  try {
    fs.writeFileSync(path.join(fixtureDir, "index-regression.js"), Buffer.alloc(340_001));
    const result = spawnSync(process.execPath, [path.join(ROOT, "scripts/check-bundle-budget.mjs"), "--dir", fixtureDir], {
      encoding: "utf8",
    });

    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /FAIL index/);
    assert.match(`${result.stdout}\n${result.stderr}`, /Bundle budget exceeded/);
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});
