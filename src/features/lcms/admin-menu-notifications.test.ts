import { expect, it } from "vitest";

import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import { canNavigateToAdminPath, filterAdminMenuGroups } from "@/features/lcms/admin-mobile-dock-config";
import { flattenMenuItems, withNotificationBadge } from "@/features/lcms/admin-menu";

const notificationsItem = (groups = ADMIN_MENU_GROUPS) => flattenMenuItems(groups).find((item) => item.id === "admin-notifications");

it("lists Thông báo as a top-level admin item pointing at the inbox", () => {
  expect(ADMIN_MENU_GROUPS[0]?.items.map((item) => item.label)).toContain("Thông báo");
  expect(notificationsItem()).toMatchObject({ path: "/admin/notifications" });
});

it("shows it to admins and to PĐT staff who can send campaigns, hides it otherwise", () => {
  const visibleWith = (...permissions: string[]) => notificationsItem(filterAdminMenuGroups(ADMIN_MENU_GROUPS, (path) => canNavigateToAdminPath(path, permissions)));
  expect(visibleWith("lms.admin")).toBeDefined();
  expect(visibleWith("notification.campaign.send")).toBeDefined();
  expect(visibleWith("timekeeping.approve")).toBeUndefined();
});

it("badges the unread count, capped at 99+", () => {
  expect(notificationsItem(withNotificationBadge(ADMIN_MENU_GROUPS, 3))).toMatchObject({ badge: "3" });
  expect(notificationsItem(withNotificationBadge(ADMIN_MENU_GROUPS, 120))).toMatchObject({ badge: "99+" });
  expect(notificationsItem(withNotificationBadge(ADMIN_MENU_GROUPS, 0))?.badge).toBeUndefined();
});
