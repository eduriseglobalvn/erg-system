import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { QuestionViewToggle } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-view-toggle";
import { QuizTryRunner } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/try-run/quiz-try-runner";

const q = (id: string, title: string): Question =>
  ({
    id,
    kind: "single_choice",
    title,
    prompt: title,
    feedback: { correct: "", incorrect: "", partial: "" },
    choices: [
      { id: `${id}-a`, label: `Đúng ${id}`, correct: true },
      { id: `${id}-b`, label: `Sai ${id}`, correct: false },
    ],
  }) as unknown as Question;

const questions = [q("q1", "Câu một"), q("q2", "Câu hai")];

describe("QuizTryRunner", () => {
  it("practice: checks an answer, shows feedback and advances", () => {
    render(<QuizTryRunner questions={questions} startIndex={0} initialMode="practice" feedback={{ q1: { correct: "Giỏi lắm" } }} />);
    const check = screen.getByRole("button", { name: "Xem kết quả" });
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByText("Đúng q1"));
    fireEvent.click(check);
    expect(screen.getByRole("status")).toHaveTextContent("Chính xác!");
    expect(screen.getByRole("status")).toHaveTextContent("Giỏi lắm");
    expect(screen.getByRole("button", { name: "Câu tiếp theo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp theo" }));
    expect(screen.getByRole("button", { name: "Câu 1, đúng" })).toBeInTheDocument();
  });

  it("test: warns about unanswered questions, then summarises", () => {
    render(<QuizTryRunner questions={questions} startIndex={0} initialMode="test" />);
    expect(screen.getByRole("button", { name: "Quay lại" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    fireEvent.click(screen.getByText("Đúng q2"));
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Còn 1 câu chưa làm (câu 1). Vẫn nộp bài?");
    fireEvent.click(screen.getByRole("button", { name: "Vẫn nộp" }));
    expect(screen.getByText("1/2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Làm lại" }));
    expect(screen.getByRole("button", { name: "Câu 1, đang làm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 2, chưa làm" })).toBeInTheDocument();
  });

  it("shows the empty state", () => {
    render(<QuizTryRunner questions={[]} startIndex={0} initialMode="practice" />);
    expect(screen.getByText("Bài chưa có câu hỏi để chạy thử.")).toBeInTheDocument();
  });
});

describe("QuestionViewToggle", () => {
  it("switches to the learner view and never deselects", () => {
    const onChange = vi.fn();
    render(<QuestionViewToggle value="author" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Học viên làm" }));
    expect(onChange).toHaveBeenCalledWith("learner");
    fireEvent.click(screen.getByRole("button", { name: "Giáo viên soạn" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
