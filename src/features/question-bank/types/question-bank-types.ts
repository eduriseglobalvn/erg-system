import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { ContentScope } from "@/types/scope-types";

export type QuestionBankSubjectId = string;

export type QuestionBankDifficulty = "core" | "stretch" | "challenge";

export type QuestionBankStatus = "ready" | "reviewing" | "pilot";

export type QuizBankKind = "train" | "test";

export type QuizBankStatus = "ready" | "draft" | "reviewing";

export type QuestionBankChoice = {
  id: string;
  label: string;
  correct: boolean;
};

export type QuestionBankCategory = {
  id: string;
  label: string;
  levelId: string;
};

export type QuestionBankLevel = {
  id: string;
  label: string;
  description: string;
  categoryIds: string[];
};

export type QuestionBankSubject = {
  id: QuestionBankSubjectId;
  label: string;
  description: string;
  companyScopeLabel: string;
  levels: QuestionBankLevel[];
  categories: QuestionBankCategory[];
};

export type QuestionBankQuestion = {
  id: string;
  scope: ContentScope;
  subjectId: QuestionBankSubjectId;
  subjectLabel: string;
  levelId: string;
  levelLabel: string;
  categoryId: string;
  categoryLabel: string;
  gradeLabel: string;
  type: QuestionType;
  difficulty: QuestionBankDifficulty;
  status: QuestionBankStatus;
  stem: string;
  objective: string;
  tags: string[];
  masteryRate: number;
  usageCount: number;
  schoolsUsing: number;
  lastUsedAt: string;
  recommendedCluster: string;
  rationale?: string;
  answer?: string;
  choices?: QuestionBankChoice[];
  settings?: Record<string, unknown>;
};

export type QuizBankItem = {
  id: string;
  scope: ContentScope;
  title: string;
  kind: QuizBankKind;
  status: QuizBankStatus;
  subjectId: QuestionBankSubjectId;
  subjectLabel: string;
  levelId: string;
  levelLabel: string;
  categoryId?: string;
  topicLabels: string[];
  questionIds: string[];
  questionCount: number;
  durationLabel: string;
  scopeLabel: string;
  sourceMode: "manual" | "auto-random";
  ownerLabel: string;
  updatedAt: string;
};
