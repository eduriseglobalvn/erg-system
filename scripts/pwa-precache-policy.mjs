import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The student portal and quiz player are the cold path for whole school labs behind a slow international link
// (the FE and API both sit in Hong Kong). Precaching them lets a machine fetch the exam JS once, off-peak.
const LAB_COLD_PATH_ROOTS = [/^assets\/student-page-/, /^assets\/player-shell-runtime-/];
// Static imports only; dynamic import("./x.js") stays lazy.
const STATIC_IMPORT_PATTERN = /(?:import|from)\s*["']\.\/([\w.-]+\.js)["']/g;

const ASSET_URL_PATTERN = /(?:src|href)=["'](\/?assets\/[^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi;

export function extractShellAssetUrls(indexHtml) {
  const urls = new Set();
  for (const match of indexHtml.matchAll(ASSET_URL_PATTERN)) {
    urls.add(normalizeAssetUrl(match[1]));
  }
  return urls;
}

export async function filterPwaPrecacheManifest(entries, indexHtmlPath) {
  const html = await fs.readFile(indexHtmlPath, "utf8");
  const shellAssets = extractShellAssetUrls(html);
  const distDir = path.dirname(indexHtmlPath instanceof URL ? fileURLToPath(indexHtmlPath) : indexHtmlPath);
  for (const url of labColdPathAssetUrls(distDir, entries.map((entry) => entry.url))) shellAssets.add(url);
  const shellJavaScript = [...shellAssets].filter((url) => url.endsWith(".js"));
  if (shellJavaScript.length === 0) {
    throw new Error(`PWA shell asset policy found no JavaScript in ${indexHtmlPath}`);
  }

  const seen = new Set();
  const manifest = entries.filter((entry) => {
    const url = normalizeAssetUrl(entry.url);
    // includeAssets and globPatterns both list static files; keep one entry per URL.
    if (seen.has(url)) return false;
    seen.add(url);
    if (!url.startsWith("assets/") || !/\.(?:js|css)$/.test(url)) return true;
    return shellAssets.has(url);
  });
  const removedJavaScript = entries.length - manifest.length;
  return {
    manifest,
    warnings: removedJavaScript > 0
      ? [`PWA shell policy removed ${removedJavaScript} non-critical JS/CSS asset(s) from precache.`]
      : [],
  };
}

export function labColdPathAssetUrls(distDir, assetUrls) {
  const assets = new Set();
  const pending = assetUrls.map(normalizeAssetUrl).filter((url) => LAB_COLD_PATH_ROOTS.some((root) => root.test(url)) && url.endsWith(".js"));
  while (pending.length > 0) {
    const url = pending.pop();
    if (assets.has(url)) continue;
    assets.add(url);
    const source = readFileSync(path.join(distDir, url), "utf8");
    for (const match of source.matchAll(STATIC_IMPORT_PATTERN)) pending.push(`assets/${match[1]}`);
  }
  return assets;
}

function normalizeAssetUrl(url) {
  return url.replace(/^\/+/, "").split("?", 1)[0];
}
