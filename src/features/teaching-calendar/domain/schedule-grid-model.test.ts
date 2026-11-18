import { expect, it } from "vitest";

import { latestDraftId } from "./schedule-grid-model";

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
