import { describe, expect, test } from "vitest";

import { isSchedulePublishedNotification, resolveLmsTeacherRuns } from "@/features/lms/components/lms-teacher-shell-utils";
import type { AssignmentRun } from "@/features/lms/classroom/types/classroom-types";

const createdRun = { id: "assignment-local", title: "Local" } as AssignmentRun;
const workspaceRun = { id: "assignment-be", title: "BE" } as AssignmentRun;
const fallbackRun = { id: "assignment-mock", title: "Mock" } as AssignmentRun;

describe("resolveLmsTeacherRuns", () => {
  test("uses only BE workspace runs when API base is configured", () => {
    expect(
      resolveLmsTeacherRuns({
        apiBacked: true,
        createdRuns: [createdRun],
        fallbackRuns: [fallbackRun],
        workspaceRuns: [workspaceRun],
      }),
    ).toEqual([workspaceRun]);
  });

  test("keeps local created runs only in no-API-base mode", () => {
    expect(
      resolveLmsTeacherRuns({
        apiBacked: false,
        createdRuns: [createdRun],
        fallbackRuns: [fallbackRun],
        workspaceRuns: [],
      }),
    ).toEqual([createdRun, fallbackRun]);
  });
});

test("recognizes a published schedule push for calendar cache invalidation", () => {
  expect(isSchedulePublishedNotification({ data: { eventType: "SCHEDULE_PUBLISHED" } })).toBe(true);
  expect(isSchedulePublishedNotification({ eventType: "SCHEDULE_PUBLISHED" })).toBe(true);
  expect(isSchedulePublishedNotification({ data: { eventType: "HOMEWORK_ASSIGNED" } })).toBe(false);
});
