import { describe, expect, it } from "vitest";

import { projectVerifiedWorkspaces } from "./workspace-capability-projection";

describe("projectVerifiedWorkspaces", () => {
  it("projects the legacy super-admin login response into every workspace", () => {
    expect(
      projectVerifiedWorkspaces({
        roles: ["system.super_admin"],
        permissions: ["*"],
        portals: ["*"],
      }),
    ).toEqual(["ADMIN", "TEACHER", "STUDENT", "CRM"]);
  });

  it("accepts the canonical super_admin role alias", () => {
    expect(
      projectVerifiedWorkspaces({
        roles: ["super_admin"],
        permissions: ["*"],
      }),
    ).toEqual(["ADMIN", "TEACHER", "STUDENT", "CRM"]);
  });

  it("projects the configured root admin into every workspace even when legacy login only returns admin", () => {
    expect(
      projectVerifiedWorkspaces({
        accountEmail: "admin@erg.edu.vn",
        roles: ["admin"],
        portals: ["lcms"],
        workspaces: ["ADMIN"],
      }),
    ).toEqual(["ADMIN", "TEACHER", "STUDENT", "CRM"]);
  });

  it("projects admin role and lms portal strictly into admin and teacher workspaces without student", () => {
    expect(
      projectVerifiedWorkspaces({
        roles: ["admin"],
        portals: ["lms"],
      }),
    ).toEqual(["ADMIN", "TEACHER"]);
  });

  it("projects workspace strictly by role matching", () => {
    expect(projectVerifiedWorkspaces({ roles: ["admin"] })).toEqual(["ADMIN"]);
    expect(projectVerifiedWorkspaces({ roles: ["teacher"] })).toEqual(["TEACHER"]);
    expect(projectVerifiedWorkspaces({ roles: ["student"] })).toEqual(["STUDENT"]);
    expect(projectVerifiedWorkspaces({ roles: ["sale"] })).toEqual(["CRM"]);
    expect(projectVerifiedWorkspaces({ roles: ["crm"] })).toEqual(["CRM"]);
    expect(projectVerifiedWorkspaces({ roles: ["teacher", "student"] })).toEqual(["TEACHER", "STUDENT"]);
  });

  it("prunes cached workspaces when role does not permit", () => {
    expect(
      projectVerifiedWorkspaces({
        workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
        roles: ["student"],
      }),
    ).toEqual(["STUDENT"]);

    expect(
      projectVerifiedWorkspaces({
        workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
        roles: ["teacher"],
      }),
    ).toEqual(["TEACHER"]);
  });

  it("does not let a wildcard or legacy portal alone create workspace access", () => {
    expect(projectVerifiedWorkspaces({ permissions: ["*"], portals: ["*"] })).toEqual([]);
    expect(projectVerifiedWorkspaces({ portals: ["*"] })).toEqual([]);
  });

  it("keeps an explicit backend workspace projection authoritative", () => {
    expect(
      projectVerifiedWorkspaces({
        workspaces: ["ADMIN"],
        roles: ["system.super_admin"],
        permissions: ["*"],
        portals: ["*"],
      }),
    ).toEqual(["ADMIN"]);
  });

  it("does not project a wildcard when the verified system grant is denied", () => {
    expect(
      projectVerifiedWorkspaces({
        roles: ["system.super_admin"],
        permissions: ["*"],
        deniedPermissions: ["*"],
        portals: ["*"],
      }),
    ).toEqual([]);
  });
});
