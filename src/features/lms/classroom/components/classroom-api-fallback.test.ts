import { expect, test } from "vitest";

import { resolveClassManagementStudents } from "@/features/lms/classroom/components/class-management-page";
import { resolveClassStudentsWorkspaceStudents } from "@/features/lms/classroom/components/class-students-workspace";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

const fallbackStudents: ClassroomStudent[] = [
  {
    id: "mock-student-1",
    name: "Mock Student",
    classId: "class-1",
    className: "Class 1",
    schoolId: "school-1",
    status: "steady",
    progressRate: 0,
    currentAssignment: "",
    currentStage: "",
    mentorNote: "",
  } as ClassroomStudent,
];

const workspaceStudents: ClassroomStudent[] = [
  {
    ...fallbackStudents[0],
    id: "be-student-1",
    name: "BE Student",
  } as ClassroomStudent,
];

test("class management does not use fallback students when API base is configured", () => {
  expect(resolveClassManagementStudents(undefined, fallbackStudents, true)).toEqual([]);
  expect(resolveClassManagementStudents([], fallbackStudents, true)).toEqual([]);
  expect(resolveClassManagementStudents(workspaceStudents, fallbackStudents, true)).toEqual(workspaceStudents);
});

test("class management uses fallback students only without API base", () => {
  expect(resolveClassManagementStudents(undefined, fallbackStudents, false)).toEqual(fallbackStudents);
  expect(resolveClassManagementStudents([], fallbackStudents, false)).toEqual(fallbackStudents);
});

test("class students workspace does not use fallback students when API base is configured", () => {
  expect(resolveClassStudentsWorkspaceStudents([], fallbackStudents, true, false)).toEqual([]);
  expect(resolveClassStudentsWorkspaceStudents(workspaceStudents, fallbackStudents, true, false)).toEqual(workspaceStudents);
});

test("class students workspace uses fallback students only when fixtures are explicitly enabled", () => {
  expect(resolveClassStudentsWorkspaceStudents([], fallbackStudents, false, true)).toEqual(fallbackStudents);
  expect(resolveClassStudentsWorkspaceStudents([], fallbackStudents, false, false)).toEqual([]);
});
