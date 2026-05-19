import {
  questionBankQuestions,
  questionBankSubjects,
  quizBankItems,
} from "@/features/question-bank/api/mock-question-bank";
import type {
  QuestionBankCategory,
  QuestionBankChoice,
  QuestionBankDifficulty,
  QuestionBankQuestion,
  QuestionBankStatus,
  QuestionBankSubject,
  QuizBankItem,
  QuizBankKind,
  QuizBankStatus,
} from "@/features/question-bank/types/question-bank-types";
import type { QuestionType } from "@/features/quiz-editor/types/quiz-editor-types";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import type { ContentScope } from "@/types/scope-types";

type LmsList<T> = {
  items?: T[];
  total?: number;
};

type SubjectDTO = {
  id: string;
  name: string;
  code?: string;
  scope?: ContentScopeDTO;
  status?: string;
};

type CategoryDTO = {
  id: string;
  type?: "level" | "topic" | string;
  subjectId?: string;
  levelId?: string;
  parentId?: string;
  name: string;
  code?: string;
  order?: number;
};

type ContentScopeDTO = {
  centerId?: string;
  type?: string;
};

type QuestionDTO = {
  id: string;
  scope?: ContentScopeDTO;
  subjectId: string;
  levelId: string;
  topicId?: string;
  kind?: string;
  type?: string;
  stem: string;
  choices?: QuestionBankChoice[];
  answer?: unknown;
  metadata?: Record<string, unknown>;
  status?: string;
  updatedAt?: string;
};

type QuizDTO = {
  id: string;
  scope?: ContentScopeDTO;
  title: string;
  kind?: string;
  subjectId: string;
  levelId: string;
  topicIds?: string[];
  questionIds?: string[];
  status?: string;
  updatedAt?: string;
};

export type QuestionBankApiData = {
  questions: QuestionBankQuestion[];
  quizzes: QuizBankItem[];
  subjects: QuestionBankSubject[];
};

export async function loadQuestionBankData(): Promise<QuestionBankApiData> {
  if (!hasApiBase()) return mockQuestionBankData();

  try {
    const subjectsResponse = await apiRequest<LmsList<SubjectDTO>>("/api/lms/question-bank/subjects");
    const subjectDTOs = asItems(subjectsResponse);
    if (!subjectDTOs.length) return mockQuestionBankData();

    const subjects = await Promise.all(subjectDTOs.map(loadSubjectStructure));
    const subjectLookup = new Map(subjects.map((subject) => [subject.id, subject]));
    const questionDTOs = asItems(
      await apiRequest<LmsList<QuestionDTO>>("/api/lms/question-bank/questions?limit=200"),
    );
    const questions = questionDTOs.map((question) => mapQuestion(question, subjectLookup));
    const quizzes = asItems(await apiRequest<LmsList<QuizDTO>>("/api/lms/quiz-bank?limit=100")).map((quiz) =>
      mapQuiz(quiz, subjectLookup),
    );

    return {
      questions: questions.length ? questions : questionBankQuestions,
      quizzes: quizzes.length ? quizzes : quizBankItems,
      subjects: subjects.length ? subjects : questionBankSubjects,
    };
  } catch {
    return mockQuestionBankData();
  }
}

async function loadSubjectStructure(subject: SubjectDTO): Promise<QuestionBankSubject> {
  const levelDTOs = asItems(
    await apiRequest<LmsList<CategoryDTO>>(`/api/lms/question-bank/categories?subjectId=${encodeURIComponent(subject.id)}`),
  ).filter((item) => item.type !== "topic");

  const topicGroups = await Promise.all(
    levelDTOs.map(async (level) => ({
      level,
      topics: asItems(
        await apiRequest<LmsList<CategoryDTO>>(`/api/lms/question-bank/categories?levelId=${encodeURIComponent(level.id)}`),
      ).filter((item) => item.type !== "level"),
    })),
  );
  const categories: QuestionBankCategory[] = topicGroups.flatMap(({ level, topics }) =>
    topics.map((topic) => ({
      id: topic.id,
      label: topic.name,
      levelId: topic.levelId || level.id,
    })),
  );

  return {
    id: subject.id,
    label: subject.name,
    description: subject.code || subject.name,
    companyScopeLabel: subject.scope?.type === "global" ? "Toan ERG" : "Theo co so",
    levels: topicGroups.map(({ level, topics }) => ({
      id: level.id,
      label: level.name,
      description: level.code || level.name,
      categoryIds: topics.map((topic) => topic.id),
    })),
    categories,
  };
}

