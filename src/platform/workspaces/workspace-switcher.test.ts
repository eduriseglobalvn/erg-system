import { describe, expect, it } from "vitest";
import { workspaceCapabilities, workspacesFromLegacyPortals } from "@/platform/workspaces/workspace-switcher";

describe("workspaceCapabilities", () => {
  it("only exposes deduplicated backend-granted workspaces", () => {
    expect(workspaceCapabilities(["ADMIN", "TEACHER", "ADMIN"], "TEACHER", "/teacher/classes")).toEqual([
      { workspace: "ADMIN", label: "Admin LMS", href: "https://lms.erg.edu.vn/admin" },
      { workspace: "TEACHER", label: "Teacher", href: "/teacher/classes" },
    ]);
  });

  it("keeps canonical capabilities authoritative over legacy portal aliases", () => {
    expect(workspacesFromLegacyPortals(["crm", "lms"], "TEACHER")).toEqual(["CRM", "TEACHER"]);
    expect(workspaceCapabilities(["ADMIN", "TEACHER"], "TEACHER", "/teacher/classes", {
      originForWorkspace: (workspace) => workspace === "ADMIN" ? "http://lms.erg.edu.local:3001" : undefined,
    })).toEqual([
      { workspace: "ADMIN", label: "Admin LMS", href: "http://lms.erg.edu.local:3001/admin" },
      { workspace: "TEACHER", label: "Teacher", href: "/teacher/classes" },
    ]);
  });

  it("does not put session material in switch links", () => {
    const hrefs = workspaceCapabilities(["ADMIN", "TEACHER", "STUDENT", "CRM"], "TEACHER", "/teacher?access_token=ignored")
      .map((capability) => capability.href);
    expect(hrefs.every((href) => !/token|jwt|permission|portal=/i.test(href))).toBe(true);
  });
});
