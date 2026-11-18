import { describe, expect, it } from "vitest";

import {
  accessDeniedWorkspaceLabel,
  resolveAccessDeniedTargets,
  resolveWorkspaceLandingTarget,
  sanitizeAccessDeniedRedirect,
  workspaceFromAccessDeniedPortal,
} from "./access-denied";

describe("access-denied workspace recovery", () => {
  it("normalizes legacy portal aliases to canonical workspaces", () => {
    expect(workspaceFromAccessDeniedPortal("lms")).toBe("TEACHER");
    expect(workspaceFromAccessDeniedPortal("lcms")).toBe("ADMIN");
    expect(workspaceFromAccessDeniedPortal("STUDENT")).toBe("STUDENT");
    expect(accessDeniedWorkspaceLabel("lms")).toBe("Cổng giáo viên");
  });

  it("offers Admin only when the session has both the workspace and permission", () => {
    expect(
      resolveAccessDeniedTargets({
        requestedPortal: "lms",
        workspaces: ["ADMIN"],
        permissions: ["lms.admin"],
      }),
    ).toEqual([
      expect.objectContaining({ workspace: "ADMIN", path: "/admin", permission: "lms.admin" }),
    ]);

    expect(
      resolveAccessDeniedTargets({
        requestedPortal: "lms",
        workspaces: ["ADMIN"],
        permissions: ["lms.admin"],
        deniedPermissions: ["lms.admin"],
      }),
    ).toEqual([]);
  });

  it("uses the workspaces claim and still requires the Admin permission", () => {
    expect(
      resolveAccessDeniedTargets({
        requestedPortal: "lms",
        workspaces: ["ADMIN", "TEACHER"],
        permissions: ["lms.admin"],
      }),
    ).toEqual([
      expect.objectContaining({ workspace: "ADMIN", path: "/admin" }),
    ]);
    expect(
      resolveWorkspaceLandingTarget({
        preferredWorkspace: "TEACHER",
        workspaces: ["ADMIN", "TEACHER"],
        permissions: ["lms.admin"],
      }),
    ).toMatchObject({ workspace: "ADMIN", path: "/admin" });
  });

  it("prefers the requested canonical landing workspace when it is allowed", () => {
    expect(
      resolveWorkspaceLandingTarget({
        preferredWorkspace: "TEACHER",
        workspaces: ["ADMIN", "TEACHER"],
        permissions: ["lms.admin", "lms.dashboard.read"],
      }),
    ).toMatchObject({ workspace: "TEACHER", path: "/teacher" });
  });

  it("keeps redirect targets local and removes sensitive query values", () => {
    expect(sanitizeAccessDeniedRedirect("/home?tab=overview&access_token=secret")).toBe("/home?tab=overview");
    expect(sanitizeAccessDeniedRedirect("https://evil.example/phish")).toBe("/");
    expect(sanitizeAccessDeniedRedirect("//evil.example/phish")).toBe("/");
  });
});
