import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import { routeTree } from "@/routes/app-routes";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";
import { authedWorkspaceForPath } from "@/app/router/route-guards";

type AnyRoute = {
  fullPath: string;
  children?: AnyRoute[];
  options: { path?: string; staticData?: { permission?: string } };
};

// Creating a router resolves fullPath on every route.
createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }), context: { auth: createAuthRouteState({ account: null, session: null, apiBacked: true }) } });
const collect = (route: AnyRoute): AnyRoute[] => (route.children ?? []).flatMap((child) => [child, ...collect(child)]);
const authedRoute = (routeTree as unknown as AnyRoute).children?.find((route) => route.options.path === undefined && route.children?.length);
const convertedLeaves = collect(authedRoute as AnyRoute).filter((route) => route.options.path !== undefined);

describe("converted workspace routes declare their permission", () => {
  it("has converted routes under _authed", () => {
    expect(convertedLeaves.length).toBeGreaterThan(20);
  });

  it.each(convertedLeaves.map((route) => [route.fullPath, route] as const))("%s: staticData.permission equals the matrix row", (fullPath, route) => {
    const workspace = authedWorkspaceForPath(fullPath);
    expect(workspace).toBeDefined();
    const concrete = fullPath.replace(/\$\w*/g, "some-id");
    const entry = routePermissionForPath(concrete, workspace!);
    expect(entry, `${fullPath} needs a ROUTE_PERMISSION_MATRIX row`).toBeDefined();
    // /profile reuses the account.self.read guard and has no matrix permission of its own to declare.
    if (!fullPath.endsWith("/profile")) expect(route.options.staticData?.permission).toBe(entry!.permission);
  });
});
