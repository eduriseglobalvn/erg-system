import { describe, expect, test } from "vitest";

import { lmsPaths } from "@/platform/auth/permissions/portal-route-registry";
import {
  LMS_CROSS_MODULE_ROUTE_PERMISSIONS,
  LMS_PERMISSION_CATALOG,
  LMS_PROTECTED_ROUTES,
  LMS_ROUTE_PERMISSIONS,
} from "@/platform/auth/permissions/lms-permission-catalog";

describe("LMS permission catalog", () => {
  test("covers every protected LMS route exactly once", () => {
    expect(LMS_PROTECTED_ROUTES).toEqual(expect.arrayContaining([...lmsPaths, "resources", "homework/class"]));
    expect(Object.keys(LMS_ROUTE_PERMISSIONS).sort()).toEqual([...LMS_PROTECTED_ROUTES].sort());
  });

  test("uses unique canonical dot-notation permissions", () => {
    expect(new Set(LMS_PERMISSION_CATALOG).size).toBe(LMS_PERMISSION_CATALOG.length);
    expect(
      LMS_PERMISSION_CATALOG.every((permission) => /^(?:(?:lms|account)(?:\.[a-z_]+){2,4}|timekeeping\.(?:self|approve|manage))$/.test(permission)),
    ).toBe(true);
  });

  test("references only permissions that exist in the catalog", () => {
    const knownPermissions = new Set<string>([...LMS_PERMISSION_CATALOG, ...LMS_CROSS_MODULE_ROUTE_PERMISSIONS]);

    Object.values(LMS_ROUTE_PERMISSIONS).forEach((permission) => {
      expect(knownPermissions.has(permission)).toBe(true);
    });
  });
});
