import { describe, expect, test } from "vitest";

import { canNavigateToLmsPath, filterLmsNavigation } from "@/features/lms/navigation/lms-navigation";

describe("LMS permission-aware navigation", () => {
  test("uses the route permission catalog for exact and nested paths", () => {
    expect(canNavigateToLmsPath("/score", ["lms.grade.read"], [])).toBe(true);
    expect(canNavigateToLmsPath("/notifications/notification-1", ["lms.notification.read"], [])).toBe(true);
    expect(canNavigateToLmsPath("/score", ["lms.*"], ["lms.grade.*"])).toBe(false);
  });

  test("removes denied children and empty groups", () => {
    const groups = [
      { label: "Giảng dạy", items: [{ label: "Điểm", path: "/score" }, { label: "Điểm danh", path: "/attendance" }] },
      { label: "Báo cáo", items: [{ label: "Báo cáo", path: "/reports" }] },
    ];

    expect(filterLmsNavigation(groups, ["lms.grade.read"], [])).toEqual([
      { label: "Giảng dạy", items: [{ label: "Điểm", path: "/score" }] },
    ]);
  });
});
