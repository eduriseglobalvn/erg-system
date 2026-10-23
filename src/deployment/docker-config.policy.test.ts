import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("dedicated-server Docker delivery contract", () => {
  it("uses a reproducible multi-stage build and runtime healthcheck", () => {
    const dockerfile = read("Dockerfile");
    expect(dockerfile).toContain("bun install --frozen-lockfile");
    expect(dockerfile).toContain("bun run build");
    expect(dockerfile).toContain("FROM nginx:1.27-alpine AS runtime");
    expect(dockerfile).toContain("BACKEND_UPSTREAM");
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).toContain("/opt/erg-dist");
    expect(dockerfile).toContain("15-promote-erg-release.sh");
  });

  it("keeps runtime BE switching outside the FE build and hardens the container", () => {
    const compose = read("docker-compose.yml");
    const nginx = read("deploy/nginx/default.conf.template");
    expect(compose).toContain("BACKEND_UPSTREAM");
    expect(compose).toContain("no-new-privileges:true");
    expect(compose).toContain("read_only: true");
    expect(compose).toContain("erg-fe-release-store:/usr/share/nginx/html");
    expect(compose).toContain("restart: unless-stopped");
    expect(nginx).toContain("proxy_pass ${BACKEND_UPSTREAM};");
    expect(nginx).toContain("location = /healthz");
    expect(nginx).toContain("try_files $uri $uri/ /index.html;");
  });

  it("promotes assets first, index atomically, and the service worker last", () => {
    const promotion = read("deploy/docker/promote-release.sh");
    const assetCopy = promotion.indexOf('"$SOURCE_ROOT/assets/."');
    const indexPromotion = promotion.indexOf('promote_file "index.html"');
    const serviceWorkerPromotion = promotion.indexOf('promote_file "sw.js"');

    expect(assetCopy).toBeGreaterThan(-1);
    expect(indexPromotion).toBeGreaterThan(assetCopy);
    expect(serviceWorkerPromotion).toBeGreaterThan(indexPromotion);
    expect(promotion).toContain('mv -f "$temporary_path" "$target_path"');
  });

  it("keeps update pointers fresh while caching only hashed Vite assets as immutable", () => {
    const nginx = read("deploy/nginx/default.conf.template");
    const vercel = read("vercel.json");

    expect(nginx).toContain("location = /index.html");
    expect(nginx).toContain("location = /sw.js");
    expect(nginx).toContain("location = /manifest.webmanifest");
    expect(nginx).toContain("location ^~ /assets/");
    expect(nginx).toContain('Cache-Control "public, max-age=31536000, immutable"');
    expect(nginx).toContain('Cache-Control "no-cache, no-store, must-revalidate"');
    expect(vercel).toContain('"source": "/assets/(.*)"');
    expect(vercel).toContain('"source": "/sw.js"');
  });

  it("documents emergency upstream rotation and rollback", () => {
    const guide = read("docs/deployment/dedicated-server.md");
    expect(guide).toContain("--force-recreate");
    expect(guide).toContain("No FE rebuild is required");
    expect(guide).toContain("Rollback");
  });
});
