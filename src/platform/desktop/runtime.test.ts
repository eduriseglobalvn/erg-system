import { describe, expect, it } from "vitest";

import {
  DESKTOP_ALLOWED_ORIGINS,
  DESKTOP_WORKSPACES,
  desktopPathFromLocation,
  desktopWorkspaceFromLocation,
  desktopWorkspaceFromPath,
  getDesktopCapabilities,
  isAllowedDesktopOrigin,
  isDesktopWorkspace,
  resolveDesktopRuntime,
} from "./runtime";

describe("desktop runtime boundary", () => {
  it("recognizes Tauri protocols without treating hostname as authorization", () => {
    expect(resolveDesktopRuntime({ protocol: "tauri:" })).toBe("tauri");
    expect(resolveDesktopRuntime({ protocol: "file:" })).toBe("tauri");
    expect(resolveDesktopRuntime({ protocol: "https:", tauriInternals: false })).toBe("web");
  });

  it("limits desktop workspaces to Teacher and Student", () => {
    expect(DESKTOP_WORKSPACES).toEqual(["TEACHER", "STUDENT"]);
    expect(isDesktopWorkspace("TEACHER")).toBe(true);
    expect(isDesktopWorkspace("STUDENT")).toBe(true);
    expect(isDesktopWorkspace("ADMIN")).toBe(false);
    expect(isDesktopWorkspace("CRM")).toBe(false);
  });

  it("supports browser history and Tauri hash history paths", () => {
    expect(desktopWorkspaceFromPath("/teacher/home")).toBe("TEACHER");
    expect(desktopWorkspaceFromPath("/student")).toBe("STUDENT");
    expect(desktopWorkspaceFromPath("/admin")).toBeUndefined();
    expect(desktopPathFromLocation({ pathname: "/", hash: "#/student?exam=1" })).toBe("/student");
    expect(desktopWorkspaceFromLocation({ pathname: "/", hash: "#/student?exam=1" })).toBe("STUDENT");
  });

  it("fails closed for unknown origins and native capability calls", () => {
    expect(isAllowedDesktopOrigin(DESKTOP_ALLOWED_ORIGINS[0])).toBe(true);
    expect(isAllowedDesktopOrigin("https://evil.example")).toBe(false);
    expect(getDesktopCapabilities().canUseNativeCommands).toBe(false);
    expect(getDesktopCapabilities().canUseUpdater).toBe(false);
  });

  it("enables only the updater capability inside a Tauri runtime", () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    try {
      const capabilities = getDesktopCapabilities();
      expect(capabilities.runtime).toBe("tauri");
      expect(capabilities.canUseUpdater).toBe(true);
      expect(capabilities.canUseNativeCommands).toBe(false);
      expect(capabilities.allowedWorkspaces).toEqual(["TEACHER", "STUDENT"]);
    } finally {
      delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    }
  });
});
