import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobilePlayerIntro } from "@/components/quiz/mobile-player-intro";
import type { Quiz } from "@/domain/quiz/types";
import { reviewQuestion } from "@/test/fixtures/quiz-review-fixture";

const questions = [1, 2, 3].map(reviewQuestion);
const makeQuiz = (mode: "testing" | "training") =>
  ({ id: "z", title: "Kiểm tra giữa kỳ", description: "Ôn chương 1", settings: { mode, timeLimitMinutes: 15, passPercent: 50 }, sections: [] }) as unknown as Quiz;

function setup(mode: "testing" | "training", restoredDraft = false) {
  const onStart = vi.fn();
  const view = render(<MobilePlayerIntro answeredCount={2} onStart={onStart} playerCardStyle={{}} questions={questions} quiz={makeQuiz(mode)} restoredDraft={restoredDraft} />);
  return { ...view, onStart };
}

describe("MobilePlayerIntro", () => {
  it("shows the quiz, the description and exactly one contained start button", () => {
    const { container, onStart } = setup("testing");
    expect(screen.getByRole("heading", { name: "Kiểm tra giữa kỳ" })).toBeTruthy();
    expect(screen.getByText("Ôn chương 1")).toBeTruthy();
    expect(screen.getByText("15 phút")).toBeTruthy();
    expect(screen.getByText(/Đồng hồ chạy/)).toBeTruthy();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("offers to continue and says how much was restored", () => {
    setup("testing", true);
    expect(screen.getByRole("button", { name: "Tiếp tục làm bài" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/2\/3 câu/);
  });

  it("practice mode has no clock rule but still autosaves", () => {
    setup("training");
    expect(screen.queryByText(/Đồng hồ chạy/)).toBeNull();
    expect(screen.queryByText("15 phút")).toBeNull();
    expect(screen.getByText("Tự lưu sau mỗi câu")).toBeTruthy();
  });
});
