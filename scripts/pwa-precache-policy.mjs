import fs from "node:fs/promises";

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
  const shellJavaScript = [...shellAssets].filter((url) => url.endsWith(".js"));
  if (shellJavaScript.length === 0) {
    throw new Error(`PWA shell asset policy found no JavaScript in ${indexHtmlPath}`);
  }

  const manifest = entries.filter((entry) => {
    const url = normalizeAssetUrl(entry.url);
    if (!url.startsWith("assets/") || !url.endsWith(".js")) return true;
    return shellAssets.has(url);
  });
  const removedJavaScript = entries.length - manifest.length;
  return {
    manifest,
    warnings: removedJavaScript > 0
      ? [`PWA shell policy removed ${removedJavaScript} non-critical JavaScript asset(s) from precache.`]
      : [],
  };
}

function normalizeAssetUrl(url) {
  return url.replace(/^\/+/, "").split("?", 1)[0];
}
