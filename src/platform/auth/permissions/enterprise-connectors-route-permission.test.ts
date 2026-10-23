import { describe, expect, it } from "vitest";

import { ADMIN_ENTERPRISE_CONNECTORS_PATH } from "@/app/portal-route-registry";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";

describe("enterprise connector route authorization", () => {
  it("requires Admin workspace and read permission at the route boundary", () => {
    expect(routePermissionForPath(ADMIN_ENTERPRISE_CONNECTORS_PATH, "ADMIN")).toMatchObject({
      workspace: "ADMIN",
      permission: "enterprise.connectors.read",
      resource: "enterprise-connectors",
    });
    expect(routePermissionForPath(ADMIN_ENTERPRISE_CONNECTORS_PATH, "TEACHER")).toBeUndefined();
  });
});
