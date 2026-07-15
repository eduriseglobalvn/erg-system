import { describe, expect, test } from "vitest";

import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

describe("permission evaluator", () => {
  test("allows exact, module wildcard, and global wildcard grants", () => {
    expect(evaluatePermission({ permission: "lms.grade.read", grantedPermissions: ["lms.grade.read"] })).toBe(true);
    expect(evaluatePermission({ permission: "lms.grade.write", grantedPermissions: ["lms.grade.*"] })).toBe(true);
    expect(evaluatePermission({ permission: "lms.grade.finalize", grantedPermissions: ["*"] })).toBe(true);
  });

  test("normalizes casing and whitespace", () => {
    expect(evaluatePermission({ permission: "lms.grade.read", grantedPermissions: [" LMS.GRADE.READ "] })).toBe(true);
  });

  test("makes explicit and wildcard denies win over allows", () => {
    expect(
      evaluatePermission({
        permission: "lms.grade.write",
        grantedPermissions: ["lms.grade.*"],
        deniedPermissions: ["lms.grade.write"],
      }),
    ).toBe(false);
    expect(
      evaluatePermission({
        permission: "lms.grade.finalize",
        grantedPermissions: ["*"],
        deniedPermissions: ["lms.grade.*"],
      }),
    ).toBe(false);
  });

  test("denies access outside the assigned scope", () => {
    expect(
      evaluatePermission({
        permission: "lms.attendance.write",
        grantedPermissions: ["lms.attendance.write"],
        requestedScopeId: "school-2",
        assignedScopeIds: ["school-1"],
      }),
    ).toBe(false);
  });

  test("does not treat an empty permission set as implicit access", () => {
    expect(evaluatePermission({ permission: "lms.dashboard.read", grantedPermissions: [] })).toBe(false);
  });
});
