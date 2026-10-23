import { expect, test } from "vitest";

test("guards permission role and employee routes before loading the LCMS shell", async () => {
  const source = await import("@/routes/app-routes.tsx?raw").then((module) => module.default as string);
  expect(source).toContain('enforceWorkspaceRoute(context.auth, location, "ADMIN")');
  const matrix = await import("@/platform/auth/permissions/route-permission-matrix");
  expect(matrix.ROUTE_PERMISSION_MATRIX).toEqual(expect.arrayContaining([
    expect.objectContaining({ path: "/admin/settings/permissions", permission: "rbac.permission.read" }),
    expect.objectContaining({ path: "/admin/employees", permission: "users.manage" }),
    expect.objectContaining({ path: "/admin/employees/access-logs", permission: "users.manage" }),
  ]));
});
