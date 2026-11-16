import { describe, expect, it } from "vitest";

import { projectVerifiedWorkspaces } from "./workspace-capability-projection";

describe("projectVerifiedWorkspaces", () => {
  it("projects workspaces from claim only", () => {
    expect(projectVerifiedWorkspaces({ workspaces: ["ADMIN", "CRM"] })).toEqual(["ADMIN", "CRM"]);
    expect(projectVerifiedWorkspaces({ workspaces: ["TEACHER", "TEACHER", "STUDENT"] })).toEqual(["TEACHER", "STUDENT"]);
  });

  it("ignores role names, root-admin email, wildcard permission and portals", () => {
    expect(
      projectVerifiedWorkspaces({
        roles: ["system.super_admin", "teacher", "student", "sale"],
        permissions: ["*", "lms.admin", "crm.*"],
        portals: ["*", "lcms", "lms", "crm"],
      }),
    ).toEqual([]);
    expect(projectVerifiedWorkspaces({ roles: ["admin"], portals: ["lcms"], workspaces: ["TEACHER"] })).toEqual(["TEACHER"]);
  });

  it("drops unknown workspace values", () => {
    expect(projectVerifiedWorkspaces({ workspaces: ["ADMIN", "NOPE" as never] })).toEqual(["ADMIN"]);
  });

  it("projects nothing when everything is denied", () => {
    expect(projectVerifiedWorkspaces({ workspaces: ["ADMIN"], deniedPermissions: ["*"] })).toEqual([]);
  });
});
