import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ReportsPanel } from "./reports-panel";
import { buildSubmissionTrend, filterRunsByPeriod, studentsNeedingSupport } from "./reports-panel-data";
import type { AssignmentRun, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

const run = (id: string, dueLabel: string, completionRate = 50): AssignmentRun => ({
  activeClasses: 1, completionRate, dueLabel, id, inProgressCount: 0, needsReviewCount: 0,
  subjectLabel: "Toán", submittedCount: 0, targetLevel: "9A1", title: `Bài ${id}`,
});

describe("ReportsPanel", () => {
  it("uses MUI instead of Tailwind", () => {
    const source = readFileSync(resolve("src/features/lms/components/reports-panel.tsx"), "utf8");
    expect(source).not.toContain("className=");
  });

  it("renders the title and an empty state when there is no assignment data", () => {
    render(<ReportsPanel selectedSchoolName="ERG School" />);
    expect(screen.getByRole("heading", { name: "Báo cáo lớp" })).toBeVisible();
    expect(screen.getByText(/ERG School/)).toBeVisible();
    expect(screen.getByText("Chưa có bài giao trong kỳ này")).toBeVisible();
  });
});

describe("reports data helpers", () => {
  const now = new Date("2026-11-05T00:00:00Z");

  it("filters runs by due date and keeps runs with unparsable labels", () => {
    const runs = [run("a", "2026-11-01T00:00:00Z"), run("b", "2026-08-01T00:00:00Z"), run("c", "Sau 7 ngày")];
    expect(filterRunsByPeriod(runs, "30", now).map((r) => r.id)).toEqual(["a", "c"]);
    expect(filterRunsByPeriod(runs, "all", now)).toHaveLength(3);
  });

  it("builds chart rows with clamped rates", () => {
    expect(buildSubmissionTrend([run("a", "", 140)])[0]?.completionRate).toBe(100);
  });

  it("lists support students weakest first", () => {
    const make = (id: string, status: ClassroomStudent["status"], progressRate: number) => ({ id, name: id, progressRate, status }) as ClassroomStudent;
    const list = studentsNeedingSupport([make("x", "support", 40), make("y", "steady", 10), make("z", "support", 20)]);
    expect(list.map((s) => s.id)).toEqual(["z", "x"]);
  });
});
