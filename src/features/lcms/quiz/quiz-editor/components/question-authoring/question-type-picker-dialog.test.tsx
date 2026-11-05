import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionTypePickerDialog } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-picker-dialog";

function setup() {
  const onPick = vi.fn();
  const onClose = vi.fn();
  render(<QuestionTypePickerDialog open title="Thêm câu hỏi" onPick={onPick} onClose={onClose} />);
  const search = screen.getByRole("textbox", { name: "Lọc dạng câu hỏi" });
  return { onPick, onClose, search, key: (k: string) => fireEvent.keyDown(search, { key: k }) };
}

describe("QuestionTypePickerDialog", () => {
  it("creates the filtered type on Enter", () => {
    const { onPick, search, key } = setup();
    fireEvent.change(search, { target: { value: "ghep" } });
    key("Enter");
    expect(onPick).toHaveBeenCalledWith("matching");
  });

  it("starts on Một đáp án and ArrowDown twice then Enter picks the third entry", () => {
    const { onPick, key } = setup();
    expect(screen.getByRole("button", { name: "Tạo câu Một đáp án" })).toBeInTheDocument();
    key("ArrowDown");
    key("ArrowDown");
    key("Enter");
    expect(onPick).toHaveBeenCalledWith("true-false");
  });

  it("a single click only moves the active option, and the footer button follows it", () => {
    const { onPick } = setup();
    fireEvent.click(screen.getByRole("option", { name: /Ghép cặp/ }));
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu Ghép cặp" }));
    expect(onPick).toHaveBeenCalledWith("matching");
  });

  it("creates at most once per opening, however often the button is hit", () => {
    const { onPick, key } = setup();
    const create = screen.getByRole("button", { name: "Tạo câu Một đáp án" });
    fireEvent.click(create);
    fireEvent.click(create);
    key("Enter");
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("does not create while an IME composition is running", () => {
    const { onPick, search } = setup();
    fireEvent.keyDown(search, { key: "Enter", isComposing: true });
    expect(onPick).not.toHaveBeenCalled();
  });

  it("moves the active option across groups and points aria-activedescendant at it", () => {
    const { onPick, search, key } = setup();
    key("ArrowDown");
    key("ArrowDown");
    key("ArrowDown");
    expect(screen.getByRole("option", { name: /Thang đánh giá/ })).toHaveAttribute("aria-selected", "true");
    key("ArrowDown");
    const fifth = screen.getByRole("option", { name: /Điền chỗ trống/ });
    expect(fifth).toHaveAttribute("aria-selected", "true");
    expect(search).toHaveAttribute("aria-activedescendant", fifth.id);
    key("Enter");
    expect(onPick).toHaveBeenCalledWith("fill-in-the-blanks");
  });

  it("wraps ArrowUp from the first entry to the last", () => {
    const { onPick, key } = setup();
    key("ArrowUp");
    key("Enter");
    expect(onPick).toHaveBeenCalledWith("essay");
  });

  it("a double click creates", () => {
    const { onPick } = setup();
    fireEvent.doubleClick(screen.getByRole("option", { name: /Tự luận/ }));
    expect(onPick).toHaveBeenCalledWith("essay");
  });

  it("shows an empty message when nothing matches", () => {
    const { search } = setup();
    fireEvent.change(search, { target: { value: "zzzz" } });
    expect(screen.getByText("Không có dạng nào khớp")).toBeInTheDocument();
  });

  it("Esc and Hủy close without picking", () => {
    const { onPick, onClose, search } = setup();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("uses the caller confirm label for the active type", () => {
    render(
      <QuestionTypePickerDialog open title="Đổi dạng câu hỏi" onPick={vi.fn()} onClose={vi.fn()} confirmLabel={(label) => `Đổi sang ${label}`} />,
    );
    expect(screen.getByRole("button", { name: "Đổi sang Một đáp án" })).toBeInTheDocument();
  });
});
