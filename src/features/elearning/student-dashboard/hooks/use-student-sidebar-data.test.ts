import { expect, it } from "vitest";

import { streakNudge } from "@/features/elearning/student-dashboard/hooks/use-student-sidebar-data";

it("nudges only a live streak with no XP yet today", () => {
  expect(streakNudge(12, 0)).toBe(13);
  expect(streakNudge(12, 30)).toBeNull();
  expect(streakNudge(0, 0)).toBeNull();
  expect(streakNudge(null, null)).toBeNull();
});
