import { describe, expect, it } from "vitest";

import { crmPaths, lcmsWorkspacePaths, lmsPaths } from "@/app/portal-route-registry";
import { ADMIN_CONTENT_ROUTE_PATHS } from "@/app/portal-route-registry";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { createAuthRouteState, resolveAuthRouteAccess } from "@/platform/auth/router/auth-route-context";
import {
  ROUTE_PERMISSION_MATRIX,
  isProtectedWorkspacePath,
  matrixCompletenessGaps,
  routePermissionForPath,
} from "./route-permission-matrix";

describe("route/resource/action permission matrix", () => {
  it("covers every protected route array and canonical workspace entry", () => {
    expect(matrixCompletenessGaps()).toEqual([]);
    expect(ROUTE_PERMISSION_MATRIX.every((entry) => entry.path.startsWith("/") && entry.resource && entry.action && entry.permission)).toBe(true);
  });

  it.each([
    ["/admin/settings/permissions", "ADMIN", "rbac.permission.read"],
    ["/admin/question-types", "ADMIN", "lms.quiz.read"],
    ["/admin/content/quiz-editor", "ADMIN", "lms.quiz.create"],
    ["/admin/schools/classes", "ADMIN", "lms.school.read"],
    ["/teacher", "TEACHER", "lms.dashboard.read"],
    ["/teacher/downloads/desktop", "TEACHER", "lms.dashboard.read"],
    ["/teacher/homework/assign", "TEACHER", "lms.assignment.create"],
    ["/seo/pnl", "CRM", "crm.analytics.read"],
    ["/student", "STUDENT", "elearning.assignment.read_self"],
    ["/student/exams/portable", "STUDENT", "elearning.assignment.read_self"],
    ["/student/downloads/desktop", "STUDENT", "elearning.assignment.read_self"],
  ] as const)("maps %s to %s permission %s", (path, workspace, permission) => {
    expect(routePermissionForPath(path, workspace)).toMatchObject({ permission });
  });

  it("fails closed for an unknown protected route instead of inventing a permission", () => {
    expect(isProtectedWorkspacePath("/admin/unknown-sensitive-area")).toBe(true);
    expect(routePermissionForPath("/admin/unknown-sensitive-area", "ADMIN")).toBeUndefined();
  });

  it("denies an admin route to a teacher-only capability and allows a multi-role account", () => {
    const teacher = createAuthRouteState({
      account: { id: "teacher", email: "teacher@erg.edu.vn" } as never,
      session: { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] },
      apiBacked: true,
    });
    const multiRole = createAuthRouteState({
      account: { id: "multi", email: "multi@erg.edu.vn" } as never,
      session: { permissions: ["lms.dashboard.read", "lms.admin"], portals: ["lms", "lcms"], workspaces: ["TEACHER", "ADMIN"] },
      apiBacked: true,
    });

    expect(resolveAuthRouteAccess(teacher, { workspace: "ADMIN", permission: "lms.admin" })).toBe("access-denied");
    expect(resolveAuthRouteAccess(multiRole, { workspace: "ADMIN", permission: "lms.admin" })).toBe("allow");
  });

  it.each([
    ["admin", ["ADMIN"], ["lms.admin"], "ADMIN", "lms.admin", "allow"],
    ["coordinator", ["TEACHER"], ["lms.scope.read"], "ADMIN", "lms.admin", "access-denied"],
    ["teacher", ["TEACHER"], ["lms.dashboard.read"], "TEACHER", "lms.dashboard.read", "allow"],
    ["student", ["STUDENT"], ["elearning.assignment.read_self"], "STUDENT", "elearning.assignment.read_self", "allow"],
  ] as const)("evaluates %s workspace capability without hostname hints", (role, workspaces, permissions, requiredWorkspace, requiredPermission, expected) => {
    const auth = createAuthRouteState({
      account: { id: role, email: `${role}@erg.edu.vn` } as never,
      session: { permissions: [...permissions], portals: [], workspaces: [...workspaces] },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(auth, { workspace: requiredWorkspace, permission: requiredPermission })).toBe(expected);
  });

  it("keeps an explicit deny stronger than a grant", () => {
    const auth = createAuthRouteState({
      account: { id: "admin", email: "admin@erg.edu.vn" } as never,
      session: {
        permissions: ["lms.admin", "lms.*"],
        deniedPermissions: ["lms.admin"],
        portals: ["lcms"],
        workspaces: ["ADMIN"],
      },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(auth, { workspace: "ADMIN", permission: "lms.admin" })).toBe("access-denied");
  });

  it("keeps the expected source route sets represented", () => {
    for (const path of lcmsWorkspacePaths.map((value) => canonicalAdminRoutePath(`/${value}`))) {
      expect(ROUTE_PERMISSION_MATRIX.some((entry) => entry.path === path)).toBe(true);
    }
    for (const path of lmsPaths.map((value) => teacherPath(`/${value}`))) {
      expect(ROUTE_PERMISSION_MATRIX.some((entry) => entry.path === path)).toBe(true);
    }
    for (const path of crmPaths.map((value) => `/${value}`)) {
      expect(ROUTE_PERMISSION_MATRIX.some((entry) => entry.path === path)).toBe(true);
    }
    for (const path of ADMIN_CONTENT_ROUTE_PATHS) {
      expect(ROUTE_PERMISSION_MATRIX.some((entry) => entry.path === path)).toBe(true);
    }
  });
});

function canonicalAdminRoutePath(pathname: string) {
  const normalized = `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  const contentSegment = ["resources", "questions", "quiz-bank", "quiz-editor"].find((segment) => normalized === `/${segment}` || normalized.startsWith(`/${segment}/`));
  if (contentSegment) return `/admin/content/${contentSegment}${normalized.slice(contentSegment.length + 1)}`;
  return normalized === "/admin" || normalized.startsWith("/admin/") ? normalized : `/admin${normalized}`;
}
