import { describe, expect, test } from "vitest";

import { headerClassPickerApplies, isScheduleNotification, knownStudentCount, resolveLmsTeacherRuns } from "@/features/lms/components/lms-teacher-shell-utils";
import type { AssignmentRun } from "@/domain/school/classroom-types";

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
  expect(isScheduleNotification({ data: { eventType: "SCHEDULE_PUBLISHED" } })).toBe(true);
  expect(isScheduleNotification({ eventType: "SCHEDULE_PUBLISHED" })).toBe(true);
  expect(isScheduleNotification({ data: { eventType: "SCHEDULE_CHANGED" } })).toBe(true);
  expect(isScheduleNotification({ eventType: "SCHEDULE_CANCELLED" })).toBe(true);
  expect(isScheduleNotification({ data: { eventType: "HOMEWORK_ASSIGNED" } })).toBe(false);
});

describe("knownStudentCount", () => {
  test("hides the bootstrap placeholder 0 and keeps real counts", () => {
    expect(knownStudentCount({ metricsAvailable: false, studentCount: 0 })).toBeUndefined();
    expect(knownStudentCount({ metricsAvailable: true, studentCount: 0 })).toBe(0);
    expect(knownStudentCount({ studentCount: 12 })).toBe(12);
    expect(knownStudentCount(undefined)).toBeUndefined();
  });
});

describe("headerClassPickerApplies", () => {
  test("hides the header class picker only on attendance, which follows the timetable period", () => {
    expect(headerClassPickerApplies("/teacher/attendance")).toBe(false);
    expect(headerClassPickerApplies("/teacher/attendance/x")).toBe(false);
    expect(headerClassPickerApplies("/teacher/attendance-report")).toBe(true);
    expect(headerClassPickerApplies("/teacher/discussion")).toBe(true);
    expect(headerClassPickerApplies("/teacher")).toBe(true);
  });
});
