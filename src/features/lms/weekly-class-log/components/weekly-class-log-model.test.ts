import { describe, expect, it } from "vitest";

import { weeklyClassLogWeeks } from "@/features/lms/weekly-class-log/api/mock-weekly-class-log-data";
import type { WeeklyClassLogPeriod } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import {
  buildWeeklySummary,
  getTeacherSignature,
  migrateWeeks,
  normalizeDisciplineValue,
} from "./weekly-class-log-model";

function completePeriod(overrides: Partial<WeeklyClassLogPeriod> = {}): WeeklyClassLogPeriod {
  return {
    id: "period-1",
    className: "6A1",
    subject: "",
    ppct: "12",
    absent: "",
    lesson: "Nội dung bài học",
    comment: "Hoàn thành tốt",
    learningScore: "",
    disciplineScore: "Đạt",
    hygieneScore: "",
    totalScore: "",
    teacherSignature: "",
    ...overrides,
  };
}

describe("Weekly Class Log model", () => {
  it("normalizes legacy discipline values during migration", () => {
    const migrated = migrateWeeks(weeklyClassLogWeeks);
    const disciplineValues = migrated.flatMap((week) => week.days.flatMap((day) => day.periods.map((period) => period.disciplineScore)));

    expect(disciplineValues.every((value) => value === "" || value === "Đạt" || value === "Chưa đạt")).toBe(true);
    expect(normalizeDisciplineValue("legacy-score")).toBe("Đạt");
  });

  it("signs only periods with every required field", () => {
    expect(getTeacherSignature(completePeriod(), "Lê Thị Thùy")).toBe("Lê Thị Thùy");
    expect(getTeacherSignature(completePeriod({ comment: "" }), "Lê Thị Thùy")).toBe("");
  });

  it("derives absence, discipline and unsigned counts from period data", () => {
    const week = structuredClone(weeklyClassLogWeeks[0]);
    week.days = [{ ...week.days[0], periods: [completePeriod({ absent: "An" }), completePeriod({ id: "period-2", disciplineScore: "Chưa đạt", teacherSignature: "" })] }];

    const summary = buildWeeklySummary(week);

    expect(summary.absence).toBe("An");
    expect(summary.otherViolation).toBe("1 tiết chưa đạt");
    expect(summary.discipline).toBe("1/2 tiết đạt");
    expect(summary.deduction).toBe("1");
  });
});
