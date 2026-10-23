import { describe, expect, test } from "vitest";

import { lmsPaths } from "@/app/portal-route-registry";
import {
  LMS_PERMISSION_CATALOG,
  LMS_PROTECTED_ROUTES,
  LMS_ROLE_GROUP_TEMPLATES,
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
      LMS_PERMISSION_CATALOG.every((permission) => /^(lms|account)(?:\.[a-z_]+){2,4}$/.test(permission)),
    ).toBe(true);
  });

  test("references only permissions that exist in the catalog", () => {
    const knownPermissions = new Set<string>(LMS_PERMISSION_CATALOG);

    Object.values(LMS_ROUTE_PERMISSIONS).forEach((permission) => {
      expect(knownPermissions.has(permission)).toBe(true);
    });

    Object.values(LMS_ROLE_GROUP_TEMPLATES).forEach((template) => {
      template.permissions.forEach((permission) => {
        expect(knownPermissions.has(permission)).toBe(true);
      });
    });
  });

  test("defines the minimum teacher role groups", () => {
    expect(Object.keys(LMS_ROLE_GROUP_TEMPLATES).sort()).toEqual(
      [
        "lms_homeroom_teacher",
        "lms_subject_teacher",
        "lms_teacher_assistant",
        "lms_teacher_lead",
        "lms_teacher_readonly",
        "lms_teacher_standard",
      ].sort(),
    );
  });

  test("does not grant server-inactive action permissions to teacher roles", () => {
    const inactiveActions = new Set([
      "lms.exercise.assign",
      "lms.grade.write",
      "lms.grade.finalize",
      "lms.grade.export",
      "lms.attendance.write",
      "lms.attendance.export",
      "lms.class_log.write",
      "lms.report.export",
    ]);

    Object.values(LMS_ROLE_GROUP_TEMPLATES).forEach((template) => {
      template.permissions.forEach((permission) => {
        expect(inactiveActions.has(permission)).toBe(false);
      });
    });
  });
});
