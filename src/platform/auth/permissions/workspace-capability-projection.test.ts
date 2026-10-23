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
