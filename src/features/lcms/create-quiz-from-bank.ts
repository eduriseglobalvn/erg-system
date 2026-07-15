import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  createQuizDraftFromBankQuestions,
  type CreateQuizFromBankOptions,
} from "@/features/lcms/quiz/question-bank/api/question-bank-to-quiz";
import type {
  QuizEditorCreateResult,
  QuizEditorSaveDraftResult,
} from "@/features/lcms/quiz/quiz-editor";

type CreateQuizFromBankDependencies = {
  createQuiz: (input: {
    title: string;
    subtitle?: string;
    kind: "train" | "test";
    subjectId?: string;
    levelId?: string;
    categoryId?: string;
    questionIds?: string[];
    idempotencyKey: string;
  }) => Promise<QuizEditorCreateResult>;
  createIdempotencyKey: (prefix: string) => string;
  hasApiBase: () => boolean;
  navigate: (path: string) => void;
  saveDraft: (input: {
    quizId: string;
    docVersion?: number | null;
    settings: ReturnType<typeof createQuizDraftFromBankQuestions>["settings"];
    playerTemplate: ReturnType<typeof createQuizDraftFromBankQuestions>["playerTemplate"];
    tree: ReturnType<typeof createQuizDraftFromBankQuestions>["tree"];
  }) => Promise<QuizEditorSaveDraftResult>;
  setPendingQuestionImports: (questions: QuestionBankQuestion[]) => void;
  toastError: (message: string) => void;
  toastSuccess: (message: string) => void;
};

export async function createQuizFromBankQuestions(
  questions: QuestionBankQuestion[],
  dependencies: CreateQuizFromBankDependencies,
  options: CreateQuizFromBankOptions = {},
) {
  if (!questions.length) return;

  if (!dependencies.hasApiBase()) {
    dependencies.setPendingQuestionImports(questions);
    dependencies.navigate("/quiz-editor");
    return;
  }

  const firstQuestion = questions[0]!;
  const title = options.title?.trim() || `${firstQuestion.subjectLabel} - ${firstQuestion.levelLabel}`;
  const draft = createQuizDraftFromBankQuestions(questions, { ...options, title });
  const created = await dependencies
    .createQuiz({
      title,
      subtitle: firstQuestion.categoryLabel,
      kind: options.kind ?? "train",
      subjectId: firstQuestion.subjectId,
      levelId: firstQuestion.levelId,
      categoryId: firstQuestion.categoryId,
      questionIds: questions.map((question) => question.id),
      idempotencyKey: dependencies.createIdempotencyKey("quiz-editor-create"),
    })
    .catch((error: unknown) => {
      dependencies.toastError(error instanceof Error ? error.message : "Cannot create quiz from selected questions.");
      return null;
    });

  if (!created) return;

  const saved = await dependencies
    .saveDraft({
      quizId: created.quizId,
      docVersion: created.docVersion,
      settings: draft.settings,
      playerTemplate: draft.playerTemplate,
      tree: draft.tree,
    })
    .catch((error: unknown) => {
      dependencies.toastError(error instanceof Error ? error.message : "Cannot create quiz from selected questions.");
      return null;
    });

  if (!saved) return;

  dependencies.navigate(`/quiz-editor?quizId=${encodeURIComponent(created.quizId)}`);
  dependencies.toastSuccess("Created assignment package from selected questions.");
}

export type { CreateQuizFromBankOptions };
