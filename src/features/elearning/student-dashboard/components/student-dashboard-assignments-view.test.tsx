import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssignmentsView, filterAssignments } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import { viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

const make = (id: string, status: StudentDashboardAssignment["status"], extra: Partial<StudentDashboardAssignment> = {}): StudentDashboardAssignment => ({
  id, quizId: `q-${id}`, title: `Bài ${id}`, status, statusLabel: "x", progressRate: null, answeredCount: null, totalQuestions: null,
  score: null, maxScore: null, dueLabel: "", attempts: [], ...extra,
});

const items = [make("1", "not_started", { dueAt: "2026-11-10T08:30:00" }), make("2", "in_progress"), make("3", "overdue"), make("4", "submitted", { score: 8, maxScore: 10 })];

describe("AssignmentsView", () => {
  it("splits assignments into todo / submitted / overdue", () => {
    expect(filterAssignments(items, "todo").map((a) => a.id)).toEqual(["1", "2"]);
    expect(filterAssignments(items, "submitted").map((a) => a.id)).toEqual(["4"]);
    expect(filterAssignments(items, "overdue").map((a) => a.id)).toEqual(["3"]);
  });

  it("renders exactly one contained button and a dd/MM/yyyy HH:mm due date", () => {
    const { container } = render(<AssignmentsView assignments={items} copy={viCopy} onOpenAssignment={vi.fn()} />);
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.getByText("Hạn nộp: 10/11/2026 08:30")).toBeTruthy();
  });

  it("shows an honest empty state", () => {
    render(<AssignmentsView assignments={[]} copy={viCopy} onOpenAssignment={vi.fn()} />);
    expect(screen.getByText("Chưa có bài trong mục này")).toBeTruthy();
  });
});
