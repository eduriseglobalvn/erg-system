import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { TopMenuShell } from "@/features/elearning/student-dashboard/components/student-dashboard-top-menu";
import { viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import { createStudentDashboardLoadingProfile } from "@/features/elearning/student-dashboard/api/student-dashboard-query";

afterEach(cleanup);

it("tells the student the dashboard is saved data while the browser is offline", () => {
  const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  window.dispatchEvent(new Event("offline"));
  try {
    render(
      <TopMenuShell
        account={null} activePage="overview" copy={viCopy} dashboardProfile={createStudentDashboardLoadingProfile(null)}
        notificationAnchor={null} notifications={[]} todoCount={0} unreadAnnouncementCount={0}
        sidebarData={{ className: "", division: null, rank: null, streakDays: null, streakNudge: null, tier: null, xp: null }}
        onAccountOpen={vi.fn()} onNotificationClick={vi.fn()} onNotificationClose={vi.fn()} onNotificationOpen={vi.fn()}
        onPageChange={vi.fn()} onSignOut={vi.fn()}
      >
        <div>Bảng học tập</div>
      </TopMenuShell>,
    );
    expect(screen.getByText("Bạn đang offline")).toBeTruthy();
  } finally {
    onLine.mockRestore();
    window.dispatchEvent(new Event("online"));
  }
});
