import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lms/weekly-class-log");

describe("weekly class log offline boundary", () => {
  it("does not persist teaching data through the unscoped localStorage helper", () => {
    const model = readFileSync(resolve(ROOT, "components/weekly-class-log-model.ts"), "utf8");
    const controller = readFileSync(resolve(ROOT, "components/use-weekly-class-log-controller.ts"), "utf8");
    expect(model).not.toContain("localStorage");
    expect(controller).not.toContain("persisted-store");
    expect(controller).not.toContain("setPersistedJsonValue");
    expect(controller).toContain("session-only");
  });
});
