import { describe, expect, it } from "vitest";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";

describe("learning outcomes route permission matrix", () => {
  it.each([
    ["/admin/learning-outcomes", "ADMIN", "learning.outcomes.manage"],
    ["/teacher/learning-outcomes", "TEACHER", "learning.outcomes.read"],
    ["/student/learning-outcomes", "STUDENT", "learning.outcomes.read"],
  ] as const)("maps %s to the canonical %s permission", (path, workspace, permission) => {
    expect(routePermissionForPath(path, workspace)).toMatchObject({ workspace, permission });
  });

  it("does not let the admin capability bleed into the teacher route", () => {
    expect(routePermissionForPath("/admin/learning-outcomes", "TEACHER")).toBeUndefined();
  });
});
