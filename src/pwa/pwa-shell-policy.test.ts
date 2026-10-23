import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const root = resolve(process.cwd());

it("ships one canonical Teacher/Student ERG learning PWA manifest", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.webmanifest"), "utf8")) as {
    id: string;
    scope: string;
    start_url: string;
    shortcuts?: Array<{ url?: string }>;
  };

  expect(manifest.id).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.start_url).toBe("/?source=pwa");
  expect(manifest.shortcuts?.some((shortcut) => shortcut.url?.startsWith("/teacher"))).toBe(true);
  expect(manifest.shortcuts?.some((shortcut) => shortcut.url?.startsWith("/student"))).toBe(true);
  expect(manifest.shortcuts?.every((shortcut) => !/token|jwt|sso/i.test(shortcut.url ?? ""))).toBe(true);

  const manifests = readdirSync(resolve(root, "public")).filter((file) => file.endsWith(".webmanifest") || file.endsWith(".json") && file.includes("manifest"));
  expect(manifests).toEqual(["manifest.webmanifest"]);
});

it("keeps auth and API traffic out of Workbox caches", () => {
  const viteConfig = readFileSync(resolve(root, "vite.config.ts"), "utf8");
  expect(viteConfig).toContain("VitePWA");
  expect(viteConfig).toContain('handler: "NetworkOnly"');
  expect(viteConfig).toContain("navigateFallbackDenylist");
  expect(viteConfig).toContain("manifestTransforms");
  expect(viteConfig).toContain("filterPwaPrecacheManifest");
  expect(viteConfig).toContain('registerType: "prompt"');
  expect(viteConfig).toContain("skipWaiting: false");
  expect(viteConfig).not.toContain('registerType: "autoUpdate"');
  expect(viteConfig).toContain('globIgnores: ["**/mock/**"]');
  expect(viteConfig).toContain("/^\\/api\\//");
  expect(viteConfig).toContain("/^\\/auth\\//");
  expect(viteConfig).toContain("/^\\/sso\\//");
});
