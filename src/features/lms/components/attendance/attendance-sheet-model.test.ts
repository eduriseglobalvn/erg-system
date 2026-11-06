import { expect, test } from "vitest";

import { bulkPresentTargets, countLessonsThroughDate, curriculumProgramFromTree, type AttendanceColumn, type AttendanceStatus } from "./attendance-sheet-model";

test("builds attendance curriculum rows from canonical level/topic order", () => {
  const rows = curriculumProgramFromTree({
    subject: { id: "sub-1", name: "IC3", code: "ic3" },
    levels: [
      { level: { id: "l2", name: "Level 2", sortOrder: 20 }, topics: [{ id: "t2", name: "Safety", sortOrder: 20 }] },
      { level: { id: "l1", name: "Level 1", sortOrder: 10 }, topics: [{ id: "t1", name: "Computing", sortOrder: 10 }] },
    ],
  });

  expect(rows).toEqual([
    { topic: "Level 1", period: 1, title: "Computing" },
    { topic: "Level 2", period: 2, title: "Safety" },
  ]);
});

test("counts lessons only on configured teaching weekdays", () => {
  expect(countLessonsThroughDate("2026-08-20", { startDate: "2026-08-18", teachingDays: [2, 4], sessionsPerDay: 2 })).toBe(4);
});

test("bulk present targets only unmarked, non-future cells", () => {
  const column = (id: string, isFutureDate = false) => ({ id, isFutureDate }) as AttendanceColumn;
  const marked: Record<string, AttendanceStatus> = { "a:c1": "absent" };
  const targets = bulkPresentTargets(
    [{ id: "a" }, { id: "b" }],
    [column("c1"), column("c2", true)],
    (studentId, _i, col) => marked[`${studentId}:${col.id}`] ?? "",
  );
  expect(targets).toEqual([{ studentId: "b", columnId: "c1" }]);
});
