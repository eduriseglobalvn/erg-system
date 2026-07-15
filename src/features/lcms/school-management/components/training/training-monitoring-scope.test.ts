import { describe, expect, it } from "vitest";

import { buildTrainingMonitorRows } from "@/features/lcms/school-management/components/training/training-monitoring-scope";
import type { ClassTrainingSummary } from "@/features/lcms/school-management/types/training-monitoring-types";

const summaries: ClassTrainingSummary[] = [
  makeSummary("6A1", "6", "Cô Lan", 30, 82, 3),
  makeSummary("6A2", "6", "Cô Lan", 30, 78, 5),
  makeSummary("7A1", "7", "Thầy Minh", 40, 70, 8),
];

describe("buildTrainingMonitorRows", () => {
  it("aggregates the whole school", () => {
    expect(buildTrainingMonitorRows(summaries, "school", "THCS Nguyễn Du")).toEqual([
      expect.objectContaining({ classCount: 3, name: "THCS Nguyễn Du", riskStudentCount: 16, studentCount: 100 }),
    ]);
  });

  it("groups by grade, class and teacher", () => {
    expect(buildTrainingMonitorRows(summaries, "grade", "THCS Nguyễn Du").map((row) => row.name)).toEqual(["Khối 6", "Khối 7"]);
    expect(buildTrainingMonitorRows(summaries, "class", "THCS Nguyễn Du").map((row) => row.name)).toEqual(["6A1", "6A2", "7A1"]);
    expect(buildTrainingMonitorRows(summaries, "teacher", "THCS Nguyễn Du")).toEqual([
      expect.objectContaining({ classCount: 2, name: "Cô Lan", studentCount: 60 }),
      expect.objectContaining({ classCount: 1, name: "Thầy Minh", studentCount: 40 }),
    ]);
  });
});

function makeSummary(className: string, grade: string, teacher: string, studentCount: number, classHealth: number, riskStudentCount: number): ClassTrainingSummary {
  return {
    averageScore: 7.5,
    classHealth,
    classLogCoverage: 84,
    className,
    grade,
    id: className,
    interventionEffectiveness: classHealth - 6,
    learningEngagement: classHealth + 2,
    missingAssignmentRate: 8,
    practiceScore: 7.8,
    riskStudentCount,
    status: classHealth >= 80 ? "good" : "watch",
    studentCount,
    studentMastery: classHealth,
    teacher,
    teacherEffectiveness: classHealth + 1,
    teacherSelfScore: 4.1,
    teachingDelivery: classHealth + 3,
  };
}
