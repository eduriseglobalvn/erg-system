import { expect, it } from "vitest";

import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";

it("covers /admin/profile so the guard does not fall through to access-denied", () => {
  expect(routePermissionForPath("/admin/profile", "ADMIN")?.permission).toBe("lms.admin");
});
