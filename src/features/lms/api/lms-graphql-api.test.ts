import { expect, test } from "vitest";

import {
  mapAssignmentsToRuns,
  mapClassWorkspaceToStudents,
  type LmsClassWorkspace,
  type LmsTeacherClassOption,
} from "@/features/lms/api/lms-graphql-api";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

test("maps LMS assignments into assignment runs", () => {
  const runs = mapAssignmentsToRuns(
    [
      {
        id: "asg-1",
        academicClassId: "class-1",
        quizId: "quiz-1",
        subjectId: "math",
        dueAt: "2026-06-11T10:00:00+07:00",
        status: "active",
      },
    ],
    [{ id: "class-1", name: "Lớp 6A1", grade: "grade_6" } satisfies LmsTeacherClassOption],
    new Map([
      [
        "asg-1",
        {
          submittedCount: 8,
          inProgressCount: 2,
          needsReviewCount: 1,
        },
      ],
    ]),
  );

  expect(runs).toHaveLength(1);
  expect(runs[0]).toMatchObject({
    id: "asg-1",
    subjectLabel: "Math",
    targetLevel: "Lớp 6A1",
    activeClasses: 1,
    submittedCount: 8,
    inProgressCount: 2,
    needsReviewCount: 1,
    dueLabel: expect.stringContaining("Hạn nộp"),
  });
});

test("maps class workspace students into classroom students", () => {
  const workspace: LmsClassWorkspace = {
    tenantId: "erg",
    classInfo: {
      id: "class-1",
      schoolId: "school-1",
      name: "Lớp 6A1",
      grade: "grade_6",
      academicYear: "2025-2026",
      status: "active",
      studentCount: 2,
      assignmentCount: 1,
      updatedAt: "2026-06-10T08:00:00+07:00",
    },
    scoreSummary: {
      completedAttemptCount: 12,
      attemptedStudentCount: 10,
      averagePercent: 84,
      bestPercent: 97,
    },
    riskSummary: null,
    students: {
      items: [
        {
          id: "stu-1",
          schoolId: "school-1",
          academicClassId: "class-1",
          studentCode: "S001",
          fullName: "Nguyễn Minh Anh",
          username: "minhanh",
          authUserId: "user-1",
          email: "minhanh@example.com",
          status: "active",
          updatedAt: "2026-06-10T09:00:00+07:00",
        },
      ],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
    assignments: {
      items: [
        {
          id: "asg-1",
          academicClassId: "class-1",
          quizId: "quiz-1",
          subjectId: "math",
          dueAt: "2026-06-11T10:00:00+07:00",
          status: "active",
          assignedBy: "teacher-1",
          recipientMode: "class",
          createdAt: "2026-06-10T08:00:00+07:00",
          updatedAt: "2026-06-10T08:00:00+07:00",
        },
      ],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };
  const selectedClass = {
    id: "class-1",
    schoolId: "school-1",
    schoolName: "ERG Alpha",
    clusterId: "central",
    className: "Lớp 6A1",
    gradeLabel: "Khối 6",
    homeroomTeacher: "Cô A",
    studentCount: 2,
    activeAssignments: 1,
    completionRate: 84,
    averageScore: 84,
    riskStudents: 0,
    competitionPoints: 0,
    lastSubmissionAt: "Hôm nay",
  } satisfies ClassroomSnapshot;

  const students = mapClassWorkspaceToStudents(workspace, selectedClass);

  expect(students).toHaveLength(1);
    expect(students[0]).toMatchObject({
      id: "stu-1",
      name: "Nguyễn Minh Anh",
      schoolId: "school-1",
      classId: "class-1",
      className: "Lớp 6A1",
      averageScore: 84,
      completedAssignments: 12,
      status: "steady",
    });
});
