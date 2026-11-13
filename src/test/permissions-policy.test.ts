import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const EXPECTED = "camera=(self), microphone=(), geolocation=(self)";

function nginxValue(): string | undefined {
  const conf = readFileSync(resolve(process.cwd(), "deploy/nginx/security-headers.conf"), "utf8");
  return /add_header\s+Permissions-Policy\s+"([^"]*)"/.exec(conf)?.[1];
}

function vercelValue(): string | undefined {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as {
    headers: { headers: { key: string; value: string }[] }[];
  };
  return config.headers
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === "Permissions-Policy")?.value;
}

describe("Permissions-Policy (timekeeping needs camera + geolocation)", () => {
  it("nginx and vercel use the same value", () => {
    expect(nginxValue()).toBe(vercelValue());
  });

  it("allows camera and geolocation for self, keeps microphone off", () => {
    expect(nginxValue()).toBe(EXPECTED);
    expect(vercelValue()).toBe(EXPECTED);
  });
});
