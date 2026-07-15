import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionNavigator } from "@/components/quiz/question-navigator";
import type { Question } from "@/lib/types";

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
