import { expect, test } from "vitest";

test("guards permission role and employee routes before loading the Admin shell", async () => {
  const source = await import("@/routes/portals/admin-routes.tsx?raw").then((module) => module.default as string);
  // Every Admin page hangs off the `_authed` layout, whose single guard runs the matrix check before the shell loads.
  expect(source).toContain("getParentRoute: () => authedRoute");
  const guards = await import("@/app/router/route-guards?raw").then((module) => module.default as string);
  expect(guards).toContain("enforceWorkspaceRoute(context.auth, location, workspace)");
  // The legacy /integration/* aliases keep an explicit ADMIN workspace guard before redirecting.
  expect(source).toContain('enforceWorkspaceRoute(context.auth, location, "ADMIN")');
  const matrix = await import("@/platform/auth/permissions/route-permission-matrix");
  expect(matrix.ROUTE_PERMISSION_MATRIX).toEqual(expect.arrayContaining([
    expect.objectContaining({ path: "/admin/settings/permissions", permission: "rbac.permission.read" }),
    expect.objectContaining({ path: "/admin/employees", permission: "users.manage" }),
    expect.objectContaining({ path: "/admin/employees/access-logs", permission: "users.manage" }),
  ]));
});
