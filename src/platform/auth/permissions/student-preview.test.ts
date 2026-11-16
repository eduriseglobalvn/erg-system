import { describe, expect, it } from "vitest";

import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import { routeAcceptedPermissions, routePermissionForPath } from "./route-permission-matrix";
import { isStaffPreviewEligible, isStudentPreviewSession, projectVerifiedWorkspaces } from "./workspace-capability-projection";

const teacher = { portals: ["lms"], workspaces: ["TEACHER"] as const };

describe("student preview", () => {
  it("needs a staff workspace AND the preview permission", () => {
    expect(isStaffPreviewEligible({ workspaces: ["TEACHER"], permissions: ["elearning.student.preview"] })).toBe(true);
    expect(isStaffPreviewEligible({ workspaces: ["ADMIN"], permissions: ["elearning.student.preview"] })).toBe(true);
    expect(isStaffPreviewEligible({ workspaces: ["TEACHER"], permissions: ["lms.class.read"] })).toBe(false);
    expect(isStaffPreviewEligible({ workspaces: ["STUDENT"], permissions: ["elearning.student.preview"] })).toBe(false);
    expect(isStaffPreviewEligible({ workspaces: ["TEACHER"], permissions: ["elearning.student.preview"], deniedPermissions: ["elearning.student.preview"] })).toBe(false);
  });

  it("does not invent STUDENT: the workspaces claim is authoritative", () => {
    expect(projectVerifiedWorkspaces({ ...teacher, permissions: ["elearning.student.preview"] })).toEqual(["TEACHER"]);
  });

  it("flags preview only without a real student identity", () => {
    const workspaces = ["TEACHER", "STUDENT"] as const;
    expect(isStudentPreviewSession({ workspaces, permissions: ["elearning.student.preview"] })).toBe(true);
    expect(isStudentPreviewSession({ workspaces, permissions: ["elearning.student.preview", "elearning.student"] })).toBe(false);
  });

  it("/student accepts read_self or preview", () => {
    const entry = routePermissionForPath("/student", "STUDENT");
    expect(entry && routeAcceptedPermissions(entry)).toEqual(["elearning.assignment.read_self", "elearning.student.preview"]);
    const state = createAuthRouteState({
      account: { email: "t@erg.edu.vn" } as never,
      session: { ...teacher, workspaces: ["TEACHER", "STUDENT"], permissions: ["elearning.student.preview"] } as never,
      apiBacked: true,
    });
    expect(state.hasWorkspace("STUDENT")).toBe(true);
    expect(routeAcceptedPermissions(entry!).some((p) => state.hasPermission(p))).toBe(true);
  });
});
