import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import { enCopy } from "./question-bank-copy";
import { QuestionQuickViewDrawer } from "./question-quick-view-drawer";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

const question = {
  id: "q1",
  scope: "shared",
  subjectId: "ic3",
  subjectLabel: "IC3",
  levelId: "l1",
  levelLabel: "Level 1",
  categoryId: "c1",
  categoryLabel: "Chủ đề",
  gradeLabel: "",
  type: "single_choice",
  difficulty: "easy",
  status: "published",
  stem: "Thủ đô của Việt Nam?",
  objective: "",
  tags: [],
  masteryRate: 0,
  usageCount: 0,
  schoolsUsing: 0,
  lastUsedAt: "",
  recommendedCluster: "",
  choices: [{ id: "a", label: "Hà Nội", correct: true }],
} as unknown as QuestionBankQuestion;

it("uses the shared view toggle and switching changes the pressed view", () => {
  render(
    <I18nProvider><QuestionQuickViewDrawer copy={enCopy} deleting={false} duplicating={false} onClose={vi.fn()} onDelete={vi.fn()} onDuplicate={vi.fn()} onEdit={vi.fn()} onNavigate={vi.fn()} question={question} quizzes={[]} siblings={[question]} /></I18nProvider>,
  );
  const teacher = screen.getByRole("button", { name: "Giáo viên soạn" });
  const learner = screen.getByRole("button", { name: "Học viên làm" });
  expect(learner.querySelector("svg")).not.toBeNull(); // the shared toggle carries icons
  expect(teacher.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(learner);
  expect(learner.getAttribute("aria-pressed")).toBe("true");
  expect(teacher.getAttribute("aria-pressed")).toBe("false");
});
