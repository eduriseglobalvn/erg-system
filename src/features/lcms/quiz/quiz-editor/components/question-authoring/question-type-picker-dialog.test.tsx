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
});
