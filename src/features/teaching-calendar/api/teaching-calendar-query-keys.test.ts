import { expect, test } from "vitest";

import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-api";

test("scopes teaching-calendar workspace and reference catalog keys by portal and tenant", () => {
  const input = {
    from: "2026-06-01",
    schoolIds: ["school-a"],
    statuses: ["DRAFT", "PUBLISHED"] as const,
    tenantId: "tenant-a",
    to: "2026-06-30",
    viewMode: "BY_SCHOOL" as const,
  };

  expect(teachingCalendarQueryKeys.workspace("lcms", "workspace", input)).toEqual([
    "teaching-calendar",
    "lcms",
    "tenant-a",
    "workspace",
    "2026-06-01",
    "2026-06-30",
    "BY_SCHOOL",
    "school-a",
    "",
    "",
    "",
    "",
    "DRAFT,PUBLISHED",
  ]);
  expect(teachingCalendarQueryKeys.referenceCatalog("lms", "tenant-a")).toEqual([
    "teaching-calendar",
    "lms",
    "tenant-a",
    "reference-catalog",
  ]);
});
