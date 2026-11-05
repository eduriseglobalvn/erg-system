import { describe, expect, test } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor";
import { createQuizDraftFromBankQuestions, type CreateQuizFromBankOptions } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion, QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import { applyQuizPackageDraft, quizQuestionSlides, readQuizPackageDraft } from "./quiz-package-draft";

const base: QuestionBankQuestion = {
  answer: "A", categoryId: "topic-a", categoryLabel: "Topic A", choices: [], difficulty: "core", gradeLabel: "Grade 6",
  id: "qb-a", lastUsedAt: "", levelId: "level-a", levelLabel: "Level A", masteryRate: 0, objective: "", recommendedCluster: "",
  schoolsUsing: 0, scope: { type: "global" }, status: "ready", stem: "Question", subjectId: "subject-a", subjectLabel: "Subject A",
  tags: [], type: "multiple-response", usageCount: 0,
};
const questions = ["qb-a", "qb-b", "qb-c"].map((id) => ({ ...base, id }));
const quiz = { id: "quiz-a", title: "Quiz A", kind: "test" } as QuizBankItem;

function doc(options: CreateQuizFromBankOptions = {}): QuizEditorDraftDocument {
  return { quizId: "quiz-a", draftId: "draft-a", docVersion: 4, ...createQuizDraftFromBankQuestions(questions, options) };
}
const points = (tree: QuizEditorDraftDocument["tree"]) => quizQuestionSlides(tree).map((slide) => slide.questionSetSettings?.points);

describe("quiz package draft", () => {
  test("reads an equal split, time limit, partial credit and theme back from the draft", () => {
    const draft = readQuizPackageDraft(doc({ timeLimitMinutes: 25, acceptPartial: true, passingRate: 70 }), quiz);
    expect(draft).toMatchObject({ title: "Quiz A", kind: "test", pointsMode: "equal", questionPoints: {}, timeLimitEnabled: true, timeLimitMinutes: 25, acceptPartial: true, passingRate: 70 });
  });

  test("reads custom points keyed by bank question", () => {
    const draft = readQuizPackageDraft(doc({ pointsMode: "custom", questionPoints: { "qb-a": 2, "qb-b": 3, "qb-c": 5 } }), quiz);
    expect(draft.pointsMode).toBe("custom");
    expect(draft.questionPoints).toEqual({ "qb-a": 2, "qb-b": 3, "qb-c": 5 });
  });

  test("writes custom points, back to an equal split, and leaves untouched slide options alone", () => {
    const saved = doc();
    const custom = applyQuizPackageDraft(saved, quiz, { ...readQuizPackageDraft(saved, quiz), pointsMode: "custom", questionPoints: { "qb-a": 4, "qb-b": 4, "qb-c": 2 } });
    expect(points(custom.tree)).toEqual([4, 4, 2]);
    expect(quizQuestionSlides(custom.tree)[0]?.options?.acceptPartial).toBe(false);

    const customDoc = { ...saved, ...custom };
    const equal = applyQuizPackageDraft(customDoc, quiz, { ...readQuizPackageDraft(customDoc, quiz), pointsMode: "equal", questionPoints: {} });
    expect(points(equal.tree)).toEqual([333.34, 333.33, 333.33]);
  });

  test("writes title, time limit, shuffle and partial credit into settings and slides", () => {
    const saved = doc({ timeLimitMinutes: 0 });
    const next = applyQuizPackageDraft(saved, quiz, { ...readQuizPackageDraft(saved, quiz), title: "  New  ", timeLimitEnabled: true, timeLimitMinutes: 15, shuffleQuestions: true, acceptPartial: true });
    expect(next.settings.info.title).toBe("New");
    expect(next.settings.settings).toMatchObject({ enableTimeLimit: true, timeLimit: "15:00", randomizeQuestionOrder: true });
    expect(quizQuestionSlides(next.tree).every((slide) => slide.options?.acceptPartial === true)).toBe(true);
  });
});
