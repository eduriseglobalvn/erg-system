import { expect, test } from "vitest";

import { hasAdminLikeClaims } from "@/platform/auth/permissions/admin-like";

test("admin-like uses admin.workspace.access", () => {
  expect(hasAdminLikeClaims(["lms.class.read", " Admin.Workspace.Access "])).toBe(true);
});

test("role names, wildcard and look-alike permissions are not admin-like", () => {
  expect(hasAdminLikeClaims(["*", "lms.admin", "teacher.workspace.access"])).toBe(false);
  expect(hasAdminLikeClaims([])).toBe(false);
  expect(hasAdminLikeClaims(undefined)).toBe(false);
});
