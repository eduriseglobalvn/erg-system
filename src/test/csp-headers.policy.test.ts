import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const nginxHeaders = read("deploy/nginx/security-headers.conf");
const vercelHeaders = (JSON.parse(read("vercel.json")) as { headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }> })
  .headers.flatMap((rule) => rule.headers);

const nginxCsp = nginxHeaders.match(/^add_header Content-Security-Policy "([^"]+)" always;\r?$/m)?.[1];
const vercelCsp = vercelHeaders.find((header) => header.key === "Content-Security-Policy")?.value;
const directive = (policy: string | undefined, name: string) =>
  policy?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name} `));

describe("Content-Security-Policy headers (SEC-01)", () => {
  it("is enforced, not report-only, in nginx and on Vercel", () => {
    expect(nginxHeaders).not.toContain("Content-Security-Policy-Report-Only");
    expect(vercelHeaders.map((header) => header.key)).not.toContain("Content-Security-Policy-Report-Only");
    expect(nginxCsp).toBeTruthy();
  });

  it("uses the same policy in both places", () => {
    expect(vercelCsp).toBe(nginxCsp);
  });

  it("never allows inline or eval script", () => {
    const scriptSrc = directive(nginxCsp, "script-src") ?? directive(nginxCsp, "default-src");
    expect(scriptSrc).toBe("script-src 'self'");
    expect(nginxCsp).not.toContain("unsafe-eval");
  });

  it("blocks plugins, base rewriting and framing", () => {
    expect(directive(nginxCsp, "object-src")).toBe("object-src 'none'");
    expect(directive(nginxCsp, "base-uri")).toBe("base-uri 'self'");
    expect(directive(nginxCsp, "frame-ancestors")).toBe("frame-ancestors 'none'");
  });
});
