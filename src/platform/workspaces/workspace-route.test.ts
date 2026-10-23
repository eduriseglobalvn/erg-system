import { describe, expect, it } from "vitest";

import {
  CANONICAL_LMS_WORKSPACE_ROUTES,
  canonicalWorkspaceForPath,
  canonicalLmsWorkspaceHostForRuntime,
  canonicalCrmWorkspaceHostForRuntime,
  isCanonicalLmsWorkspaceHost,
  legacyPortalForCanonicalWorkspace,
} from "@/platform/workspaces/workspace-route";

describe("canonical LMS workspace route contract", () => {
  it("owns the three public workspace entry paths", () => {
    expect(CANONICAL_LMS_WORKSPACE_ROUTES).toEqual({
      ADMIN: { path: "/admin", legacyPortal: "lcms" },
      TEACHER: { path: "/teacher", legacyPortal: "lms" },
      STUDENT: { path: "/student", legacyPortal: "elearning" },
    });
  });

  it.each([
    ["/admin", "ADMIN"],
    ["/admin/content/resources", "ADMIN"],
    ["/teacher", "TEACHER"],
    ["/teacher/classes/today", "TEACHER"],
    ["/student", "STUDENT"],
    ["/student/assignments", "STUDENT"],
  ] as const)("maps %s to %s", (pathname, workspace) => {
    expect(canonicalWorkspaceForPath(pathname)).toBe(workspace);
  });

  it.each(["/", "/crm", "/unknown", "/administrator"])("rejects non-canonical workspace path %s", (pathname) => {
    expect(canonicalWorkspaceForPath(pathname)).toBeUndefined();
  });

  it("accepts only the LMS workspace hosts for canonical workspace routes", () => {
    expect(isCanonicalLmsWorkspaceHost({ hostname: "lms.erg.edu.vn" })).toBe(true);
    expect(isCanonicalLmsWorkspaceHost({ hostname: "lms.erg.edu.local" })).toBe(true);
    expect(isCanonicalLmsWorkspaceHost({ hostname: "localhost" })).toBe(true);
    expect(isCanonicalLmsWorkspaceHost({ hostname: "crm.erg.edu.vn" })).toBe(false);
    expect(isCanonicalLmsWorkspaceHost({ hostname: "evil.example" })).toBe(false);
  });

  it("keeps the legacy portal only at the auth compatibility boundary", () => {
    expect(legacyPortalForCanonicalWorkspace("ADMIN")).toBe("lcms");
    expect(legacyPortalForCanonicalWorkspace("TEACHER")).toBe("lms");
    expect(legacyPortalForCanonicalWorkspace("STUDENT")).toBe("elearning");
  });

  it("keeps local redirects on the local domain while production uses the canonical domain", () => {
    expect(canonicalLmsWorkspaceHostForRuntime("lcms.erg.edu.local")).toBe("lms.erg.edu.local");
    expect(canonicalLmsWorkspaceHostForRuntime("auth.erg.edu.vn")).toBe("lms.erg.edu.vn");
    expect(canonicalCrmWorkspaceHostForRuntime("crm.erg.edu.local")).toBe("crm.erg.edu.local");
    expect(canonicalCrmWorkspaceHostForRuntime("auth.erg.edu.vn")).toBe("crm.erg.edu.vn");
  });
});
