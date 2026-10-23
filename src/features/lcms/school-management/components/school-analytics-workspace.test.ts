import { expect, test } from "vitest";

import { buildSchoolSummaryCsv, summarizeSchool } from "@/features/lcms/school-management/components/school-analytics-workspace";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

const school: PartnerSchool = {
  academicYear: "2026-2027",
  address: "",
  code: "school-1",
  contactEmail: "",
  contactPhone: "",
  district: "",
  grades: ["6"],
  id: "school-1",
  joinedAt: "",
  name: "ERG School, Q1",
  principal: "",
  reviews: [],
  schoolType: "secondary",
  status: "active",
  students: [
    { id: "s1", code: "S1", fullName: "A", birthDate: "", grade: "6", className: "6A1", guardianPhone: "", subjectIds: [], status: "studying", averageScore: 80 },
    { id: "s2", code: "S2", fullName: "B", birthDate: "", grade: "6", className: "6A1", guardianPhone: "", subjectIds: [], status: "at-risk", averageScore: 60 },
  ],
  classes: [{ id: "c1", name: "6A1", grade: "6", homeroomTeacher: "Teacher", studentCount: 2 }],
  subjects: [{ id: "math", name: "Math", code: "MATH", studentCount: 2, teacherCount: 1 }],
  studentCount: 2,
  classCount: 1,
};

test("summarizes only backend-provided school operations data", () => {
  expect(summarizeSchool(school)).toEqual({ atRiskCount: 1, averageScore: 70, classCount: 1, scoredStudentCount: 2, studentCount: 2, subjectCount: 1 });
});

test("exports an aggregate summary without personal student rows", () => {
  const csv = buildSchoolSummaryCsv(school);
  expect(csv).toContain("schoolName,\"ERG School, Q1\"");
  expect(csv).toContain("atRiskCount,1");
  expect(csv).not.toContain("A");
  expect(csv).not.toContain("B");
});
