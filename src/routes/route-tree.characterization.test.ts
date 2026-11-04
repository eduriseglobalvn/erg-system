import { createMemoryHistory, createRouter, isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routes/app-routes";
import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";

type Guard = (ctx: unknown) => unknown;
type AnyRoute = {
  id: string;
  fullPath: string;
  options: { path?: string; beforeLoad?: Guard; component?: unknown; validateSearch?: unknown };
};

const routes = (routeTree as unknown as { children: AnyRoute[] }).children;
const concretePath = (path: string) => path.replace(/\$$/, "unknown-segment");

const anon = createAuthRouteState({ account: null, session: null, apiBacked: true });
const account = { id: "u1", email: "u1@erg.edu.vn", lifecycle: { status: "ACTIVE", nextSteps: [] } } as never;
const superUser = createAuthRouteState({
  account,
  session: { permissions: ["*"], portals: ["lms", "lcms", "crm", "elearning"], workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"] },
  apiBacked: true,
});
const noPerms = createAuthRouteState({
  account,
  session: { permissions: [], portals: ["lms"], workspaces: ["TEACHER"] },
  apiBacked: true,
});

function runGuard(route: AnyRoute, auth: unknown) {
  const guard = route.options.beforeLoad;
  if (!guard) return "no-guard";
  const pathname = concretePath(route.fullPath);
  try {
    guard({
      context: { auth },
      location: { href: pathname, pathname, searchStr: "", hash: "" },
      search: { redirect: "/teacher/home" },
    });
    return "allow";
  } catch (error) {
    if (!isRedirect(error)) return `throw:${String(error)}`;
    const opts = (error as { options?: { to?: string; href?: string; search?: unknown } }).options ?? {};
    return `redirect:${JSON.stringify({ to: opts.to, href: opts.href, search: opts.search })}`;
  }
}

describe("route tree characterization (must not change during refactors)", () => {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }), context: { auth: anon } });
  const extra = ["/", "/admin/unknown", "/teacher/unknown/deep", "/student/anything", "/nope/nothing", "/profile", "/classes"];
  const probes = [...new Set([...routes.map((r) => concretePath(r.fullPath)), ...extra])].sort();

  it("registers the same set of routes", () => {
    const rows = routes
      .map((r) => `${r.fullPath} | guard=${Boolean(r.options.beforeLoad)} | component=${Boolean(r.options.component)} | validate=${Boolean(r.options.validateSearch)}`)
      .sort();
    expect(rows).toMatchSnapshot();
  });

  it("resolves every probe path to the same route", () => {
    const rows = probes.map((p) => {
      const matches = router.matchRoutes(p, {});
      return `${p} -> ${matches.at(-1)?.routeId}`;
    });
    expect(rows).toMatchSnapshot();
  });

  it("applies the same guard decision per route for anonymous, super and no-permission users", () => {
    const rows = routes
      .map((r) => `${r.fullPath} | anon=${runGuard(r, anon)} | super=${runGuard(r, superUser)} | none=${runGuard(r, noPerms)}`)
      .sort();
    expect(rows).toMatchSnapshot();
  });

  it("keeps a matrix row for every guarded workspace path", () => {
    const rows = routes
      .filter((r) => r.options.beforeLoad)
      .flatMap((r) => (["ADMIN", "TEACHER", "STUDENT", "CRM"] as const).map((w) => {
        const entry = routePermissionForPath(concretePath(r.fullPath), w);
        return `${r.fullPath} ${w} -> ${entry ? entry.permission : "none"}`;
      }))
      .sort();
    expect(rows).toMatchSnapshot();
  });
});
