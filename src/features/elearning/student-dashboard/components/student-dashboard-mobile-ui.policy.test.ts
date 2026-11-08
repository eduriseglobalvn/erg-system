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
    expect(dock).toContain("ErgMobileDock");
  });

  it("feeds the dock and menu badge from the Hộp thư inbox unread count, not the old announcements", () => {
    const runtime = readSibling("./student-dashboard-workspace-runtime.tsx");

    expect(runtime).toContain("useUnreadNotificationCount(quizRuntimePortal");
    expect(runtime).toContain("announcementUnreadCount={unreadInboxCount}");
    expect(runtime).toContain("unreadAnnouncementCount={unreadInboxCount}");
    expect(runtime).not.toMatch(/const unreadAnnouncementCount/);
  });

  it("uses no KPI tiles and no ALL CAPS labels on the mobile overview", () => {
    const overview = readSibling("./student-dashboard-mobile-overview.tsx");

    expect(overview).not.toContain("OverviewMetrics");
    expect(overview).not.toContain("uppercase");
  });

  it("reserves the shared dock clearance at the bottom of the scroll region", () => {
    const shell = readSibling("./student-dashboard-mobile-shell.tsx");
    expect(shell).toContain("pb: ergMobileDockClearance()");
  });
});
