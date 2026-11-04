import { describe, expect, it } from "vitest";

import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  LMS_MENU_GROUPS,
  lmsMobileDockItems,
  lmsNavItems,
  resolveMobileSection,
  resolveMobileTitle,
  resolveSection,
} from "@/features/lms/components/lms-teacher-shell-config";

describe("Teacher workspace navigation state", () => {
  it.each([
    ["/teacher/homework", "assignHomework"],
    ["/teacher/homework/assign", "assignHomework"],
    ["/teacher/homework/assign/step-2", "assignHomework"],
    ["/homework/assign", "assignHomework"],
    ["/teacher/homework/progress", "assignHomework"],
    ["/teacher/homework/class", "class"],
    ["/teacher/homework/student-groups", "class"],
    ["/teacher/attendance", "attendance"],
    ["/attendance", "attendance"],
    ["/teacher/homework/exercise-bank", "assignHomework"],
    ["/teacher/homework/exercise-bank/item-1", "assignHomework"],
    ["/homework/exercise-bank", "assignHomework"],
    ["/teacher/calendar", "more"],
    ["/teacher/calendar/week/2026-08-12", "more"],
    ["/calendar", "more"],
    ["/teacher/notifications", "more"],
    ["/teacher/notifications/notification-1", "more"],
    ["/notifications/notification-1", "more"],
    ["/teacher/account", "more"],
    ["/teacher/score", "more"],
    ["/teacher", "home"],
    ["/teacher/home", "home"],
    ["/teacher/dashboard", "home"],
    ["/home", "home"],
  ] as const)("selects the correct mobile dock item for %s", (pathname, expected) => {
    expect(resolveMobileSection(pathname)).toBe(expected);
  });

  it("exposes the Vietnamese teacher dock: Hôm nay, Điểm danh, Giao bài, Lớp, Thêm", () => {
    expect(lmsMobileDockItems.map((item) => item.label)).toEqual(["Hôm nay", "Điểm danh", "Giao bài", "Lớp", "Thêm"]);
    expect(lmsMobileDockItems[0]).toMatchObject({ id: "home", path: "/teacher" });
    expect(lmsMobileDockItems[1]).toMatchObject({ id: "attendance", path: "/teacher/attendance" });
    expect(lmsMobileDockItems.find((item) => item.id === "more")?.opensMenu).toBe(true);
  });

  it("always resolves to a dock item so one tab is active on every mobile screen", () => {
    const ids = new Set(lmsMobileDockItems.map((item) => item.id));
    for (const pathname of ["/teacher", "/teacher/attendance", "/teacher/homework", "/teacher/homework/progress", "/teacher/homework/student-groups", "/teacher/homework/class", "/teacher/class-log", "/teacher/reports", "/teacher/resources", "/teacher/unknown"]) {
      expect(ids.has(resolveMobileSection(pathname))).toBe(true);
    }
  });

  it("titles the mobile top bar by screen instead of the dock tab", () => {
    expect(resolveMobileTitle("/teacher/homework/exercise-bank", "assignHomework", "Bài tập")).toBe("Kho luyện tập");
    expect(resolveMobileTitle("/teacher/homework/progress", "assignHomework", "Bài tập")).toBe("Tiến độ học tập");
    expect(resolveMobileTitle("/teacher/homework/student-groups", "class", "Bài tập")).toBe("Nhóm học sinh");
    expect(resolveMobileTitle("/teacher/attendance", "attendance", "Điểm danh & KCT")).toBe("Điểm danh");
    expect(resolveMobileTitle("/teacher/reports", "more", "Báo cáo lớp học")).toBe("Báo cáo lớp học");
  });

  it("uses the shared resource label for the resource workspace", () => {
    expect(lmsNavItems.find((item) => item.id === "resources")?.label).toBe(LEARNING_RESOURCE_WORKSPACE_LABEL);
    expect(LMS_MENU_GROUPS.find((group) => group.items.some((item) => item.id === "resources"))?.label).toBe("Học liệu");
    expect(LMS_MENU_GROUPS.flatMap((group) => group.items).find((item) => item.id === "resources")?.label).toBe(LEARNING_RESOURCE_WORKSPACE_LABEL);
  });

  it.each([
    ["/teacher/homework/assign", "homework"],
    ["/teacher/homework/exercise-bank/item-1", "homework"],
    ["/teacher/calendar/week/2026-08-12", "schedule"],
    ["/teacher/notifications/notification-1", "homework"],
  ] as const)("keeps the desktop section context for nested route %s", (pathname, expected) => {
    expect(resolveSection(pathname)).toBe(expected);
  });
});
