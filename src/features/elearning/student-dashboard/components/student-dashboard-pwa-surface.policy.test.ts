import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Student PWA surface", () => {
  it("selects the canonical mobile shell from the shared dashboard runtime", () => {
    const runtime = readFileSync(
      resolve("src/features/elearning/student-dashboard/components/student-dashboard-workspace-runtime.tsx"),
      "utf8",
    );

    expect(runtime).toContain("useDashboardSurface");
    expect(runtime).toContain("StudentDashboardMobileShell");
    expect(runtime).toMatch(/surface\s*===\s*["']mobile-web["']/);
  });

  it("gives Student the same install, update and offline capabilities as Teacher", () => {
    const shell = readFileSync(
      resolve("src/features/elearning/student-dashboard/components/student-dashboard-mobile-shell.tsx"),
      "utf8",
    );

    expect(shell).toContain("useInstallPrompt");
    expect(shell).toContain("useServiceWorkerUpdate");
    expect(shell).toContain("useOfflineShellStatus");
    expect(shell).toContain('usePwaNotifications("elearning")');
    expect(shell).toContain("LmsPwaSetupSheet");
  });
});
