import { expect, test } from "vitest";

import { mapClassWorkspaceToStudents, type LmsClassWorkspace } from "@/features/lms/api/lms-classroom-api";

test("the «Bài đang làm» column shows each student's own newest assignment (BUG-C-013)", () => {
  const page = { page: 0, size: 20, totalItems: 2, totalPages: 1, hasNext: false };
  const workspace = {
    classInfo: { id: "c1", name: "7A1" },
    students: { ...page, items: [{ id: "s1", fullName: "A", currentAssignmentTitle: "Ôn tập chủ đề 1" }, { id: "s2", fullName: "B", currentAssignmentTitle: null }] },
    assignments: { ...page, items: [{ id: "a", title: "Bài của lớp" }] },
  } as unknown as LmsClassWorkspace;
  expect(mapClassWorkspaceToStudents(workspace).map((s) => s.currentAssignment)).toEqual(["Ôn tập chủ đề 1", "Chưa làm bài nào"]);
});
