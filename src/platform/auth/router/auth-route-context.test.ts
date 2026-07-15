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

  test("redirects in login, onboarding, portal, then permission order", () => {
    const anonymous = createAuthRouteState({ account: null, session: null, apiBacked: true });
    expect(resolveAuthRouteAccess(anonymous, { portal: "lms", permission: "lms.dashboard.read" })).toBe("login");

    const restricted = createAuthRouteState({ account: account("FIRST_LOGIN_RESTRICTED"), session: { portals: ["lms"] }, apiBacked: true });
    expect(resolveAuthRouteAccess(restricted, { portal: "lms", permission: "lms.dashboard.read" })).toBe("onboarding");

    const wrongPortal = createAuthRouteState({
      account: account(),
      session: { permissions: ["lms.dashboard.read"], portals: ["lcms"] },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(wrongPortal, { portal: "lms", permission: "lms.dashboard.read" })).toBe("access-denied");

    const denied = createAuthRouteState({ account: account(), session: { permissions: [], portals: ["lms"] }, apiBacked: true });
    expect(resolveAuthRouteAccess(denied, { portal: "lms", permission: "lms.dashboard.read" })).toBe("access-denied");

    const granted = createAuthRouteState({
      account: account(),
      session: { permissions: ["lms.dashboard.read"], portals: ["lms"] },
      apiBacked: true,
    });
    expect(resolveAuthRouteAccess(granted, { portal: "lms", permission: "lms.dashboard.read" })).toBe("allow");
  });

  test("fails closed when an API-backed authenticated account has no lifecycle", () => {
    const state = createAuthRouteState({ account: { ...account(), lifecycle: undefined }, session: { portals: ["lms"] }, apiBacked: true });

    expect(resolveAuthRouteAccess(state, { portal: "lms", permission: "lms.dashboard.read" })).toBe("onboarding");
  });

  test("allows a platform-wide permission to cross portal boundaries", () => {
    const state = createAuthRouteState({
      account: account(),
      session: { permissions: ["*"], portals: ["admin"] },
      apiBacked: true,
    });

    expect(resolveAuthRouteAccess(state, { portal: "lms", permission: "lms.dashboard.read" })).toBe("allow");
  });
});
