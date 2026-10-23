import { describe, expect, it, vi } from "vitest";

import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import {
  redirectAfterAuth,
  resolveDefaultPostLoginRedirect,
} from "@/platform/auth/components/portal-login-controller";

const adminAccount = {
  id: "admin",
  email: "admin@erg.edu.vn",
  role: "admin",
} as never;

const teacherAccount = {
  id: "teacher",
  email: "teacher@erg.edu.vn",
  role: "teacher",
} as never;

function session(overrides: Partial<StoredAuthSession> = {}): StoredAuthSession {
  return {
    accountEmail: "teacher@erg.edu.vn",
    permissions: ["lms.dashboard.read"],
    portals: ["lms"],
    workspaces: ["TEACHER"],
    ...overrides,
  };
}

describe("post-login workspace redirect", () => {
  it("lands an Admin account in Admin when the login URL has no explicit redirect", () => {
    expect(resolveDefaultPostLoginRedirect(
      adminAccount,
      "lms",
      session({
        accountEmail: "admin@erg.edu.vn",
        permissions: ["lms.admin"],
        roles: ["admin"],
        workspaces: ["ADMIN", "TEACHER"],
      }),
    )).toBe("/admin");
  });

  it("keeps a teacher-only account in Teacher and a student-only account in Student", () => {
    expect(resolveDefaultPostLoginRedirect(teacherAccount, "lms", session())).toBe("/teacher");
    expect(resolveDefaultPostLoginRedirect(
      { id: "student", email: "student@erg.edu.vn", role: "teacher" } as never,
      "lms",
      session({
        accountEmail: "student@erg.edu.vn",
        permissions: ["elearning.assignment.read_self"],
        portals: ["elearning"],
        workspaces: ["STUDENT"],
      }),
    )).toBe("/student");
  });

  it("preserves an explicit deep link instead of replacing it with the default landing", () => {
    const navigateTo = vi.fn();
    redirectAfterAuth(
      adminAccount,
      "lms",
      "/teacher/calendar",
      navigateTo,
      {
        hasExplicitRedirect: true,
        session: session({
          accountEmail: "admin@erg.edu.vn",
          permissions: ["lms.admin", "lms.dashboard.read"],
          roles: ["admin"],
          workspaces: ["ADMIN", "TEACHER"],
        }),
      },
    );

    expect(navigateTo).toHaveBeenCalledWith("/teacher/calendar");
  });
});
