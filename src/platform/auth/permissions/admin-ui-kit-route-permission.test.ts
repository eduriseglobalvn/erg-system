import { expect, it } from "vitest";

import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";

it("restricts /admin/ui-kit to the ADMIN workspace with lms.admin", () => {
  expect(routePermissionForPath("/admin/ui-kit", "ADMIN")?.permission).toBe("lms.admin");
  expect(routePermissionForPath("/admin/ui-kit", "TEACHER")).toBeUndefined();
});
