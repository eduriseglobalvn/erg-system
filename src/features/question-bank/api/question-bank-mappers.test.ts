import { expect, test } from "vitest";

import { mapWorkspace } from "@/features/question-bank/api/question-bank-mappers";

test("fallback labels are written in Vietnamese with diacritics", () => {
  const workspace = mapWorkspace({
    subjects: [{ id: "s1", label: "Toán" }],
    questions: { items: [{ id: "q1", subjectId: "s1" }, { id: "q2", subjectId: "s1", lastUsedAt: "not-a-date" }], page: 0, size: 50, totalItems: 2, totalPages: 1, hasNext: false, hasPrevious: false },
  });

  expect(workspace.subjects[0]?.companyScopeLabel).toBe("Dùng chung toàn công ty");
  expect(workspace.questions[0]).toMatchObject({ categoryLabel: "Chủ đề", stem: "Câu hỏi 1", lastUsedAt: "Mới cập nhật" });
  expect(workspace.questions[1]?.lastUsedAt).toBe("Mới cập nhật");
});
