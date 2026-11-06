import { describe, expect, it } from "vitest";

import type { WeeklyClassLogPeriod } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import {
  addWeeks,
  buildBlankWeek,
  buildWeeklySummary,
  currentWeekStart,
  getTeacherSignature,
  isoWeekNumber,
  mondayOf,
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
  it("signs only periods with every required field", () => {
    expect(getTeacherSignature(completePeriod(), "Lê Thị Thùy")).toBe("Lê Thị Thùy");
    expect(getTeacherSignature(completePeriod({ comment: "" }), "Lê Thị Thùy")).toBe("");
  });

  it("derives absence, discipline and unsigned counts from period data", () => {
    const week = buildBlankWeek(new Date(2026, 5, 1));
    week.days = [{ ...week.days[0], periods: [completePeriod({ absent: "An" }), completePeriod({ id: "period-2", disciplineScore: "Chưa đạt", teacherSignature: "" })] }];

    const summary = buildWeeklySummary(week);

    expect(summary.absence).toBe("An");
    expect(summary.otherViolation).toBe("1 tiết chưa đạt");
    expect(summary.discipline).toBe("1/2 tiết đạt");
    expect(summary.deduction).toBe("1");
  });
});

describe("Weekly Class Log current week", () => {
  it("uses the Monday of the ISO week for any weekday, including Sunday", () => {
    expect(mondayOf(new Date(2026, 5, 3))).toEqual(new Date(2026, 5, 1));
    expect(mondayOf(new Date(2026, 5, 7))).toEqual(new Date(2026, 5, 1));
    expect(mondayOf(new Date(2026, 5, 1))).toEqual(new Date(2026, 5, 1));
    expect(currentWeekStart(new Date(2026, 5, 8, 0, 30))).toEqual(new Date(2026, 5, 8));
  });

  it("numbers ISO weeks across year boundaries", () => {
    expect(isoWeekNumber(new Date(2026, 5, 1))).toBe(23);
    expect(isoWeekNumber(new Date(2025, 11, 29))).toBe(1); // belongs to week 1 of 2026
    expect(isoWeekNumber(new Date(2027, 0, 3))).toBe(53); // Sunday still in 2026's last week
    expect(isoWeekNumber(new Date(2024, 11, 30))).toBe(1);
  });

  it("builds a blank week with real dd/MM/yyyy dates Monday to Friday", () => {
    const week = buildBlankWeek(new Date(2026, 5, 1));
    expect(week.label).toBe("Tuần 23");
    expect(week.fromDate).toBe("01/06/2026");
    expect(week.toDate).toBe("07/06/2026");
    expect(week.days.map((day) => day.date)).toEqual(["01/06/2026", "02/06/2026", "03/06/2026", "04/06/2026", "05/06/2026"]);
    expect(week.days[0].periods).toHaveLength(10);
    expect(addWeeks(new Date(2026, 5, 1), -1)).toEqual(new Date(2026, 4, 25));
  });
});
