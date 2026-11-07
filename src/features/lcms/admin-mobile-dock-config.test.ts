import { describe, expect, it } from "vitest";

import {
  ADMIN_MOBILE_DOCK_ITEMS,
  canNavigateToAdminPath,
  resolveAdminMobileSection,
  visibleAdminDockItems,
} from "@/features/lcms/admin-mobile-dock-config";

describe("resolveAdminMobileSection", () => {
  it.each([
    ["/admin", "home"],
    ["/admin/", "home"],
    ["/admin/calendar", "calendar"],
    ["/admin/schools/list", "schools"],
    ["/admin/schools/classes", "schools"],
    ["/admin/notifications/x", "inbox"],
    ["/admin/employees/timekeeping", "timekeeping"],
    ["/admin/employees/timesheet", "timekeeping"],
    ["/admin/users", null],
    ["/admin/employees", null],
  ])("%s -> %s", (pathname, expected) => {
    expect(resolveAdminMobileSection(pathname)).toBe(expected);
  });
});

describe("admin dock visibility", () => {
  it("hides tabs whose route does not exist yet, whatever the permissions", () => {
    const ids = visibleAdminDockItems((path) => canNavigateToAdminPath(path, ["*"])).map((item) => item.id);
    expect(ids).toEqual(["home", "calendar", "schools", "inbox", "all"]);
  });

  it("hides tabs the session has no permission for, but keeps Tất cả", () => {
    const ids = visibleAdminDockItems((path) => canNavigateToAdminPath(path, ["lms.admin"], ["lms.school.read"])).map((item) => item.id);
    expect(ids).toEqual(["home", "calendar", "inbox", "all"]);
  });

  it("keeps Tất cả for a session that cannot open the admin root, so permitted pages stay reachable", () => {
    const ids = visibleAdminDockItems((path) => canNavigateToAdminPath(path, ["lms.school.read"])).map((item) => item.id);
    expect(ids).toEqual(["schools", "all"]);
  });

  it("labels the first tab Trang chủ", () => {
    expect(ADMIN_MOBILE_DOCK_ITEMS[0]).toMatchObject({ id: "home", label: "Trang chủ" });
  });

  it("opens the sheet from Tất cả and never lists Nhân sự on the dock", () => {
    expect(ADMIN_MOBILE_DOCK_ITEMS.find((item) => item.id === "all")?.opensSheet).toBe(true);
    expect(ADMIN_MOBILE_DOCK_ITEMS.map((item) => item.label)).not.toContain("Nhân sự");
  });
});
