import assert from "node:assert/strict";
import { test } from "node:test";

import { extractShellAssetUrls, filterPwaPrecacheManifest } from "./pwa-precache-policy.mjs";

test("extracts entry and modulepreload assets from the generated shell", () => {
  const assets = extractShellAssetUrls(`
    <script type="module" src="/assets/index-hash.js"></script>
    <link rel="modulepreload" href="/assets/tanstack-hash.js">
    <link rel="stylesheet" href="/assets/index-hash.css">
  `);
  assert.deepEqual([...assets], ["assets/index-hash.js", "assets/tanstack-hash.js", "assets/index-hash.css"]);
});

test("keeps shell JavaScript and static files but removes lazy JavaScript", async () => {
  const temp = new URL(`./.pwa-policy-${Date.now()}.html`, import.meta.url);
  const { writeFile, rm } = await import("node:fs/promises");
  await writeFile(temp, '<script src="/assets/index-hash.js"></script><link rel="modulepreload" href="/assets/auth-hash.js">');
  try {
    const result = await filterPwaPrecacheManifest([
      { url: "index.html", revision: "index" },
      { url: "assets/index-hash.js", revision: null },
      { url: "assets/auth-hash.js", revision: null },
      { url: "assets/student-page-hash.js", revision: null },
      { url: "assets/index-hash.css", revision: null },
      { url: "favicon.svg", revision: "favicon" },
    ], temp);
    assert.deepEqual(result.manifest.map((entry) => entry.url), [
      "index.html",
      "assets/index-hash.js",
      "assets/auth-hash.js",
      "assets/index-hash.css",
      "favicon.svg",
    ]);
    assert.match(result.warnings[0], /removed 1/);
  } finally {
    await rm(temp, { force: true });
  }
});

test("fails closed when the generated shell has no JavaScript entry", async () => {
  const temp = new URL(`./.pwa-policy-empty-${Date.now()}.html`, import.meta.url);
  const { writeFile, rm } = await import("node:fs/promises");
  await writeFile(temp, "<html><link rel=stylesheet href=/assets/index.css></html>");
  try {
    await assert.rejects(() => filterPwaPrecacheManifest([], temp), /found no JavaScript/);
  } finally {
    await rm(temp, { force: true });
  }
});
