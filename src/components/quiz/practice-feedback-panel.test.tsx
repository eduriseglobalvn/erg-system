import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { PracticeFeedbackPanel, splitFeedbackSteps } from "@/components/quiz/practice-feedback-panel";
import { SingleChoiceQuestion } from "@/components/quiz/questions/single-choice-question";
import type { AnswerResult, Question } from "@/domain/quiz/types";
import ergEnterpriseTheme from "@/themes/erg-enterprise-theme";

const renderThemed = (ui: ReactElement) => render(<ThemeProvider theme={ergEnterpriseTheme}>{ui}</ThemeProvider>);
const result = (overrides: Partial<AnswerResult>): AnswerResult => ({
  questionId: "q1", correct: false, partiallyRight: false, awardedPoints: 0, maxPoints: 1, message: "", ...overrides,
});

describe("PracticeFeedbackPanel", () => {
  it("says Chưa đúng, gần rồi! with the feedback text when wrong", () => {
    renderThemed(<PracticeFeedbackPanel result={result({ message: "Xem lại bước nhân." })} />);
    expect(screen.getByText("Chưa đúng, gần rồi!")).toBeTruthy();
    expect(screen.getByText("Xem lại bước nhân.")).toBeTruthy();
  });

  it("says Chính xác! when right, without a body when feedback is empty", () => {
    renderThemed(<PracticeFeedbackPanel result={result({ correct: true })} />);
    expect(screen.getByText("Chính xác!")).toBeTruthy();
    expect(screen.queryByTestId("practice-feedback-body")).toBeNull();
  });

  it("offers the step-by-step link only for multi-step feedback and expands on click", () => {
    const { rerender } = renderThemed(<PracticeFeedbackPanel result={result({ message: "Chỉ một bước." })} />);
    expect(screen.queryByRole("button", { name: "Xem lời giải từng bước" })).toBeNull();

    rerender(
      <ThemeProvider theme={ergEnterpriseTheme}>
        <PracticeFeedbackPanel result={result({ message: "1. Đặt x.\n2. Giải x = 3." })} />
      </ThemeProvider>,
    );
    expect(screen.getByText("Đặt x.")).toBeTruthy();
    expect(screen.queryByText("Giải x = 3.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Xem lời giải từng bước" }));
    expect(screen.getByText("Giải x = 3.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xem lời giải từng bước" })).toBeNull();
  });

  it("keeps the pending-review wording for essays", () => {
    renderThemed(<PracticeFeedbackPanel result={result({ pendingReview: true, message: "Giáo viên sẽ chấm." })} />);
    expect(screen.getByText("Đã ghi nhận bài làm")).toBeTruthy();
  });
});

describe("splitFeedbackSteps", () => {
  it("splits lines and strips list markers", () => {
    expect(splitFeedbackSteps("1. A\n- B\n\n  3) C ")).toEqual(["A", "B", "C"]);
    expect(splitFeedbackSteps("   ")).toEqual([]);
  });
});

describe("single choice review tags in practice", () => {
  const question = {
    id: "q1", kind: "single_choice", title: "Câu 1", points: 1,
    choices: [{ id: "a", label: "Sai", correct: false }, { id: "b", label: "Đúng", correct: true }, { id: "c", label: "Khác", correct: false }],
  } as unknown as Question;

  it("tags the right answer and the wrong pick once the answer is checked", () => {
    renderThemed(<SingleChoiceQuestion question={question} value={{ choiceId: "a" }} onChange={() => {}} submitted reviewMode />);
    expect(screen.getByText("Đáp án đúng")).toBeTruthy();
    expect(screen.getByText("Bạn chọn")).toBeTruthy();
  });

  it("tags a correct pick as both", () => {
    renderThemed(<SingleChoiceQuestion question={question} value={{ choiceId: "b" }} onChange={() => {}} submitted reviewMode />);
    expect(screen.getByText("Đáp án đúng · Bạn chọn")).toBeTruthy();
  });

  it("shows no tags before the answer is checked", () => {
    renderThemed(<SingleChoiceQuestion question={question} value={{ choiceId: "a" }} onChange={() => {}} />);
    expect(screen.queryByText(/Đáp án đúng|Bạn chọn/)).toBeNull();
  });
});
