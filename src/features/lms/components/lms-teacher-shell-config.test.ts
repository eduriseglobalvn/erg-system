import { describe, expect, it } from "vitest";

import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  LMS_MENU_GROUPS,
  lmsNavItems,
  resolveLmsMobileSection,
  resolveMobileTitle,
  resolveSection,
  visibleLmsDockItems,
} from "@/features/lms/components/lms-teacher-shell-config";

describe("Teacher workspace navigation state", () => {
  it.each([
    ["/teacher", "home"],
    ["/teacher/home", "home"],
    ["/teacher/dashboard", "home"],
    ["/home", "home"],
    ["/teacher/calendar", "calendar"],
    ["/teacher/calendar/week/2026-08-12", "calendar"],
    ["/calendar", "calendar"],
    ["/teacher/learning", "learning"],
    ["/teacher/homework", "learning"],
    ["/teacher/homework/exercise-bank", "learning"],
    ["/teacher/homework/exercise-bank/item-1", "learning"],
    ["/teacher/homework/progress", "learning"],
    ["/teacher/homework/class", "learning"],
    ["/teacher/homework/student-groups", "learning"],
    ["/teacher/reports", "learning"],
    ["/teacher/notifications", "inbox"],
    ["/teacher/notifications/abc", "inbox"],
    ["/notifications/notification-1", "inbox"],
    ["/teacher/timekeeping/requests", "timekeeping"],
    ["/teacher/account", "account"],
    ["/teacher/account/login-logs", "account"],
    ["/teacher/attendance", null],
    ["/teacher/score", null],
    ["/teacher/class-log", null],
  ] as const)("selects the correct mobile dock item for %s", (pathname, expected) => {
    expect(resolveLmsMobileSection(pathname)).toBe(expected);
  });

  it("lists the teacher dock in order and hides tabs the teacher cannot open", () => {
    expect(visibleLmsDockItems(() => true).map((item) => item.id)).toEqual(["home", "calendar", "learning", "inbox", "timekeeping", "account"]);
    expect(visibleLmsDockItems((path) => !path.includes("/timekeeping")).map((item) => item.id)).toEqual(["home", "calendar", "learning", "inbox", "account"]);
    expect(visibleLmsDockItems(() => true).find((item) => item.id === "account")?.opensSheet).toBe(true);
  });

  it("keeps the Tài khoản sheet entry even when the account route is not permitted", () => {
    expect(visibleLmsDockItems((path) => !path.endsWith("/account")).map((item) => item.id)).toEqual(["home", "calendar", "learning", "inbox", "timekeeping", "account"]);
  });

  it("titles the mobile top bar by screen instead of the dock tab", () => {
    expect(resolveMobileTitle("/teacher/homework/exercise-bank", "learning", "Bài tập")).toBe("Kho luyện tập");
    expect(resolveMobileTitle("/teacher/homework/progress", "learning", "Bài tập")).toBe("Tiến độ học tập");
    expect(resolveMobileTitle("/teacher/homework/student-groups", "learning", "Bài tập")).toBe("Nhóm học sinh");
    expect(resolveMobileTitle("/teacher/attendance", null, "Điểm danh & KCT")).toBe("Điểm danh");
    expect(resolveMobileTitle("/teacher/reports", "learning", "Báo cáo")).toBe("Báo cáo lớp học");
    expect(resolveMobileTitle("/teacher/calendar", "calendar", "Lịch làm việc")).toBe("Lịch");
    expect(resolveMobileTitle("/teacher/score", null, "Bảng điểm")).toBe("Bảng điểm");
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
    ["/teacher/timekeeping/timesheet", "timekeeping"],
    ["/teacher/timekeeping/approvals", "timekeeping"],
  ] as const)("keeps the desktop section context for nested route %s", (pathname, expected) => {
    expect(resolveSection(pathname)).toBe(expected);
  });
});
