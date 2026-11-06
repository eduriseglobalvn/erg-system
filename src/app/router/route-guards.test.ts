import { afterEach, describe, expect, it, vi } from "vitest";
import { isRedirect } from "@tanstack/react-router";

import { authedBeforeLoad, enforceWorkspaceRoute } from "./route-guards";
import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";

describe("workspace route guards", () => {
  it("denies an unregistered sensitive path even for a wildcard permission", () => {
    const auth = createAuthRouteState({
      account: { id: "root", email: "root@erg.edu.vn" } as never,
      session: { permissions: ["*"], portals: ["lcms"], workspaces: ["ADMIN"] },
      apiBacked: true,
    });

    try {
      enforceWorkspaceRoute(auth, { href: "https://lms.erg.edu.vn/admin/unknown-sensitive", pathname: "/admin/unknown-sensitive" }, "ADMIN");
      throw new Error("guard did not redirect");
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      expect((error as { options?: { to?: string } }).options?.to).toBe("/access-denied");
    }
  });
});

describe("authedBeforeLoad (single guard for converted workspaces)", () => {
  const account = { id: "u1", email: "u1@erg.edu.vn", lifecycle: { status: "ACTIVE", nextSteps: [] } } as never;
  const teacher = createAuthRouteState({
    account,
    session: { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] },
    apiBacked: true,
  });
  const run = (auth: ReturnType<typeof createAuthRouteState>, pathname: string) => {
    try {
      authedBeforeLoad({ context: { auth }, location: { href: pathname, pathname } });
      return "allow";
    } catch (error) {
      if (!isRedirect(error)) throw error;
      return (error as unknown as { options: Record<string, unknown> }).options;
    }
  };

  afterEach(() => vi.unstubAllGlobals());

  it("sends a guest to login and keeps the requested path", () => {
    const guest = createAuthRouteState({ account: null, session: null, apiBacked: true });
    expect(run(guest, "/teacher/homework")).toMatchObject({ to: "/login", search: { redirect: "/teacher/homework" } });
  });

  it("denies a signed-in user without the route permission", () => {
    expect(run(teacher, "/teacher/homework/assign")).toMatchObject({ to: "/access-denied", search: { portal: "TEACHER" } });
  });

  it("allows a user holding the permission on the canonical host", () => {
    expect(run(teacher, "/teacher/home")).toBe("allow");
  });

  it("redirects other ERG hosts to the canonical LMS host (path kept)", () => {
    vi.stubGlobal("location", new URL("https://crm.erg.edu.local/teacher/home?tab=1"));
    const result = run(teacher, "/teacher/home") as { href?: string; reloadDocument?: boolean };
    expect(result.href).toBe("https://lms.erg.edu.local/teacher/home");
    expect(result.reloadDocument).toBe(true);
  });

  it("serves the student dashboard at / on the student host, other student pages go to the LMS host", () => {
    const student = createAuthRouteState({
      account,
      session: { permissions: ["elearning.assignment.read_self", "learning.outcomes.read"], portals: ["elearning"], workspaces: ["STUDENT"] },
      apiBacked: true,
    });
    vi.stubGlobal("location", new URL("https://elearning.erg.edu.local/student"));
    expect(run(student, "/student")).toMatchObject({ to: "/" });
    expect(run(student, "/student/learning-outcomes")).toMatchObject({ href: "https://lms.erg.edu.local/student/learning-outcomes" });
  });

  it("requires the CRM host for CRM paths and never redirects them", () => {
    const crm = createAuthRouteState({
      account,
      session: { permissions: ["seo.manage"], portals: ["crm"], workspaces: ["CRM"] },
      apiBacked: true,
    });
    // jsdom host (localhost) is not the CRM host.
    expect(run(crm, "/seo")).toMatchObject({ to: "/access-denied", search: { portal: "CRM" } });
    vi.stubGlobal("location", new URL("https://crm.erg.edu.local/seo"));
    expect(run(crm, "/seo")).toBe("allow");
  });

  it("fails closed on an unknown host", () => {
    vi.stubGlobal("location", new URL("https://evil.example.com/teacher/home"));
    expect(run(teacher, "/teacher/home")).toMatchObject({ to: "/access-denied" });
  });

  it("denies a path outside the workspace prefixes", () => {
    expect(run(teacher, "/somewhere")).toMatchObject({ to: "/access-denied" });
  });
});
