import { describe, expect, it } from "vitest";

import { ADMIN_LEARNING_STANDARDS_PATH } from "@/app/portal-route-registry";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";

describe("learning standards route authorization", () => {
  it("requires the Admin workspace and standards read permission", () => {
    expect(routePermissionForPath(ADMIN_LEARNING_STANDARDS_PATH, "ADMIN")).toMatchObject({
      workspace: "ADMIN",
      permission: "learning.standards.read",
      resource: "learning-standards",
    });
    expect(routePermissionForPath(ADMIN_LEARNING_STANDARDS_PATH, "TEACHER")).toBeUndefined();
  });
});
