import { describe, expect, test } from "vitest";

import {
  createAuthRouteState,
  resolveAuthRouteAccess,
} from "@/platform/auth/router/auth-route-context";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

function account(status: "ACTIVE" | "FIRST_LOGIN_RESTRICTED" = "ACTIVE") {
  return {
    id: "teacher-1",
    email: "teacher@erg.edu.vn",
    fullName: "Teacher One",
    lifecycle: {
      status,
      isProfileCompleted: status === "ACTIVE",
      recoveryEmailMasked: null,
      recoveryEmailVerified: status === "ACTIVE",
      mustChangePassword: status !== "ACTIVE",
      nextSteps: status === "ACTIVE" ? [] : ["CHANGE_PASSWORD"],
    },
  } as TeacherAccount;
}

describe("auth route context", () => {
  test("evaluates grants with deny-wins semantics", () => {
    const state = createAuthRouteState({
      account: account(),
      session: {
        permissions: ["lms.grade.*"],
        deniedPermissions: ["lms.grade.finalize"],
        portals: ["lms"],
      },
      apiBacked: true,
    });

    expect(state.hasPermission("lms.grade.read")).toBe(true);
    expect(state.hasPermission("lms.grade.finalize")).toBe(false);
  });

  test("redirects in login, account status, portal, then permission order", () => {
    const anonymous = createAuthRouteState({ account: null, session: null, apiBacked: true });
    expect(resolveAuthRouteAccess(anonymous, { portal: "lms", permission: "lms.dashboard.read" })).toBe("login");

    const restricted = createAuthRouteState({
      account: account("FIRST_LOGIN_RESTRICTED"),
      session: { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(restricted, { portal: "lms", permission: "lms.dashboard.read" })).toBe("allow");

    const wrongPortal = createAuthRouteState({
      account: account(),
      session: { permissions: ["lms.dashboard.read"], portals: ["lcms"], workspaces: ["ADMIN"] },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(wrongPortal, { portal: "lms", permission: "lms.dashboard.read" })).toBe("access-denied");

    const denied = createAuthRouteState({ account: account(), session: { permissions: [], portals: ["lms"], workspaces: ["TEACHER"] }, apiBacked: true });
    expect(resolveAuthRouteAccess(denied, { portal: "lms", permission: "lms.dashboard.read" })).toBe("access-denied");

    const granted = createAuthRouteState({
      account: account(),
      session: { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(granted, { portal: "lms", permission: "lms.dashboard.read" })).toBe("allow");
  });

  test("does not block an entitled account when a legacy backend response has no lifecycle", () => {
    const state = createAuthRouteState({
      account: { ...account(), lifecycle: undefined },
      session: { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] },
      apiBacked: true,
    });

    expect(resolveAuthRouteAccess(state, { portal: "lms", permission: "lms.dashboard.read" })).toBe("allow");
  });

  test("keeps blocked accounts out even when their portal permission remains cached", () => {
    const baseAccount = account();
    const state = createAuthRouteState({
      account: { ...baseAccount, lifecycle: { ...baseAccount.lifecycle!, status: "BLOCKED" } },
      session: { permissions: ["lms.dashboard.read"], portals: ["lms"] },
      apiBacked: true,
    });

    expect(resolveAuthRouteAccess(state, { portal: "lms", permission: "lms.dashboard.read" })).toBe("access-denied");
  });

  test("allows a platform-wide permission to cross portal boundaries", () => {
    const state = createAuthRouteState({
      account: account(),
      session: { permissions: ["lms.dashboard.read"], portals: ["admin"], workspaces: ["ADMIN", "TEACHER"] },
      apiBacked: true,
    });

    expect(resolveAuthRouteAccess(state, { portal: "lms", permission: "lms.dashboard.read" })).toBe("allow");
  });

  test("takes workspaces from the claim only, never from role names, portals or the account email", () => {
    const state = createAuthRouteState({
      account: { ...account(), email: "admin@erg.edu.vn", role: "admin" },
      session: {
        roles: ["system.super_admin"],
        permissions: ["*"],
        portals: ["*"],
        workspaces: ["TEACHER"],
      },
      apiBacked: true,
    });

    expect(state.workspaces).toEqual(["TEACHER"]);
    expect(resolveAuthRouteAccess(state, { workspace: "ADMIN", permission: "lms.admin" })).toBe("access-denied");
    expect(resolveAuthRouteAccess(state, { workspace: "TEACHER", permission: "lms.dashboard.read" })).toBe("allow");
  });

  test("a session without a workspaces claim reaches no workspace", () => {
    const state = createAuthRouteState({
      account: account(),
      session: { roles: ["system.super_admin"], permissions: ["*"], portals: ["lms"] },
      apiBacked: true,
    });

    expect(state.workspaces).toEqual([]);
    expect(resolveAuthRouteAccess(state, { workspace: "STUDENT", permission: "elearning.assignment.read_self" })).toBe("access-denied");
  });
});
