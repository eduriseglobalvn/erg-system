import { describe, expect, it } from "vitest";

import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  LMS_MENU_GROUPS,
  lmsMobileDockItems,
  lmsNavItems,
  resolveMobileSection,
  resolveSection,
} from "@/features/lms/components/lms-teacher-shell-config";

describe("Teacher workspace navigation state", () => {
  it.each([
    ["/teacher/homework", "assignHomework"],
    ["/teacher/homework/assign", "assignHomework"],
    ["/teacher/homework/assign/step-2", "assignHomework"],
    ["/homework/assign", "assignHomework"],
    ["/teacher/homework/progress", "assignHomework"],
    ["/teacher/homework/class", "assignHomework"],
    ["/teacher/homework/exercise-bank", "exerciseBank"],
    ["/teacher/homework/exercise-bank/item-1", "exerciseBank"],
    ["/homework/exercise-bank", "exerciseBank"],
    ["/teacher/calendar", "schedule"],
    ["/teacher/calendar/week/2026-08-12", "schedule"],
    ["/calendar", "schedule"],
    ["/teacher/notifications", "notifications"],
    ["/teacher/notifications/notification-1", "notifications"],
    ["/notifications/notification-1", "notifications"],
    ["/teacher", "home"],
    ["/teacher/home", "home"],
    ["/teacher/dashboard", "home"],
    ["/home", "home"],
  ] as const)("selects the correct mobile dock item for %s", (pathname, expected) => {
    expect(resolveMobileSection(pathname)).toBe(expected);
  });

  it("keeps Home in the center of the mobile dock and uses the canonical teacher workspace URL", () => {
    expect(lmsMobileDockItems.map((item) => item.id)).toEqual([
      "assignHomework",
      "exerciseBank",
      "home",
      "schedule",
      "notifications",
    ]);
    expect(lmsMobileDockItems[2]).toMatchObject({ id: "home", label: "Home", path: "/teacher" });
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
