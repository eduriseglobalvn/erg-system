import { describe, expect, it } from "vitest";
import {
  ERG_WORKSPACE_DOMAINS,
  getWorkspaceDomainConfig,
  resolveWorkspaceLocation,
  workspaceUrl,
} from "@/platform/workspaces/workspace-domain";

describe("workspace-domain", () => {
  it("maps canonical LMS paths to workspaces", () => {
    expect(resolveWorkspaceLocation({ hostname: "lms.erg.edu.vn", pathname: "/admin" })).toMatchObject({
      kind: "workspace",
      workspace: "ADMIN",
    });
    expect(resolveWorkspaceLocation({ hostname: "lms.erg.edu.vn", pathname: "/teacher/classes" })).toMatchObject({
      kind: "workspace",
      workspace: "TEACHER",
    });
    expect(resolveWorkspaceLocation({ hostname: "lms.erg.edu.vn", pathname: "/student" })).toMatchObject({
      kind: "workspace",
      workspace: "STUDENT",
    });
  });

  it("recognizes auth, CRM, and public entry domains", () => {
    expect(resolveWorkspaceLocation({ hostname: ERG_WORKSPACE_DOMAINS.auth, pathname: "/login" })).toEqual({
      kind: "auth",
    });
    expect(resolveWorkspaceLocation({ hostname: ERG_WORKSPACE_DOMAINS.crm, pathname: "/" })).toEqual({
      kind: "workspace",
      workspace: "CRM",
    });
    expect(resolveWorkspaceLocation({ hostname: ERG_WORKSPACE_DOMAINS.public, pathname: "/" })).toEqual({
      kind: "public",
    });
  });

  it("supports local development ports without treating the port as identity", () => {
    expect(resolveWorkspaceLocation({ hostname: "localhost", port: "5173", pathname: "/admin" })).toMatchObject({
      kind: "workspace",
      workspace: "ADMIN",
    });
  });

  it("does not authorize unknown hosts or paths", () => {
    expect(resolveWorkspaceLocation({ hostname: "evil.example", pathname: "/admin" })).toEqual({ kind: "unknown" });
    expect(resolveWorkspaceLocation({ hostname: "lms.erg.edu.vn", pathname: "/unknown" })).toEqual({ kind: "unknown" });
  });

  it("builds canonical workspace URLs", () => {
    expect(workspaceUrl("ADMIN", "/users")).toBe("https://lms.erg.edu.vn/admin/users");
    expect(workspaceUrl("STUDENT")).toBe("https://lms.erg.edu.vn/student");
  });

  it("resolves deterministic local and production environment configs", () => {
    expect(getWorkspaceDomainConfig("local").lms).toBe("lms.erg.edu.local");
    expect(getWorkspaceDomainConfig("production").lms).toBe("lms.erg.edu.vn");
    expect(getWorkspaceDomainConfig("staging").api).toBe("api.erg.edu.vn");
  });
});
