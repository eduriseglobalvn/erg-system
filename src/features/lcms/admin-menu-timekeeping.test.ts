import { expect, it } from "vitest";

import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import { canNavigateToAdminPath } from "@/features/lcms/admin-mobile-dock-config";
import { flattenMenuItems, withTimekeepingMenuState } from "@/features/lcms/admin-menu";

const children = (groups: ReturnType<typeof withTimekeepingMenuState>) =>
  flattenMenuItems(groups).find((item) => item.id === "timekeeping")?.children?.map((child) => child.label);

it("lists the five Chấm công entries under /admin and badges pending approvals", () => {
  const groups = withTimekeepingMenuState(ADMIN_MENU_GROUPS, () => true, 120);
  expect(children(groups)).toEqual(["Hôm nay", "Bảng công", "Công tiết dạy", "Duyệt đơn", "Cấu hình chấm công"]);
  const approvals = flattenMenuItems(groups).find((item) => item.id === "timekeeping-approvals");
  expect(approvals).toMatchObject({ path: "/admin/employees/teacher-absence", badge: "99+" });
});

it("prunes entries the session cannot open: approvers see only Công tiết dạy and Duyệt đơn, others see no group", () => {
  const canAccessWith = (...permissions: string[]) => (path: string) => canNavigateToAdminPath(path, permissions);
  expect(children(withTimekeepingMenuState(ADMIN_MENU_GROUPS, canAccessWith("timekeeping.approve")))).toEqual(["Công tiết dạy", "Duyệt đơn"]);
  expect(children(withTimekeepingMenuState(ADMIN_MENU_GROUPS, canAccessWith("lms.admin")))).toBeUndefined();
});

it("badges Công tiết dạy with the number of teachers who have not confirmed", () => {
  const find = (count?: number) => flattenMenuItems(withTimekeepingMenuState(ADMIN_MENU_GROUPS, () => true, 0, count)).find((item) => item.id === "timekeeping-teaching-hours");
  expect(find(7)).toMatchObject({ badge: "7" });
  expect(find(150)).toMatchObject({ badge: "99+" });
  expect(find(0)?.badge).toBeUndefined();
});
