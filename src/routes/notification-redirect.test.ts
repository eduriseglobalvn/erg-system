import { describe, expect, it } from "vitest";

import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { notificationRedirectHref } from "@/routes/notification-redirect";

const account = { id: "u1", email: "u1@erg.edu.vn", lifecycle: { status: "ACTIVE", nextSteps: [] } } as never;
const session = (workspaces: Workspace[]) =>
  createAuthRouteState({ account, session: { permissions: ["*"], portals: ["lms"], workspaces }, apiBacked: true });
const anon = createAuthRouteState({ account: null, session: null, apiBacked: true });

describe("/notifications/$id push deep link", () => {
  it("sends a teacher to the teacher detail page", () => {
    expect(notificationRedirectHref("abc", session(["TEACHER"]))).toBe("/teacher/notifications/abc");
  });

  it("sends an admin (also when they teach) to the admin detail page", () => {
    expect(notificationRedirectHref("abc", session(["ADMIN"]))).toBe("/admin/notifications/abc");
    expect(notificationRedirectHref("abc", session(["TEACHER", "ADMIN"]))).toBe("/admin/notifications/abc");
  });

  it("sends a student to the Hộp thư tab of the student page (no detail route there)", () => {
    expect(notificationRedirectHref("abc", session(["STUDENT"]))).toBe("/student?tab=announcements");
  });

  it("falls back to the workspace home for CRM-only or workspace-less sessions", () => {
    expect(notificationRedirectHref("abc", session(["CRM"]))).toBe("/");
  });

  it("asks an anonymous visitor to log in and come back to the same link", () => {
    expect(notificationRedirectHref("abc", anon)).toBe("/login?redirect=%2Fnotifications%2Fabc");
  });

  it.each(["../x", "..", "//evil", "%2F%2Fevil", "%2e%2e", "a\\b", "abé", "x".repeat(129), "a b", "abc?x=1", "https:evil", ""])(
    "treats %j as no id: lands on the inbox, never on another path",
    (id) => {
      expect(notificationRedirectHref(id, session(["TEACHER"]))).toBe("/teacher/notifications");
      expect(notificationRedirectHref(id, anon)).toBe("/login?redirect=%2Fnotifications");
    },
  );

  it("accepts an id at the 128-character limit", () => {
    const id = "x".repeat(128);
    expect(notificationRedirectHref(id, session(["TEACHER"]))).toBe(`/teacher/notifications/${id}`);
  });

  it("keeps UUID ids as one path segment", () => {
    const id = "3f2d7cb4-9467-7e4c-9b1d-2a0f00e1a1b2";
    expect(notificationRedirectHref(id, session(["TEACHER"]))).toBe(`/teacher/notifications/${id}`);
  });
});
