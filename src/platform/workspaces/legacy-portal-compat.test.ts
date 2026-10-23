import { describe, expect, it } from "vitest";
import { isLegacyPortal, legacyPortalFromWorkspace, workspaceFromLegacyPortal } from "@/platform/workspaces/legacy-portal-compat";

describe("legacy portal compatibility", () => {
  it("maps legacy identifiers only at the compatibility boundary", () => {
    expect(workspaceFromLegacyPortal("lcms")).toBe("ADMIN");
    expect(workspaceFromLegacyPortal("elearning")).toBe("STUDENT");
    expect(legacyPortalFromWorkspace("TEACHER")).toBe("lms");
  });

  it("rejects arbitrary portal strings", () => {
    expect(isLegacyPortal("crm")).toBe(true);
    expect(isLegacyPortal("author")).toBe(false);
    expect(workspaceFromLegacyPortal("author")).toBeUndefined();
  });
});
