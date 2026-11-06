import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { QuizWelcomeScreen } from "@/components/quiz/quiz-welcome-screen";
import type { Quiz } from "@/domain/quiz/types";
import { reviewQuestion } from "@/test/fixtures/quiz-review-fixture";

const questions = [1, 2, 3].map(reviewQuestion);
const quiz = {
  id: "z", title: "Kiểm tra giữa kỳ", subtitle: "", version: "1", description: "Ôn chương 1 và 2",
  settings: { mode: "testing", timeLimitMinutes: 15, passPercent: 50 },
  sections: [],
} as unknown as Quiz;

function setup(props: Partial<Parameters<typeof QuizWelcomeScreen>[0]> = {}) {
  const onStart = vi.fn();
  const view = render(
    <QuizWelcomeScreen
      answeredCount={0} canvasStyle={{}} isTrainingMode={false} onStart={onStart}
      playerCardStyle={{}} questions={questions} quiz={quiz} restoredDraft={false} {...props}
    />,
  );
  return { ...view, onStart };
}

describe("QuizWelcomeScreen", () => {
  it("shows the quiz name and exactly one contained start button", () => {
    const { container, onStart } = setup();
    expect(screen.getByRole("heading", { name: "Kiểm tra giữa kỳ" })).toBeTruthy();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("shows only facts that exist and nothing that needs a backend we do not have", () => {
    setup({ welcomeMeta: { dueAt: new Date(Date.now() + 3 * 3_600_000 + 60_000).toISOString(), subjectLabel: "Toán 9" } });
    expect(screen.getByText("Toán 9")).toBeTruthy();
    expect(screen.getByText("15 phút")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText(/^Còn 3 giờ/)).toBeTruthy();
    expect(screen.queryByText(/lần làm/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/XP|Hạng|đã nộp/);
  });

  it("offers no theme control and says when a draft was restored", () => {
    setup({ answeredCount: 2, restoredDraft: true });
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByText(/giao diện|theme/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Tiếp tục làm bài" })).toBeTruthy();
    expect(screen.getByText(/2\/3 câu/)).toBeTruthy();
  });

  it("practice mode has no clock rule but still autosaves", () => {
    setup({ isTrainingMode: true, quiz: { ...quiz, settings: { ...quiz.settings, mode: "training" } } as Quiz });
    expect(screen.queryByText(/Đồng hồ chạy/)).toBeNull();
    expect(screen.getByText("Tự lưu sau mỗi câu")).toBeTruthy();
  });

  it("source does not use lucide-react or Tailwind classes", () => {
    const source = readFileSync(resolve(__dirname, "quiz-welcome-screen.tsx"), "utf8");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toMatch(/className=/);
  });
});
