import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("does not force every Tauri cold launch into Teacher Workspace", () => {
  const routes = readFileSync(resolve("src/routes/app-routes.tsx"), "utf8");

  expect(routes).toContain("DesktopWorkspaceEntryPage");
  expect(routes).toContain("resolveDesktopWorkspaceLanding");
  expect(routes).toContain("desktopWorkspaceFromLoginSearch");
  expect(routes).not.toMatch(/getDesktopRuntime\(\)\s*===\s*["']tauri["'][\s\S]{0,120}redirect:\s*["']\/teacher["']/);
});
