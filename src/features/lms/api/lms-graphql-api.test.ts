import { expect, test } from "vitest";

import {
  mapAssignmentsToRuns,
  type LmsTeacherClassOption,
} from "@/features/lms/api/lms-teacher-homework-api";
import {
  mapClassWorkspaceToStudents,
  type LmsClassWorkspace,
} from "@/features/lms/api/lms-classroom-api";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";

test("maps LMS assignments into assignment runs", () => {
  const runs = mapAssignmentsToRuns(
    [
      {
        id: "asg-1",
        academicClassId: "class-1",
        quizId: "quiz-1",
        resources: [{ quizId: "quiz-1", quizVersionId: "version-1", quizVersionLabel: "v1", orderIndex: 0 }],
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
    quizId: "quiz-1",
    quizVersionId: "version-1",
    quizVersionLabel: "v1",
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
          averagePercent: 90,
          completedAssignmentCount: 1,
        },
        { id: "stu-2", fullName: "Trần Bảo", status: "active", averagePercent: 50, completedAssignmentCount: 1 },
        { id: "stu-3", fullName: "Lê Chưa Nộp", status: "active", averagePercent: null, completedAssignmentCount: null },
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

  // Each row carries the student's own score, never the class summary (84 / 12).
  expect(students).toHaveLength(3);
  expect(students[0]).toMatchObject({
    id: "stu-1",
    name: "Nguyễn Minh Anh",
    schoolId: "school-1",
    classId: "class-1",
    className: "Lớp 6A1",
    averageScore: 90,
    completedAssignments: 1,
    status: "steady",
  });
  expect(students[1]).toMatchObject({ id: "stu-2", averageScore: 50, completedAssignments: 1 });
  expect(students[2]).toMatchObject({ id: "stu-3", averageScore: 0, completedAssignments: 0 });
});
