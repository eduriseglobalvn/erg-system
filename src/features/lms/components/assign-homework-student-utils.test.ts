import { expect, test } from "vitest";

import {
  mapLmsStudentGroupsToAssignHomeworkGroups,
  resolveAssignHomeworkClassStudents,
  resolveAssignHomeworkGradeStudentIds,
  resolveAssignHomeworkGroups,
} from "@/features/lms/components/assign-homework-student-utils";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

const fallbackStudents = [
  {
    id: "mock-student-1",
    name: "Mock Student",
  } as ClassroomStudent,
];

const workspaceStudents = [
  {
    id: "be-student-1",
    name: "BE Student",
  } as ClassroomStudent,
];

test("does not use fallback students when assignment page is API-backed", () => {
  expect(resolveAssignHomeworkClassStudents(undefined, fallbackStudents, true)).toEqual([]);
  expect(resolveAssignHomeworkClassStudents([], fallbackStudents, true)).toEqual([]);
  expect(resolveAssignHomeworkClassStudents(workspaceStudents, fallbackStudents, true)).toEqual(workspaceStudents);
});

test("uses fallback students only for no-API-base assignment page", () => {
  expect(resolveAssignHomeworkClassStudents(undefined, fallbackStudents, false)).toEqual(fallbackStudents);
  expect(resolveAssignHomeworkClassStudents([], fallbackStudents, false)).toEqual(fallbackStudents);
});

test("maps BE student groups into assign-homework group options", () => {
  expect(
    mapLmsStudentGroupsToAssignHomeworkGroups([
      {
        id: "group-1",
        name: "BE Group",
        classId: "class-1",
        note: "Support",
        color: "#0f6cbd",
        studentIds: ["student-1", "student-2"],
        studentCount: 2,
      },
    ]),
  ).toEqual([
    {
      id: "group-1",
      name: "BE Group",
      color: "#0f6cbd",
      source: "Support",
      studentIds: ["student-1", "student-2"],
    },
  ]);
});

test("does not use fallback groups when assignment page is API-backed", () => {
  const fallbackGroups = [{ id: "mock-group", name: "Mock", color: "#000", source: "Mock", studentIds: ["mock-student"] }];
  const apiGroups = [{ id: "be-group", name: "BE", color: "#0f6cbd", source: "BE", studentIds: ["be-student"] }];

  expect(resolveAssignHomeworkGroups(undefined, fallbackGroups, true)).toEqual([]);
  expect(resolveAssignHomeworkGroups([], fallbackGroups, true)).toEqual([]);
  expect(resolveAssignHomeworkGroups(apiGroups, fallbackGroups, true)).toEqual(apiGroups);
  expect(resolveAssignHomeworkGroups([], fallbackGroups, false)).toEqual(fallbackGroups);
});

test("resolves grade student IDs from BE-backed class student maps", () => {
  expect(
    resolveAssignHomeworkGradeStudentIds(
      new Set(["class-a", "class-b"]),
      { "class-a": ["student-a1"] },
      { "class-a": ["student-a1", "student-a2"], "class-b": ["student-b1", "student-b1"] },
    ),
  ).toEqual(["student-a1", "student-b1"]);
});
