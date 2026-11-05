import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { TrueFalseAuthoring } from "./true-false-authoring";

const start: Question = {
  id: "q", kind: "true_false", prompt: "",
  choices: [{ id: "a", label: "Đúng", correct: true }, { id: "b", label: "Sai", correct: false }],
} as Question;

function Harness() {
  const [q, setQ] = useState(start);
  return <TrueFalseAuthoring onChange={setQ} question={q} />;
}

describe("TrueFalseAuthoring", () => {
  it("marking B clears A, and marking B again clears it", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu B là đáp án đúng" }));
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu B là đáp án đúng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đánh dấu A là đáp án đúng" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ đánh dấu B là đáp án đúng" }));
    expect(screen.getByRole("button", { name: "Đánh dấu B là đáp án đúng" })).toBeInTheDocument();
  });

  it("double-click edits a label and keeps the correct mark; Esc cancels", () => {
    render(<Harness />);
    fireEvent.doubleClick(screen.getByText("Đúng"));
    const input = screen.getByRole("textbox", { name: "Nội dung phương án 1" });
    fireEvent.change(input, { target: { value: "Có" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Có")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu A là đáp án đúng" })).toBeInTheDocument();
    fireEvent.doubleClick(screen.getByText("Có"));
    const again = screen.getByRole("textbox", { name: "Nội dung phương án 1" });
    fireEvent.change(again, { target: { value: "Xyz" } });
    fireEvent.keyDown(again, { key: "Escape" });
    expect(screen.getByText("Có")).toBeInTheDocument();
  });

  it("restores the old label when an edit is committed empty", () => {
    render(<Harness />);
    fireEvent.doubleClick(screen.getByText("Sai"));
    const input = screen.getByRole("textbox", { name: "Nội dung phương án 2" });
    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.blur(input);
    expect(screen.getByText("Sai")).toBeInTheDocument();
  });

  it("flips between Đúng/Sai and Có/Không, keeping correct marks", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Đổi thành Có / Không" }));
    expect(screen.getByText("Có")).toBeInTheDocument();
    expect(screen.getByText("Không")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu A là đáp án đúng" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đổi thành Đúng / Sai" }));
    expect(screen.getByText("Đúng")).toBeInTheDocument();
    expect(screen.getByText("Sai")).toBeInTheDocument();
  });
});
