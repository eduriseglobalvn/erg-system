import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile online status ownership", () => {
  it("delegates to the shared network-quality source instead of adding page listeners", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/lms/mobile/hooks/use-online-status.ts"), "utf8");
    expect(source).toContain("subscribeNetworkState");
    expect(source).not.toContain("window.addEventListener");
    expect(source).not.toContain("navigator.onLine");
  });
});
