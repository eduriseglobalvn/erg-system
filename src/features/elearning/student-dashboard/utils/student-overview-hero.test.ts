import { describe, expect, it } from "vitest";

import { viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { averageOfScored, resolveOverviewHero, serverAverageTen } from "@/features/elearning/student-dashboard/utils/student-overview-hero";

function assignment(overrides: Partial<StudentDashboardAssignment> = {}): StudentDashboardAssignment {
  return {
    answeredCount: null,
    attempts: [],
    dueLabel: "",
    id: "a1",
    maxScore: null,
    progressRate: null,
    quizId: "q1",
    score: null,
    status: "not_started",
    statusLabel: "Chưa bắt đầu",
    title: "Kiểm tra Tin 8",
    totalQuestions: null,
    ...overrides,
  };
}

describe("resolveOverviewHero", () => {
  it("shows the primary CTA and an outlined secondary for an open assignment with a quiz", () => {
    const hero = resolveOverviewHero(assignment({ dueAt: "2026-11-05T10:00:00" }), viCopy);
    expect(hero.primaryAssignmentId).toBe("a1");
    expect(hero.secondaryVariant).toBe("outlined");
    expect(hero.description).toBe("Kiểm tra Tin 8 · hạn 05/11/2026");
  });

  it("hides the primary CTA and promotes the secondary when the open assignment has no quiz", () => {
    const hero = resolveOverviewHero(assignment({ quizId: undefined }), viCopy);
    expect(hero.primaryAssignmentId).toBeNull();
    expect(hero.secondaryVariant).toBe("contained");
    expect(hero.description).toBe("Kiểm tra Tin 8");
  });

  it("says everything is done when the latest assignment is submitted", () => {
    const hero = resolveOverviewHero(assignment({ status: "submitted" }), viCopy);
    expect(hero).toEqual({ description: "Bạn đã xong hết bài", primaryAssignmentId: null, secondaryVariant: "contained" });
  });

  it("says nothing is assigned yet (not \"all done\") when there is no assignment", () => {
    const hero = resolveOverviewHero(undefined, viCopy);
    expect(hero).toEqual({ description: "Chưa có bài nào được giao", primaryAssignmentId: null, secondaryVariant: "contained" });
  });
});

describe("the explained average", () => {
  it("averages each scored assignment's own percent", () => {
    expect(averageOfScored([
      assignment({ id: "a", score: 8, maxScore: 10 }),
      assignment({ id: "b", score: 1, maxScore: 4 }),
      assignment({ id: "c" }),
    ])).toEqual({ count: 2, percent: 53 });
    expect(averageOfScored([assignment()])).toBeNull();
  });

  it("puts the server's percent average on the 10-point scale", () => {
    expect(serverAverageTen({ averageScore: 76, completedAssignments: 63 })).toEqual({ averageTen: "7,6", count: 63 });
    expect(serverAverageTen({ averageScore: 80, completedAssignments: 2 })).toEqual({ averageTen: "8", count: 2 });
    expect(serverAverageTen({ averageScore: null, completedAssignments: 2 })).toBeNull();
    expect(serverAverageTen({ averageScore: 80, completedAssignments: 0 })).toBeNull();
  });
});
