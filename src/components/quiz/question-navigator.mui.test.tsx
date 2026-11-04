import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionNavigator } from "@/components/quiz/question-navigator";
import type { Question } from "@/domain/quiz/types";

const question: Question = {
  id: "question-1",
  kind: "single_choice",
  title: "Câu hỏi thử nghiệm",
  points: 1,
  feedback: { correct: "Đúng", incorrect: "Sai", partial: "Một phần" },
  choices: [],
};

describe("QuestionNavigator MUI migration", () => {
  it("keeps search and question navigation accessible", () => {
    const onJumpToQuestion = vi.fn();
    const onQueryChange = vi.fn();

    render(
      <QuestionNavigator
        answeredQuestionIds={[]}
        currentIndex={0}
        flaggedQuestionIds={[]}
        onJumpToQuestion={onJumpToQuestion}
        onQueryChange={onQueryChange}
        questions={[question]}
        started
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm kiếm câu hỏi" }), {
      target: { value: "thử" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Câu hỏi thử nghiệm/i }));

    expect(onQueryChange).toHaveBeenCalledWith("thử");
    expect(onJumpToQuestion).toHaveBeenCalledWith(0);
  });
});

describe("QuestionNavigator filter", () => {
  it("filters to unanswered and flagged questions", () => {
    const qs = [1, 2, 3].map((n) => ({ ...question, id: `q${n}`, title: `Câu số ${n}` }));
    render(
      <QuestionNavigator answeredQuestionIds={["q1"]} currentIndex={0} flaggedQuestionIds={["q3"]} onJumpToQuestion={vi.fn()} questions={qs} started />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Chưa làm" }));
    expect(screen.queryByText("Câu số 1")).toBeNull();
    expect(screen.getByText("Câu số 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Đã đánh dấu" }));
    expect(screen.queryByText("Câu số 2")).toBeNull();
    expect(screen.getByText("Câu số 3")).toBeTruthy();
  });
});
