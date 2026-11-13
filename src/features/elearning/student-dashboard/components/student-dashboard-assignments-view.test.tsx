import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssignmentsView, filterAssignments } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import { viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

// Thursday 12/11/2026 16:00 local, so the groups below do not depend on the wall clock.
const NOW = new Date(2026, 10, 12, 16, 0).getTime();
const at = (offsetHours: number) => new Date(NOW + offsetHours * 3_600_000).toISOString();
const make = (id: string, status: StudentDashboardAssignment["status"], extra: Partial<StudentDashboardAssignment> = {}): StudentDashboardAssignment => ({
  id, quizId: `q-${id}`, title: `Bài ${id}`, status, statusLabel: "x", progressRate: null, answeredCount: null, totalQuestions: null,
  score: null, maxScore: null, dueLabel: "", attempts: [], ...extra,
});

const items = [
  make("1", "not_started", { dueAt: at(30), xpReward: 40 }),
  make("2", "in_progress", { dueAt: at(2), xpReward: 50, answeredCount: 12, totalQuestions: 20, subjectLabel: "Toán" }),
  make("3", "overdue", { dueAt: at(-60), closed: true, subjectLabel: "KHTN" }),
  make("4", "submitted", { score: 95, maxScore: 100, correctCount: 19, totalQuestions: 20, onTime: true, minutesBeforeDue: 5760, subjectLabel: "Tiếng Anh" }),
];

describe("AssignmentsView", () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  it("splits assignments into todo / submitted / overdue", () => {
    expect(filterAssignments(items, "todo").map((a) => a.id)).toEqual(["1", "2"]);
    expect(filterAssignments(items, "submitted").map((a) => a.id)).toEqual(["4"]);
    expect(filterAssignments(items, "overdue").map((a) => a.id)).toEqual(["3"]);
  });

  it("todo: resume card owns the single contained button, rows stay outlined", () => {
    const { container } = render(<AssignmentsView assignments={items} copy={viCopy} onOpenAssignment={vi.fn()} />);
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Làm tiếp" }).map((b) => b.classList.contains("MuiButton-contained"))).toEqual([true, false]);
    expect(screen.getByText(/ĐANG LÀM DỞ|Đang làm dở/i)).toBeTruthy();
    expect(screen.getByText("Hạn nộp")).toBeTruthy();
    expect(screen.getByText(/làm xong nhận tới \+90 XP/)).toBeTruthy();
  });

  it("todo without a started assignment still has exactly one contained button", () => {
    const { container } = render(<AssignmentsView assignments={[items[0]]} copy={viCopy} onOpenAssignment={vi.fn()} />);
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("submitted: banded score and before-due label, no contained button", () => {
    const { container } = render(<AssignmentsView assignments={items} copy={viCopy} initialFilter="submitted" onOpenAssignment={vi.fn()} />);
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(0);
    expect(screen.getByText("Trước hạn 4 ngày")).toBeTruthy();
    expect(screen.getAllByText("9,5").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Xem bài làm" })).toBeTruthy();
  });

  it("overdue: closed work offers Hỏi cô, not Nộp muộn", () => {
    const onAsk = vi.fn();
    render(<AssignmentsView assignments={items} copy={viCopy} initialFilter="overdue" onAskTeacher={onAsk} onOpenAssignment={vi.fn()} />);
    expect(screen.getByText("1 bài đã quá hạn")).toBeTruthy();
    expect(screen.getByText("Đã đóng")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hỏi cô" }));
    expect(onAsk).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Nộp muộn" })).toBeNull();
  });

  it("mobile hides the resumed work from the list and uses the short copy", () => {
    render(<AssignmentsView assignments={items} copy={viCopy} mobile onOpenAssignment={vi.fn()} />);
    expect(screen.queryByText("Hạn nộp")).toBeNull();
    expect(screen.getByText("TUẦN NÀY")).toBeTruthy();
    expect(screen.queryByText("HÔM NAY")).toBeNull();
  });

  it("offers an outlined 'Xem thêm bài' only while the backend holds more", () => {
    const onLoadMore = vi.fn();
    const { container, rerender } = render(<AssignmentsView assignments={items} copy={viCopy} hasMore initialFilter="submitted" onLoadMore={onLoadMore} onOpenAssignment={vi.fn()} />);
    const more = screen.getByRole("button", { name: "Xem thêm bài" });
    expect(more.classList.contains("MuiButton-outlined")).toBe(true);
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(0);
    fireEvent.click(more);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<AssignmentsView assignments={items} copy={viCopy} hasMore={false} initialFilter="submitted" onLoadMore={onLoadMore} onOpenAssignment={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Xem thêm bài" })).toBeNull();
  });

  it("shows an honest empty state", () => {
    render(<AssignmentsView assignments={[]} copy={viCopy} onOpenAssignment={vi.fn()} />);
    expect(screen.getByText("Chưa có bài trong mục này")).toBeTruthy();
  });
});
