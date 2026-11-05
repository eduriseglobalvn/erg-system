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

  it("practice: a wrong answer shows the correct answer", () => {
    render(<QuizTryRunner questions={questions} startIndex={0} initialMode="practice" />);
    fireEvent.click(screen.getByText("Sai q1"));
    fireEvent.click(screen.getByRole("button", { name: "Xem kết quả" }));
    expect(screen.getByRole("status")).toHaveTextContent("Chưa đúng · Đáp án đúng: Đúng q1");
  });

  it("practice: an essay is neutral, never wrong", () => {
    const essay = { id: "e1", kind: "essay", title: "Tự luận", prompt: "x", feedback: { correct: "", incorrect: "", partial: "" } } as unknown as Question;
    window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;
    render(<QuizTryRunner questions={[essay]} startIndex={0} initialMode="practice" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "bài làm" } });
    fireEvent.click(screen.getByRole("button", { name: "Xem kết quả" }));
    expect(screen.getByRole("status")).toHaveTextContent("Câu này không chấm tự động.");
    expect(screen.queryByText(/Chưa đúng/)).toBeNull();
  });

  it("restart goes to question 1 even when started on question 2", () => {
    render(<QuizTryRunner questions={questions} startIndex={1} initialMode="test" />);
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    fireEvent.click(screen.getByRole("button", { name: "Vẫn nộp" }));
    fireEvent.click(screen.getByRole("button", { name: "Làm lại" }));
    expect(screen.getByRole("button", { name: "Câu 1, đang làm" })).toBeInTheDocument();
  });

  it("switching mode clears answers and returns to the start question", () => {
    render(<QuizTryRunner questions={questions} startIndex={1} initialMode="test" />);
    fireEvent.click(screen.getByText("Đúng q2"));
    expect(screen.getByText("1/2 đã làm")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Luyện tập" }));
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    expect(screen.getByText("0/2 đã làm")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 2, đang làm" })).toBeInTheDocument();
  });

  it("grid uses 5 columns up to 20 questions and 10 above", () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => q(`m${i}`, `T${i}`));
    const { unmount } = render(<QuizTryRunner questions={many(20)} startIndex={0} initialMode="test" />);
    expect(screen.getByRole("button", { name: "Câu 1, đang làm" }).parentElement).toHaveStyle({ gridTemplateColumns: "repeat(5, 40px)" });
    unmount();
    render(<QuizTryRunner questions={many(21)} startIndex={0} initialMode="test" />);
    expect(screen.getByRole("button", { name: "Câu 1, đang làm" }).parentElement).toHaveStyle({ gridTemplateColumns: "repeat(10, 30px)" });
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
