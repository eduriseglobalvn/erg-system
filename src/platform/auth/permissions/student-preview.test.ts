import { describe, expect, it } from "vitest";

import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import { routeAcceptedPermissions, routePermissionForPath } from "./route-permission-matrix";
import { isStaffPreviewEligible, isStudentPreviewSession, projectVerifiedWorkspaces } from "./workspace-capability-projection";

const teacher = { roles: ["lms_subject_teacher", "teacher"], portals: ["lms"], workspaces: ["TEACHER"] as const };

describe("student preview", () => {
  it("needs staff role AND the preview permission", () => {
    expect(isStaffPreviewEligible({ roles: ["teacher"], permissions: ["elearning.student.preview"] })).toBe(true);
    expect(isStaffPreviewEligible({ roles: ["lms_admin"], permissions: ["elearning.student.preview"] })).toBe(true);
    expect(isStaffPreviewEligible({ roles: ["teacher"], permissions: ["lms.teacher"] })).toBe(false);
    expect(isStaffPreviewEligible({ roles: ["student"], permissions: ["elearning.student.preview"] })).toBe(false);
    expect(isStaffPreviewEligible({ roles: ["teacher"], permissions: ["elearning.student.preview"], deniedPermissions: ["elearning.student.preview"] })).toBe(false);
  });

  it("projects STUDENT for eligible staff even when the session lists only TEACHER", () => {
    expect(projectVerifiedWorkspaces({ ...teacher, permissions: ["elearning.student.preview"] })).toEqual(["TEACHER", "STUDENT"]);
    expect(projectVerifiedWorkspaces({ ...teacher, permissions: [] })).toEqual(["TEACHER"]);
  });

  it("flags preview only without a real student identity", () => {
    expect(isStudentPreviewSession({ ...teacher, permissions: ["elearning.student.preview"] })).toBe(true);
    expect(isStudentPreviewSession({ roles: ["teacher", "student"], permissions: ["elearning.student.preview"] })).toBe(false);
  });

  it("/student accepts read_self or preview", () => {
    const entry = routePermissionForPath("/student", "STUDENT");
    expect(entry && routeAcceptedPermissions(entry)).toEqual(["elearning.assignment.read_self", "elearning.student.preview"]);
    const state = createAuthRouteState({
      account: { email: "t@erg.edu.vn" } as never,
      session: { ...teacher, permissions: ["elearning.student.preview"] } as never,
      apiBacked: true,
    });
    expect(state.hasWorkspace("STUDENT")).toBe(true);
    expect(routeAcceptedPermissions(entry!).some((p) => state.hasPermission(p))).toBe(true);
  });
});
