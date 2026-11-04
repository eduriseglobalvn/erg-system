import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { isCanonicalLmsWorkspaceHost } from "@/platform/workspaces/workspace-route";

function atHost(host: string) {
  vi.stubGlobal("window", { location: { host, hostname: host.split(":")[0], pathname: "/", port: "3001", protocol: "https:" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("host resolution (single policy)", () => {
  it.each([
    ["prod lms", "lms.erg.edu.vn", "lms", true],
    ["prod crm", "crm.erg.edu.vn", "crm", false],
    [".local lms", "lms.erg.edu.local:3001", "lms", true],
    ["localhost", "localhost:3001", "lms", true],
    ["unknown", "evil.example", null, false],
  ] as const)("%s (dev)", (_label, host, portal, canonical) => {
    atHost(host);
    expect(resolveActivePortal()).toBe(portal);
    expect(isCanonicalLmsWorkspaceHost(window.location)).toBe(canonical);
  });

  it("never treats local hosts as LMS in production builds", () => {
    vi.stubEnv("DEV", false);
    atHost("localhost:3001");
    expect(resolveActivePortal()).toBeNull();
    expect(isCanonicalLmsWorkspaceHost(window.location)).toBe(false);
    atHost("foo.localhost:3001");
    expect(isCanonicalLmsWorkspaceHost(window.location)).toBe(false);
  });

  it("accepts *.localhost in dev", () => {
    atHost("foo.localhost:3001");
    expect(isCanonicalLmsWorkspaceHost(window.location)).toBe(true);
  });
});
