import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { toQuestionResults } from "@/components/quiz/review/review-model";
import { ReviewQuestionView } from "@/components/quiz/review/review-question-view";
import { buildReviewFixture } from "@/test/fixtures/quiz-review-fixture";

const { questions, attempt } = buildReviewFixture();
const results = toQuestionResults(questions, attempt);

function renderAt(index: number) {
  const onPrev = vi.fn();
  const onNext = vi.fn();
  const question = questions[index];
  render(
    <ReviewQuestionView
      question={question} record={attempt.answers[question.id]} result={results[index]}
      index={index} total={questions.length} onPrev={onPrev} onNext={onNext}
    />,
  );
  return { onPrev, onNext };
}

describe("ReviewQuestionView", () => {
  it("shows a wrong question with tags and the solution", () => {
    const { onPrev, onNext } = renderAt(36);
    expect(screen.getByText("Câu 37/90")).toBeTruthy();
    expect(screen.getByText("Sai · 0 điểm")).toBeTruthy();
    expect(screen.getByText("Đáp án đúng")).toBeTruthy();
    expect(screen.getByText("Bạn chọn")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Lời giải" })).toBeTruthy();
    expect(screen.getByText("Bước 1: đổi đơn vị.")).toBeTruthy();
    expect(screen.getByText("Bước 2: thay số.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Câu trước" }));
    fireEvent.click(screen.getByRole("button", { name: "Câu sau" }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("has none of the deferred extras", () => {
    renderAt(36);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Hỏi giáo viên/i);
    expect(text).not.toMatch(/câu sai trước|câu sai sau/i);
    expect(text).not.toMatch(/Lỗi hay gặp/i);
    expect(text).not.toMatch(/XP/);
  });

  it("disables Câu trước on the first question and hides an empty solution", () => {
    renderAt(0);
    expect(screen.getByText("Đúng · 0,5 điểm")).toBeTruthy();
    expect(screen.getByText("Đáp án đúng · Bạn chọn")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Câu trước" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("heading", { name: "Lời giải" })).toBeNull();
  });

  it("disables Câu sau on the last question", () => {
    renderAt(89);
    expect((screen.getByRole("button", { name: "Câu sau" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
