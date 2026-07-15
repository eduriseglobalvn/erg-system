import { describe, expect, it } from "vitest";
import { buildTrainingMonitoringData } from "@/features/lcms/school-management/api/mock-training-monitoring";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

const school: PartnerSchool = {
  academicYear: "2026–2027",
  address: "25 Nguyễn Huệ",
  classes: [
    { id: "class-8a1", grade: "8", homeroomTeacher: "Cô Trần Thu Hà", name: "8A1", studentCount: 3 },
    { id: "class-8a2", grade: "8", homeroomTeacher: "Thầy Lê Mạnh Hùng", name: "8A2", studentCount: 3 },
  ],
  code: "ERG-SECONDARY",
  contactEmail: "school@erg.edu.vn",
  contactPhone: "02873001200",
  district: "Quận 1",
  grades: ["8"],
  id: "school-1",
  joinedAt: "2026-01-10",
  name: "THCS ERG",
  principal: "Nguyễn Minh Anh",
  reviews: [],
  schoolType: "secondary",
  status: "active",
  students: Array.from({ length: 6 }, (_, index) => ({
    birthDate: "2012-05-10",
    className: index < 3 ? "8A1" : "8A2",
    code: `HS00${index + 1}`,
    fullName: `Học sinh ${index + 1}`,
    grade: "8",
    guardianPhone: "0900000000",
    id: `student-${index + 1}`,
    status: index === 4 ? "at-risk" : "studying",
    subjectIds: ["subject-eng"],
  })),
  subjects: [{ code: "ENG", id: "subject-eng", name: "Tiếng Anh", studentCount: 6, teacherCount: 2 }],
};

describe("training monitoring demo dataset", () => {
  it("builds twelve complete weekly evidence points", () => {
    const data = buildTrainingMonitoringData(school);

    expect(data.weeklyMetrics).toHaveLength(12);
    for (const metric of data.weeklyMetrics) {
      expect(metric).toEqual(expect.objectContaining({
        interventionEffectiveness: expect.any(Number),
        learningEngagement: expect.any(Number),
        studentMastery: expect.any(Number),
        teachingDelivery: expect.any(Number),
      }));
      expect(metric.evidence.attempts).toBeGreaterThan(0);
    }
  });

  it("creates evidence for every class, teacher, student and assignment", () => {
    const data = buildTrainingMonitoringData(school);

    expect(data.classSummaries).toHaveLength(2);
    expect(data.teachers).toHaveLength(2);
    expect(data.students).toHaveLength(6);
    expect(data.assignments.length).toBeGreaterThanOrEqual(6);
  });

  it("fills demo teacher identities when the school has not assigned homeroom teachers", () => {
    const data = buildTrainingMonitoringData({
      ...school,
      classes: school.classes.map((classroom) => ({ ...classroom, homeroomTeacher: "Chưa phân công" })),
    });

    expect(data.teachers.every((teacher) => teacher.teacher !== "Chưa phân công")).toBe(true);
    expect(data.classLogs.every((log) => log.teacher.trim().length > 0)).toBe(true);
  });

  it("includes missing work, retries and overtime attempts for drill-down testing", () => {
    const data = buildTrainingMonitoringData(school);

    expect(data.assignments.some((assignment) => assignment.missingStudents > 0)).toBe(true);
    expect(data.students.some((student) => student.totalAttempts > student.completedAssignments)).toBe(true);
    expect(data.students.some((student) => student.overtimeAttempts > 0)).toBe(true);
    expect(data.students.some((student) => student.missingAssignments > 0)).toBe(true);
  });
});
