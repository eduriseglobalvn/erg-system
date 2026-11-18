import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CRM_HELP_MENU_GROUP } from "@/features/crm/components/crm-nav";
import { StudentSidebar } from "@/features/elearning/student-dashboard/components/student-sidebar";
import { filterChapters } from "@/features/help/help-search";
import { HELP_PATHS } from "@/features/help/help-types";
import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import { LMS_MENU_GROUPS, lmsMobileMoreItems } from "@/features/lms/components/lms-teacher-shell-config";
import { canNavigateToLmsPath } from "@/features/lms/navigation/lms-navigation";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

afterEach(cleanup);

/** Every `path` anywhere in a menu tree (groups, items, children). */
function menuPaths(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(menuPaths);
  if (!node || typeof node !== "object") return [];
  const record = node as Record<string, unknown>;
  const own = typeof record.path === "string" ? [record.path] : [];
  return [...own, ...menuPaths(record.items), ...menuPaths(record.children)];
}

describe("help guide entry points", () => {
  it("each help route has a row in ROUTE_PERMISSION_MATRIX for its workspace", () => {
    for (const [workspace, path] of Object.entries(HELP_PATHS) as [Workspace, string][]) {
      expect(routePermissionForPath(path, workspace)?.path, `${workspace} ${path}`).toBe(path);
    }
  });

  it("admin, teacher and CRM menus link to their guide", () => {
    expect(menuPaths(ADMIN_MENU_GROUPS)).toContain(HELP_PATHS.ADMIN);
    expect(menuPaths(LMS_MENU_GROUPS)).toContain(HELP_PATHS.TEACHER);
    expect(lmsMobileMoreItems.map((item) => item.path)).toContain(HELP_PATHS.TEACHER);
    expect(canNavigateToLmsPath(HELP_PATHS.TEACHER)).toBe(true);
    expect(menuPaths(CRM_HELP_MENU_GROUP)).toContain(HELP_PATHS.CRM);
  });

  it("the student sidebar shows «Hướng dẫn» and opens the guide", () => {
    const onHelpOpen = vi.fn();
    render(
      <StudentSidebar
        activePage="overview" initials="HS" name="Học sinh" rankingEnabled={false} signedIn todoCount={0} unreadCount={0}
        data={{ className: "", division: null, rank: null, streakDays: null, streakNudge: null, tier: null, xp: null }}
        onAccountOpen={vi.fn()} onHelpOpen={onHelpOpen} onPageChange={vi.fn()} onSignOut={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Hướng dẫn"));
    expect(onHelpOpen).toHaveBeenCalledOnce();
  });

  it("search ignores Vietnamese tone marks", () => {
    const chapters = [{ id: "a", title: "Bắt đầu", steps: [{ text: "Bấm «Đăng nhập»." }, { text: "Chọn lớp." }] }];
    expect(filterChapters(chapters, "dang nhap")).toEqual([{ ...chapters[0], steps: [chapters[0]!.steps[0]] }]);
    expect(filterChapters(chapters, "khong co")).toEqual([]);
  });
});
