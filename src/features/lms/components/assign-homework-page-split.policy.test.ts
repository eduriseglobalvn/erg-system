import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const COMPONENT_ROOT = resolve(process.cwd(), "src/features/lms/components");

describe("AssignHomeworkPage ownership", () => {
  it("keeps the public page as a thin composition owner", () => {
    const source = readFileSync(resolve(COMPONENT_ROOT, "assign-homework-page.tsx"), "utf8");

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(200);
    expect(source).not.toMatch(/@tanstack\/react-query/);
    expect(source).not.toMatch(/useCreateLmsAssignmentMutation/);
    expect(source).not.toMatch(/loadLmsClassWorkspace/);
  });

  it.each([
    "use-assign-homework-controller.ts",
    "assign-homework-mobile-view.tsx",
    "assign-homework-desktop-view.tsx",
  ])("has a dedicated %s owner", (fileName) => {
    expect(() => readFileSync(resolve(COMPONENT_ROOT, fileName), "utf8")).not.toThrow();
  });
});
