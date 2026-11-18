import { expect, it } from "vitest";

import { classesOverWeeklyLimit, latestDraftId } from "./schedule-grid-model";

it("picks the newest DRAFT batch, ignoring other statuses", () => {
  const items = [
    { createdAt: "2026-11-10T08:00:00Z", id: "old", status: "DRAFT" },
    { createdAt: "2026-11-16T08:00:00Z", id: "new", status: "DRAFT" },
    { createdAt: "2026-11-17T08:00:00Z", id: "published", status: "PUBLISHED" },
  ];
  expect(latestDraftId(items)).toBe("new");
  expect(latestDraftId([])).toBeUndefined();
  expect(latestDraftId(undefined)).toBeUndefined();
});

it("warns only for classes with more than 2 periods in the week", () => {
  const row = (classId: string) => ({ classId, className: classId.toUpperCase() });
  expect(classesOverWeeklyLimit([row("a"), row("a"), row("b")])).toEqual([]);
  expect(classesOverWeeklyLimit([row("a"), row("a"), row("a"), row("b"), row("")])).toEqual([{ className: "A", count: 3 }]);
});
