import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lms/components");

describe("LMS Teacher Shell ownership", () => {
  it("keeps the public shell below 200 lines and free of direct data fetching", () => {
    const source = readFileSync(resolve(ROOT, "lms-teacher-shell.tsx"), "utf8");

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(200);
    expect(source).not.toMatch(/@tanstack\/react-query/);
    expect(source).not.toMatch(/loadLms(?:DashboardBootstrap|TeacherHomeworkWorkspace)/);
  });

  it.each([
    "use-lms-teacher-shell-controller.ts",
    "lms-teacher-shell-config.tsx",
    "lms-teacher-shell-workspaces.tsx",
    "lms-teacher-shell-presentation.tsx",
  ])("has a dedicated %s owner", (fileName) => {
    expect(() => readFileSync(resolve(ROOT, fileName), "utf8")).not.toThrow();
  });
});
