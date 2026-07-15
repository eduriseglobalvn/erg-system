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
  it("removes the obsolete sidebar groups while preserving content authoring and administration", () => {
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
      "/setting/setting-center-role",
      "/integration/setting-center-api-key",
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
    ]));
  });
});
