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
    expect(overview).toContain('gridTemplateColumns: "repeat(2, minmax(0, 1fr))"');
    expect(overview).toContain("priorityAssignment");
  });

  it("exposes an unmistakable selected state in the bottom dock", () => {
    const dock = readSibling("./student-dashboard-bottom-dock.tsx");

    expect(dock).toContain('aria-current={active ? "page" : undefined}');
    expect(dock).toContain('data-selected={active ? "true" : undefined}');
  });
});
