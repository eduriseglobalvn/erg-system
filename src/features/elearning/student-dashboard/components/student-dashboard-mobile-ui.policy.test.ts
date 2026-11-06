import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readSibling(fileName: string) {
  return readFileSync(fileURLToPath(new URL(fileName, import.meta.url)), "utf8");
}

describe("Student PWA mobile UI policy", () => {
  it("keeps the mobile shell fixed while only the content region scrolls", () => {
    const shell = readSibling("./student-dashboard-mobile-shell.tsx");

    expect(shell).toContain('height: "100dvh"');
    expect(shell).toContain('data-testid="student-mobile-scroll-region"');
    expect(shell).toContain("ERG_ASSETS.logo");
  });

  it("renders a dedicated compact overview instead of shrinking the desktop dashboard", () => {
    const runtime = readSibling("./student-dashboard-workspace-runtime.tsx");
    const surface = readSibling("./student-dashboard-overview-surface.tsx");
    const overview = readSibling("./student-dashboard-mobile-overview.tsx");

    expect(runtime).toContain("StudentDashboardOverviewSurface");
    expect(surface).toContain("StudentDashboardMobileOverview");
    expect(overview).toContain("priorityAssignment");
    expect(overview).toContain("greetingLead");
  });

  it("has no top bar: notifications and profile live in the floating dock", () => {
    const shell = readSibling("./student-dashboard-mobile-shell.tsx");
    const dock = readSibling("./student-dashboard-bottom-dock.tsx");

    expect(shell).not.toContain("AppBar");
    expect(shell).toContain("env(safe-area-inset-top, 0px)");
    expect(dock).toContain("announcementUnreadCount");
    expect(dock).toContain("Avatar");
  });

  it("uses no KPI tiles and no ALL CAPS labels on the mobile overview", () => {
    const overview = readSibling("./student-dashboard-mobile-overview.tsx");

    expect(overview).not.toContain("OverviewMetrics");
    expect(overview).not.toContain("uppercase");
  });

  it("keeps bottom-dock touch targets at least 44px", () => {
    const dock = readSibling("./student-dashboard-bottom-dock.tsx");
    expect(dock).toContain("minHeight: 48");
    expect(dock).toContain("minWidth: 48");
  });

  it("exposes an unmistakable selected state in the bottom dock", () => {
    const dock = readSibling("./student-dashboard-bottom-dock.tsx");

    expect(dock).toContain('aria-current={active ? "page" : undefined}');
    expect(dock).toContain('data-selected={active ? "true" : undefined}');
  });
});