function mapQuestion(question: QuestionDTO, subjects: Map<string, QuestionBankSubject>): QuestionBankQuestion {
  const subject = subjects.get(question.subjectId) ?? questionBankSubjects[0];
  const level = subject.levels.find((item) => item.id === question.levelId) ?? subject.levels[0];
  const category = subject.categories.find((item) => item.id === question.topicId) ?? subject.categories[0];
  const metadata = question.metadata ?? {};

  return {
    id: question.id,
    scope: mapScope(question.scope),
    subjectId: subject.id,
    subjectLabel: subject.label,
    levelId: level?.id ?? question.levelId,
    levelLabel: level?.label ?? "Level",
    categoryId: category?.id ?? question.topicId ?? "other",
    categoryLabel: category?.label ?? "Khac",
    gradeLabel: metadataString(metadata.gradeLabel, "ERG"),
    type: mapQuestionType(question.type || question.kind),
    difficulty: mapDifficulty(metadataString(metadata.difficulty, "core")),
    status: mapQuestionStatus(question.status),
    stem: question.stem,
    objective: metadataString(metadata.objective, "On tap kien thuc trong chu de."),
    tags: metadataStringArray(metadata.tags),
    masteryRate: metadataNumber(metadata.masteryRate, 0),
    usageCount: metadataNumber(metadata.usageCount, 0),
    schoolsUsing: metadataNumber(metadata.schoolsUsing, 0),
    lastUsedAt: question.updatedAt ? formatDateLabel(question.updatedAt) : "Moi cap nhat",
    recommendedCluster: metadataString(metadata.recommendedCluster, "ERG"),
    rationale: metadataString(metadata.rationale, ""),
    answer: typeof question.answer === "string" ? question.answer : undefined,
    choices: question.choices,
  };
}

function mapQuiz(quiz: QuizDTO, subjects: Map<string, QuestionBankSubject>): QuizBankItem {
  const subject = subjects.get(quiz.subjectId) ?? questionBankSubjects[0];
  const level = subject.levels.find((item) => item.id === quiz.levelId) ?? subject.levels[0];
  const topicLabels = (quiz.topicIds ?? [])
    .map((topicId) => subject.categories.find((category) => category.id === topicId)?.label)
    .filter(Boolean) as string[];

  return {
    id: quiz.id,
    scope: mapScope(quiz.scope),
    title: quiz.title,
    kind: mapQuizKind(quiz.kind),
    status: mapQuizStatus(quiz.status),
    subjectId: subject.id,
    subjectLabel: subject.label,
    levelId: level?.id ?? quiz.levelId,
    levelLabel: level?.label ?? "Level",
    topicLabels,
    questionIds: quiz.questionIds ?? [],
    questionCount: quiz.questionIds?.length ?? 0,
    durationLabel: "20 phut",
    scopeLabel: quiz.scope?.type === "global" ? "Toan ERG" : "Theo co so",
    sourceMode: "manual",
    ownerLabel: "ERG",
    updatedAt: quiz.updatedAt ? formatDateLabel(quiz.updatedAt) : "Moi cap nhat",
  };
}

function asItems<T>(response: LmsList<T> | T[] | undefined): T[] {
  if (Array.isArray(response)) return response;
  return response?.items ?? [];
}

function mapScope(scope?: ContentScopeDTO): ContentScope {
  if (!scope || scope.type === "global") return { type: "global" };
  return { type: "center", centerId: scope.centerId || "center", centerName: "Co so dang chon" };
}

function mapQuestionType(value?: string): QuestionType {
  switch (value) {
    case "multiple_choice":
    case "multiple-response":
      return "multiple-response";
    case "true_false":
      return "true-false";
    case "short_answer":
      return "short-answer";
    case "ordering":
      return "sequence";
    case "matching":
      return "matching";
    case "essay":
      return "essay";
    default:
      return "multiple-choice";
  }
}

function mapDifficulty(value: string): QuestionBankDifficulty {
  if (value === "stretch" || value === "challenge") return value;
  return "core";
}

function mapQuestionStatus(value?: string): QuestionBankStatus {
  if (value === "reviewing" || value === "pilot") return value;
  return "ready";
}

function mapQuizKind(value?: string): QuizBankKind {
  return value === "test" ? "test" : "train";
}

function mapQuizStatus(value?: string): QuizBankStatus {
  if (value === "draft" || value === "reviewing") return value;
  return "ready";
}

function metadataString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function metadataNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function metadataStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Moi cap nhat";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mockQuestionBankData(): QuestionBankApiData {
  return {
    questions: questionBankQuestions,
    quizzes: quizBankItems,
    subjects: questionBankSubjects,
  };
}
