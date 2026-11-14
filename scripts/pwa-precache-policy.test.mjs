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
  await writeFile(temp, '<script src="/assets/index-hash.js"></script><link rel="modulepreload" href="/assets/auth-hash.js"><link rel="stylesheet" href="/assets/index-hash.css">');
  try {
    const result = await filterPwaPrecacheManifest([
      { url: "index.html", revision: "index" },
      { url: "assets/index-hash.js", revision: null },
      { url: "assets/auth-hash.js", revision: null },
      { url: "assets/quiz-editor-hash.js", revision: null },
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

test("filterPwaPrecacheManifest drops lazy route CSS but keeps shell CSS", async () => {
  const temp = new URL(`./.pwa-policy-css-${Date.now()}.html`, import.meta.url);
  const { writeFile, rm } = await import("node:fs/promises");
  await writeFile(temp, '<script src="/assets/index-hash.js"></script><link rel="stylesheet" href="/assets/index-hash.css">');
  try {
  const result = await filterPwaPrecacheManifest(
    [
      { url: "assets/index-hash.js", revision: null },
      { url: "assets/index-hash.css", revision: null },
      { url: "assets/quiz-editor-hash.css", revision: null },
    ],
    temp,
  );
  assert.deepEqual(result.manifest.map((entry) => entry.url), ["assets/index-hash.js", "assets/index-hash.css"]);
  } finally {
    await rm(temp, { force: true });
  }
});

test("filterPwaPrecacheManifest keeps one entry per URL", async () => {
  const temp = new URL(`./.pwa-policy-dup-${Date.now()}.html`, import.meta.url);
  const { writeFile, rm } = await import("node:fs/promises");
  await writeFile(temp, '<script src="/assets/index-hash.js"></script>');
  try {
    const result = await filterPwaPrecacheManifest(
      [
        { url: "assets/index-hash.js", revision: null },
        { url: "icon.png", revision: "a" },
        { url: "icon.png", revision: "a" },
      ],
      temp,
    );
    assert.deepEqual(result.manifest.map((entry) => entry.url), ["assets/index-hash.js", "icon.png"]);
  } finally {
    await rm(temp, { force: true });
  }
});

test("precaches the student and quiz player chunks with their static imports for school labs", async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dist = await mkdtemp(join(tmpdir(), "pwa-lab-"));
  await mkdir(join(dist, "assets"));
  await writeFile(join(dist, "index.html"), '<script src="/assets/index-hash.js"></script>');
  await writeFile(join(dist, "assets/student-page-hash.js"), 'import{a}from"./mui-hash.js";const l=()=>import("./xlsx-hash.js");');
  await writeFile(join(dist, "assets/mui-hash.js"), 'import "./react-hash.js";');
  await writeFile(join(dist, "assets/react-hash.js"), "");
  try {
    const result = await filterPwaPrecacheManifest(
      ["index-hash", "student-page-hash", "mui-hash", "react-hash", "xlsx-hash", "admin-hash"].map((name) => ({ url: `assets/${name}.js`, revision: null })),
      join(dist, "index.html"),
    );
    assert.deepEqual(result.manifest.map((entry) => entry.url), [
      "assets/index-hash.js",
      "assets/student-page-hash.js",
      "assets/mui-hash.js",
      "assets/react-hash.js",
    ]);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
