import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import { enCopy } from "./question-bank-copy";
import { QuizBankPanel } from "./quiz-bank-panel";

const quiz = (id: string, status: QuizBankItem["status"]): QuizBankItem => ({
  id, status, scope: { type: "global" }, title: `Quiz ${id}`, kind: "train", subjectId: "s", subjectLabel: "IC3",
  levelId: "l", levelLabel: "Level 1", topicLabels: [], questionIds: [], questionCount: 2, durationLabel: "",
  scopeLabel: "", sourceMode: "manual", ownerLabel: "", updatedAt: "",
});

function renderPanel(quizzes: QuizBankItem[], onPublishQuiz = vi.fn()) {
  const noop = vi.fn();
  render(
    <QuizBankPanel
      activeLevel={{ id: "l", label: "Level 1", description: "", categoryIds: [] }}
      activeSubject={{ id: "s", label: "IC3", description: "", companyScopeLabel: "", levels: [], categories: [] }}
      contentScope={{ type: "global" }}
      copy={enCopy}
      isLoading={false}
      kindCounts={{ all: quizzes.length, train: quizzes.length, test: 0 }}
      onCreateQuiz={noop} onDeleteQuiz={noop} onExportPortable={noop} onKindChange={noop} onLevelChange={noop}
      onPreviewQuiz={noop} onPublishQuiz={onPublishQuiz} onSearchChange={noop} onSubjectChange={noop}
      quizKind="all" quizzes={quizzes} searchValue="" subjects={[]} title="Bài tập"
    />,
  );
  return onPublishQuiz;
}

it("offers Publish for a draft and publishes that quiz", () => {
  const onPublishQuiz = renderPanel([quiz("a", "draft")]);
  fireEvent.click(screen.getByRole("button", { name: enCopy.moreActions("Quiz a") }));
  fireEvent.click(screen.getByRole("menuitem", { name: enCopy.publishQuiz }));
  expect(onPublishQuiz).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
});

it("does not offer Publish for a published quiz", () => {
  renderPanel([quiz("b", "ready")]);
  fireEvent.click(screen.getByRole("button", { name: enCopy.moreActions("Quiz b") }));
  expect(screen.queryByRole("menuitem", { name: enCopy.publishQuiz })).toBeNull();
  expect(screen.getByRole("menuitem", { name: enCopy.exportPortableAction })).toBeTruthy();
});
