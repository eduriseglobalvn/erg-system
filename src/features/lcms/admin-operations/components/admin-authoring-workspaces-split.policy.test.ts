import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lcms/admin-operations/components");

describe("Admin and authoring workspace ownership", () => {
  it.each([
    "admin-operations-workspace.tsx",
    "learning-resource-authoring-create-dialog.tsx",
    "learning-resource-curriculum-explorer.tsx",
  ])("keeps %s below the 250-line container budget", (fileName) => {
    const source = readFileSync(resolve(ROOT, fileName), "utf8");
    expect(source.split(/\r?\n/).length, `${fileName} remains a god file`).toBeLessThanOrEqual(250);
  });

  it("keeps existing authoring screen-model and presentation owners reusable", () => {
    for (const fileName of [
      "learning-resource-authoring-screen-model.ts",
      "learning-resource-authoring-catalog-screens.tsx",
      "learning-resource-authoring-dialogs.tsx",
      "learning-resource-authoring-upload-screen.tsx",
    ]) {
      expect(() => readFileSync(resolve(ROOT, fileName), "utf8")).not.toThrow();
    }
  });

  it("does not source admin metrics from classroom fixtures", () => {
    const workspace = readFileSync(resolve(ROOT, "admin-operations-workspace.tsx"), "utf8");
    const support = readFileSync(resolve(ROOT, "admin-operations-support.tsx"), "utf8");
    expect(workspace).not.toContain("mock-classroom-data");
    expect(support).not.toContain("mock-classroom-data");
    expect(workspace).toContain("centers: ClassroomSchool[]");
    expect(workspace).toContain("classes: ClassroomSnapshot[]");
  });
});
