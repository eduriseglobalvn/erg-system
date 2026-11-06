import { expect, test } from "vitest";

import { hasAdminLikeClaims } from "@/platform/auth/permissions/admin-like";

test("admin-like by role (case/space-insensitive) or by lms.admin / * permission", () => {
  expect(hasAdminLikeClaims([" Super_Admin "])).toBe(true);
  expect(hasAdminLikeClaims(["teacher"], ["LMS.ADMIN"])).toBe(true);
  expect(hasAdminLikeClaims([], ["*"])).toBe(true);
});

test("teacher and look-alike roles are not admin-like", () => {
  expect(hasAdminLikeClaims(["teacher", "administrator", "center_admin"], ["lms.teacher"])).toBe(false);
  expect(hasAdminLikeClaims([])).toBe(false);
});
