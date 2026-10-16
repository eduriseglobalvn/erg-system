import { describe, expect, it } from "vitest";

import { lcmsWorkspacePaths } from "@/app/portal-route-registry";
import { flattenMenuItems, LCMS_MENU_GROUPS } from "@/features/lcms/lcms-menu";

const removedLabels = [
  "Học viên",
  "Khóa học",
  "Lớp học",
  "Buổi học",
  "Bài tập",
  "Tài chính",
  "Khác",
];

const removedPaths = [
  "students/list-center-student",
  "students/list-student-course",
  "students/list-class-enroll",
  "students/list-student-session",
  "students/list-student-assignment",
  "students/student-absence",
  "courses",
  "sessions",
  "assignments",
  "finance/orders",
  "finance/product-import-summaries",
  "finance/incomes",
  "finance/expenses",
  "finance/refunds",
  "finance/center-transactions",
  "finance/center-transactions/coins",
  "other/products",
  "other/partners",
];

describe("LCMS pruned navigation contract", () => {
  it("keeps only permission administration under System and personnel under Management", () => {
    const items = flattenMenuItems(LCMS_MENU_GROUPS);
    const labels = LCMS_MENU_GROUPS.flatMap((group) => group.items.map((item) => item.label));
    const paths = items.flatMap((item) => item.path ? [item.path] : []);

    for (const label of removedLabels) expect(labels).not.toContain(label);
    expect(paths).toEqual(expect.arrayContaining([
      "/quiz-bank",
      "/questions",
      "/quiz-editor",
      "/resources",
      "/employees",
      "/settings/permissions",
      "/settings/roles",
      "/integration/setting-center-api-key",
    ]));
    expect(paths).not.toEqual(expect.arrayContaining([
      "/setting/setting-center-feature",
      "/setting/promotions/price-discount-programs",
      "/setting/setting-center-task/task-status",
      "/setting/setting-center-customer/customer-status",
      "/setting/setting-class-room",
      "/setting/setting-calendar-event",
      "/setting/setting-criteria-score",
      "/setting/setting-income-expense",
    ]));
  });

  it("removes every retired LCMS workspace path while preserving school-management screens", () => {
    for (const path of removedPaths) expect(lcmsWorkspacePaths).not.toContain(path);
    expect(lcmsWorkspacePaths).toEqual(expect.arrayContaining([
      "schools/classes",
      "schools/students",
      "quiz-bank",
      "questions",
      "quiz-editor",
      "settings/permissions",
      "settings/roles",
    ]));
    expect(lcmsWorkspacePaths).toContain("setting/setting-center-feature");
  });
});
