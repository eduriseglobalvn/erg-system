import { expect, test } from "vitest";

import { currentAssignmentLabel } from "@/features/lms/api/lms-classroom-api";

test("the «Bài đang làm» column names the newest assignment and counts the rest, never a raw id", () => {
  expect(currentAssignmentLabel({ items: [], totalItems: 0 })).toBe("Chưa có bài đang giao");
  expect(currentAssignmentLabel({ items: [{ id: "a", title: "Ôn tập chủ đề 1" }], totalItems: 1 })).toBe("Ôn tập chủ đề 1");
  expect(currentAssignmentLabel({ items: [{ id: "a", title: "Ôn tập chủ đề 1" }, { id: "b" }], totalItems: 3 })).toBe("Ôn tập chủ đề 1 và 2 bài khác");
  expect(currentAssignmentLabel({ items: [{ id: "a", quizId: "01a1e60d" }], totalItems: 2 })).toBe("2 bài đang giao");
});
