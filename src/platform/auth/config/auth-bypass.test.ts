import { afterEach, describe, expect, it, vi } from "vitest";

async function loadFlag() {
  vi.resetModules();
  return (await import("@/platform/auth/config/auth-bypass")).AUTH_BYPASS_ENABLED;
}

describe("AUTH_BYPASS_ENABLED", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off by default", async () => {
    expect(await loadFlag()).toBe(false);
  });

  it("stays off in production even when VITE_AUTH_BYPASS=true", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_AUTH_BYPASS", "true");
    expect(await loadFlag()).toBe(false);
  });

  it("turns on only in dev with the flag set", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_AUTH_BYPASS", "true");
    expect(await loadFlag()).toBe(true);
  });
});
