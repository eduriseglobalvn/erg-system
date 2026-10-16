import { describe, expect, it } from "vitest";

import {
  desktopLoginPortal,
  desktopWorkspaceFromLoginSearch,
  resolveDesktopWorkspaceLanding,
} from "@/platform/desktop/entry";

describe("desktop workspace entry", () => {
  it("derives the login workspace from an explicit choice or safe redirect", () => {
    expect(desktopWorkspaceFromLoginSearch("?workspace=STUDENT&redirect=%2Fstudent")).toBe("STUDENT");
    expect(desktopWorkspaceFromLoginSearch("?redirect=%2Fteacher%2Fcalendar")).toBe("TEACHER");
    expect(desktopWorkspaceFromLoginSearch("?workspace=ADMIN&redirect=%2Fadmin")).toBeUndefined();
    expect(desktopWorkspaceFromLoginSearch("?redirect=https%3A%2F%2Fevil.example")).toBeUndefined();
  });

  it("uses the Student auth adapter only for a Student launch", () => {
    expect(desktopLoginPortal("STUDENT")).toBe("elearning");
    expect(desktopLoginPortal("TEACHER")).toBe("lms");
    expect(desktopLoginPortal(undefined)).toBe("lms");
  });

  it("selects only an authorized Teacher or Student workspace", () => {
    expect(resolveDesktopWorkspaceLanding({
      workspaces: ["ADMIN", "TEACHER"],
      permissions: ["lms.admin", "lms.dashboard.read"],
    })?.path).toBe("/teacher");
    expect(resolveDesktopWorkspaceLanding({
      preferredWorkspace: "STUDENT",
      workspaces: ["TEACHER", "STUDENT"],
      permissions: ["lms.dashboard.read", "elearning.assignment.read_self"],
    })?.path).toBe("/student");
    expect(resolveDesktopWorkspaceLanding({
      workspaces: ["ADMIN"],
      permissions: ["lms.admin"],
    })).toBeUndefined();
  });
});
