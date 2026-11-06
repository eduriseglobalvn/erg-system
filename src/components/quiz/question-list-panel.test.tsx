import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import type { QuestionCell } from "@/components/quiz/question-navigator";

const make = (total: number): QuestionCell[] =>
  Array.from({ length: total }, (_, index) => ({ index, state: index === 0 ? "current" : index < 10 ? "done" : "todo", flagged: index === 3 }));

describe("QuestionListPanel", () => {
  it("renders the landmark and no go-to input for 20 questions", () => {
    render(<QuestionListPanel cells={make(20)} mode="taking" onSelect={vi.fn()} surface="web" />);
    expect(screen.getByRole("navigation", { name: "Danh sách câu hỏi" })).toBeTruthy();
    expect(screen.queryByLabelText("Đi tới câu")).toBeNull();
  });

  it("filters by hiding cells while counts stay constant", () => {
    render(<QuestionListPanel cells={make(90)} mode="taking" onSelect={vi.fn()} surface="web" />);
    expect(screen.getAllByRole("button", { name: /^Câu \d+/ })).toHaveLength(90);
    fireEvent.click(screen.getByRole("button", { name: "Chưa làm · 81" }));
    expect(screen.getAllByRole("button", { name: /^Câu \d+/ })).toHaveLength(81);
    expect(screen.getByRole("button", { name: "Tất cả · 90" })).toBeTruthy();
  });

  it("does not revive a stale filter after it fell back to all", () => {
    const cells = (flagged: number) => make(90).map((c) => ({ ...c, flagged: c.index === flagged }));
    const none = make(90).map((c) => ({ ...c, flagged: false }));
    const { rerender } = render(<QuestionListPanel cells={cells(3)} mode="taking" onSelect={vi.fn()} surface="web" />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu · 1" }));
    expect(screen.getAllByRole("button", { name: /^Câu \d+/ })).toHaveLength(1);
    rerender(<QuestionListPanel cells={none} mode="taking" onSelect={vi.fn()} surface="web" />);
    expect(screen.getAllByRole("button", { name: /^Câu \d+/ })).toHaveLength(90);
    rerender(<QuestionListPanel cells={cells(7)} mode="taking" onSelect={vi.fn()} surface="web" />);
    expect(screen.getAllByRole("button", { name: /^Câu \d+/ })).toHaveLength(90);
  });

  it("review mode renders its four filters", () => {
    const review: QuestionCell[] = make(30).map((c) => ({ ...c, state: c.index < 2 ? "wrong" : c.index < 3 ? "skipped" : "correct" }));
    render(<QuestionListPanel cells={review} mode="review" onSelect={vi.fn()} surface="web" />);
    const group = screen.getByRole("group", { name: "Lọc câu hỏi" });
    expect(Array.from(group.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["Tất cả · 30", "Sai · 2", "Bỏ trống · 1", "Đánh dấu · 1"]);
  });

  it("names only the nav Danh sách câu hỏi and alerts on invalid go-to", () => {
    render(<QuestionListPanel cells={make(90)} mode="taking" onSelect={vi.fn()} surface="web" />);
    expect(screen.getAllByLabelText("Danh sách câu hỏi")).toHaveLength(1);
    const input = screen.getByLabelText("Đi tới câu");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("alert").textContent).toBe("Nhập số từ 1 đến 90");
  });

  it("jumps to a valid question on Enter", () => {
    const onSelect = vi.fn();
    render(<QuestionListPanel cells={make(90)} mode="taking" onSelect={onSelect} surface="web" />);
    const input = screen.getByLabelText("Đi tới câu");
    fireEvent.change(input, { target: { value: "37" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(36);
  });

  it("rejects an out-of-range number without calling onSelect", () => {
    const onSelect = vi.fn();
    render(<QuestionListPanel cells={make(90)} mode="taking" onSelect={onSelect} surface="web" />);
    const input = screen.getByLabelText("Đi tới câu");
    fireEvent.change(input, { target: { value: "91" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Nhập số từ 1 đến 90")).toBeTruthy();
  });
});
