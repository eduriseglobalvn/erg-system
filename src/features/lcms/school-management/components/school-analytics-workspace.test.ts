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
  studentStats: { total: 2, atRisk: 1, studying: 1, profileComplete: 2, assigned: 0 },
  scoredStudentCount: 2,
  averageScore: 70,
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
