import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

import { extractShellAssetUrls } from "./pwa-precache-policy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Pure budget check. `assets` is a list of { name, size } (raw bytes).
 * `budget` maps a chunk-name prefix -> max total bytes for files whose name
 * starts with `<prefix>-` (the "-" separates the chunk name from its hash and
 * from any sub-chunk, so `tanstack` also covers `tanstack-form`).
 * Returns { violations, checked } where a violation is
 * { chunk, actual, budget, over }.
 */
export function checkBudget(assets, budget) {
  const violations = [];
  const checked = [];
  for (const [prefix, max] of Object.entries(budget)) {
    if (prefix.startsWith("_")) continue; // reserved keys like "_comment"
    const matched = assets.filter((a) => a.name.startsWith(`${prefix}-`));
    const actual = matched.reduce((sum, a) => sum + a.size, 0);
    checked.push({ chunk: prefix, actual, budget: max, matched: matched.length });
    if (actual > max) violations.push({ chunk: prefix, actual, budget: max, over: actual - max });
  }
  return { violations, checked };
}

export function collectPerformanceMetrics(assetsDir, options = {}) {
  const distDir = options.distDir ?? path.dirname(assetsDir);
  const htmlPath = options.htmlPath ?? path.join(distDir, "index.html");
  const serviceWorkerPath = options.serviceWorkerPath ?? path.join(distDir, "sw.js");
  const files = assetsDirFiles(assetsDir);
  const entry = files.filter((asset) => /^index-[^/]+\.js$/.test(asset.name));
  if (entry.length !== 1) throw new Error(`Expected exactly one Vite entry chunk, found ${entry.length}.`);

  const html = fs.readFileSync(htmlPath, "utf8");
  const shellAssets = extractShellAssetUrls(html);
  const initialJavaScript = [...shellAssets]
    .filter((url) => url.endsWith(".js"))
    .map((url) => {
      const file = path.join(distDir, url);
      if (!fs.existsSync(file)) throw new Error(`Initial shell asset is missing from dist: ${url}`);
      return file;
    });
  const precacheUrls = readPrecacheUrls(serviceWorkerPath);
  const precacheFiles = precacheUrls
    .map((url) => path.join(distDir, url))
    .filter((file) => fs.existsSync(file));
  const precacheMissing = precacheUrls.filter((url) => !fs.existsSync(path.join(distDir, url)));
  const precacheUnexpectedJavaScript = precacheUrls.filter((url) =>
    url.startsWith("assets/") && url.endsWith(".js") && !shellAssets.has(url),
  );

  return {
    entryGzipBytes: gzipSize(entry[0].bytes),
    initialJavaScriptGzipBytes: initialJavaScript.reduce((sum, file) => sum + gzipSize(fs.readFileSync(file)), 0),
    initialJavaScriptCount: initialJavaScript.length,
    precacheEntries: precacheUrls.length,
    precacheJavaScriptEntries: precacheUrls.filter((url) => url.endsWith(".js")).length,
    precacheBytes: precacheFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0),
    precacheMissing,
    precacheUnexpectedJavaScript,
  };
}

function readAssets(dir) {
  return assetsDirFiles(dir).map(({ name, bytes }) => ({ name, size: bytes.length }));
}

function assetsDirFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".js"))
    .map((e) => ({ name: e.name, bytes: fs.readFileSync(path.join(dir, e.name)) }));
}

function gzipSize(bytes) {
  return zlib.gzipSync(bytes, { level: 9 }).byteLength;
}

function readPrecacheUrls(serviceWorkerPath) {
  if (!fs.existsSync(serviceWorkerPath)) return [];
  const source = fs.readFileSync(serviceWorkerPath, "utf8");
  return [...source.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function main() {
  const dir = path.resolve(argValue("--dir") ?? path.join(ROOT, "dist/assets"));
  if (!fs.existsSync(dir)) {
    console.error(`Bundle dir not found: ${dir}. Run \`vite build\` first (or pass --dir).`);
    process.exitCode = 1;
    return;
  }
  const budget = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/bundle-budget.json"), "utf8"));
  const { violations: chunkViolations, checked } = checkBudget(readAssets(dir), budget);
  const violations = [...chunkViolations];

  for (const c of checked) {
    const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
    console.log(`${c.actual > c.budget ? "FAIL" : "ok  "} ${c.chunk}: ${kb(c.actual)} / ${kb(c.budget)} (${c.matched} file${c.matched === 1 ? "" : "s"})`);
  }
  const distDir = path.dirname(dir);
  if (fs.existsSync(path.join(distDir, "index.html")) && fs.existsSync(path.join(distDir, "sw.js"))) {
    const metrics = collectPerformanceMetrics(dir, { distDir });
    const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
    const entryBudget = budget._entry_gzip_budget;
    const precacheEntryBudget = budget._precache_entry_budget;
    const precacheByteBudget = budget._precache_byte_budget;
    console.log(`entry gzip: ${kb(metrics.entryGzipBytes)} / ${kb(entryBudget)} (${metrics.entryGzipBytes <= entryBudget ? "ok" : "FAIL"})`);
    console.log(`initial JS graph gzip: ${kb(metrics.initialJavaScriptGzipBytes)} (${metrics.initialJavaScriptCount} requested JS assets; informational because shared shell dependencies are currently eager)`);
    console.log(`PWA precache: ${metrics.precacheEntries} entries / ${kb(metrics.precacheBytes)}; JavaScript ${metrics.precacheJavaScriptEntries}`);
    if (metrics.entryGzipBytes > entryBudget) violations.push({ chunk: "entry-gzip", actual: metrics.entryGzipBytes, budget: entryBudget, over: metrics.entryGzipBytes - entryBudget });
    if (metrics.precacheEntries > precacheEntryBudget) violations.push({ chunk: "pwa-precache-entries", actual: metrics.precacheEntries, budget: precacheEntryBudget, over: metrics.precacheEntries - precacheEntryBudget });
    if (metrics.precacheBytes > precacheByteBudget) violations.push({ chunk: "pwa-precache-bytes", actual: metrics.precacheBytes, budget: precacheByteBudget, over: metrics.precacheBytes - precacheByteBudget });
    if (metrics.precacheMissing.length) {
      console.error(`PWA precache references missing files: ${metrics.precacheMissing.join(", ")}`);
      violations.push({ chunk: "pwa-precache-missing", actual: metrics.precacheMissing.length, budget: 0, over: metrics.precacheMissing.length });
    }
    if (metrics.precacheUnexpectedJavaScript.length) {
      console.error(`PWA precache contains non-shell JavaScript: ${metrics.precacheUnexpectedJavaScript.join(", ")}`);
      violations.push({ chunk: "pwa-precache-lazy-javascript", actual: metrics.precacheUnexpectedJavaScript.length, budget: 0, over: metrics.precacheUnexpectedJavaScript.length });
    }
  }
  if (violations.length) {
    console.error(`\nBundle budget exceeded for ${violations.length} chunk(s):`);
    for (const v of violations) console.error(`- ${v.chunk}: +${(v.over / 1024).toFixed(1)}KB over budget`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${checked.length} budgeted chunks within limit.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
