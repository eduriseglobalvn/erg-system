import {
  questionBankQuestions,
  questionBankSubjects,
  quizBankItems,
} from "@/features/lcms/quiz/question-bank/api/mock-question-bank";
import type {
  QuestionBankQuestion,
  QuestionBankStatus,
  QuestionBankSubject,
  QuizBankItem,
  QuizBankKind,
  QuizBankStatus,
} from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";

export type QuestionBankWorkspaceInput = {
  tenantId?: string;
  search?: string;
  subjectId?: string;
  levelId?: string;
  topicId?: string;
  status?: string;
  quizKind?: string;
  includeQuestions?: boolean;
  page?: number;
  size?: number;
};

type QuestionBankWorkspaceResponse = {
  lcms: {
    questionBankWorkspace: QuestionBankWorkspaceDTO;
  };
};

type QuestionBankWorkspaceDTO = {
  tenantId?: string | null;
  questions?: GraphQlPage<QuestionBankQuestionDTO>;
  subjects?: QuestionBankOptionDTO[];
  levels?: QuestionBankOptionDTO[];
  topics?: QuestionBankOptionDTO[];
  quizzes?: Array<{
    id: string;
    title?: string | null;
    status?: string | null;
    kind?: string | null;
    subjectId?: string | null;
    levelId?: string | null;
    categoryId?: string | null;
    questionIds?: string[] | null;
    questionCount?: number | null;
    durationLabel?: string | null;
    scopeLabel?: string | null;
    sourceMode?: string | null;
    ownerLabel?: string | null;
    updatedAt?: string | null;
  }>;
};

type QuestionBankOptionDTO = {
  id: string;
  label?: string | null;
  subjectId?: string | null;
  levelId?: string | null;
  description?: string | null;
  scopeLabel?: string | null;
  categoryIds?: string[] | null;
};

type QuestionBankQuestionDTO = {
  id: string;
  scopeType?: string | null;
  scopeId?: string | null;
  scopeLabel?: string | null;
  subjectId?: string | null;
  subjectLabel?: string | null;
  levelId?: string | null;
  levelLabel?: string | null;
  topicId?: string | null;
  categoryLabel?: string | null;
  gradeLabel?: string | null;
  title?: string | null;
  objective?: string | null;
  type?: string | null;
  difficulty?: string | null;
  status?: string | null;
  tags?: string[] | null;
  choices?: Array<{
    id: string;
    label?: string | null;
    correct?: boolean | null;
  }> | null;
  answer?: string | null;
  masteryRate?: number | null;
  usageCount?: number | null;
  schoolsUsing?: number | null;
  lastUsedAt?: string | null;
  recommendedCluster?: string | null;
  rationale?: string | null;
  updatedAt?: string | null;
};

export type QuestionBankApiData = {
  questions: QuestionBankQuestion[];
  questionPage: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  quizzes: QuizBankItem[];
  subjects: QuestionBankSubject[];
};

export type QuestionBankSaveQuestionInput = {
  questionId?: string;
  scopeType?: "global" | "center" | "school";
  scopeId?: string | null;
  subjectId: string;
  levelId: string;
  topicId: string;
  categoryId?: string | null;
  type?: QuestionType | string;
  stem: string;
  objective?: string | null;
  difficulty?: QuestionBankQuestion["difficulty"];
  status?: QuestionBankStatus | "draft" | "archived";
  tags?: string[];
  choices?: QuestionBankQuestion["choices"];
  answer?: unknown;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type QuestionBankSaveQuestionResult = {
  questionId: string;
  status: string;
};

export type QuestionBankDeleteQuestionResult = {
  questionId: string;
  archived: boolean;
};

const QuestionBankWorkspaceDocument = `
query LcmsQuestionBankWorkspace($input: QuestionBankWorkspaceInput) {
  lcms {
    questionBankWorkspace(input: $input) {
      tenantId
      questions {
        items {
          id
          scopeType
          scopeId
          scopeLabel
          subjectId
          subjectLabel
          levelId
          levelLabel
          topicId
          categoryLabel
          gradeLabel
          title
          objective
          type
          difficulty
          status
          tags
          choices {
            id
            label
            correct
          }
          answer
          masteryRate
          usageCount
          schoolsUsing
          lastUsedAt
          recommendedCluster
          rationale
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      subjects {
        id
        label
        subjectId
        levelId
        description
        scopeLabel
        categoryIds
      }
      levels {
        id
        label
        subjectId
        levelId
        description
        scopeLabel
        categoryIds
      }
      topics {
        id
        label
        subjectId
        levelId
        description
        scopeLabel
        categoryIds
      }
      quizzes {
        id
        title
        status
        kind
        subjectId
        levelId
        categoryId
        questionIds
        questionCount
        durationLabel
        scopeLabel
        sourceMode
        ownerLabel
        updatedAt
      }
    }
  }
}
`;

export async function loadQuestionBankData(
  tenantId: string = getDefaultTenantId(),
  filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
): Promise<QuestionBankApiData> {
  if (!hasApiBase()) return mockQuestionBankData();
  return mapWorkspace(await loadQuestionBankWorkspace({ ...filters, tenantId, page: filters.page ?? 0, size: filters.size ?? 50 }));
}

export async function createQuestionBankQuestion(input: QuestionBankSaveQuestionInput): Promise<QuestionBankSaveQuestionResult> {
  return saveQuestionBankQuestion(input, "POST", "/api/v1/lcms/questions");
}

export async function updateQuestionBankQuestion(input: QuestionBankSaveQuestionInput): Promise<QuestionBankSaveQuestionResult> {
  if (!input.questionId) {
    throw new Error("questionId is required to update a question.");
  }
  return saveQuestionBankQuestion(input, "PUT", `/api/v1/lcms/questions/${input.questionId}`);
}

export async function deleteQuestionBankQuestion(questionId: string): Promise<QuestionBankDeleteQuestionResult> {
  return apiRequest<QuestionBankDeleteQuestionResult>(`/api/v1/lcms/questions/${questionId}`, {
    method: "DELETE",
    portal: "lcms",
  });
}

async function saveQuestionBankQuestion(
  input: QuestionBankSaveQuestionInput,
  method: "POST" | "PUT",
  path: string,
): Promise<QuestionBankSaveQuestionResult> {
  return apiRequest<QuestionBankSaveQuestionResult>(path, {
    body: JSON.stringify({
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      subjectId: input.subjectId,
      levelId: input.levelId,
      topicId: input.topicId,
      categoryId: input.categoryId,
      type: input.type,
      stem: input.stem,
      objective: input.objective,
      difficulty: input.difficulty,
      status: input.status,
      tags: input.tags,
      choices: input.choices,
      answer: input.answer,
      content: input.content,
      settings: input.settings,
      metadata: input.metadata,
    }),
    method,
    portal: "lcms",
  });
}

async function loadQuestionBankWorkspace(input: QuestionBankWorkspaceInput): Promise<QuestionBankWorkspaceDTO> {
  return requestQuestionBankWorkspacePage(normalizeQuestionBankInput(input));
}

async function requestQuestionBankWorkspacePage(input: QuestionBankWorkspaceInput) {
  const response = await graphQlRequest<QuestionBankWorkspaceResponse, { input: QuestionBankWorkspaceInput }>({
    operationName: "LcmsQuestionBankWorkspace",
    portal: "lcms",
    query: QuestionBankWorkspaceDocument,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: {
      input,
    },
  });

  return response.lcms.questionBankWorkspace;
}

function normalizeQuestionBankInput(input: QuestionBankWorkspaceInput): QuestionBankWorkspaceInput {
  return {
    ...input,
    ...(input.includeQuestions === undefined ? {} : { includeQuestions: input.includeQuestions }),
    page: Math.max(0, input.page ?? 0),
    quizKind: input.quizKind?.trim() || undefined,
    search: input.search?.trim() || undefined,
    size: Math.min(Math.max(input.size ?? 50, 1), 50),
    tenantId: input.tenantId ?? getDefaultTenantId(),
  };
}

function mapWorkspace(workspace: QuestionBankWorkspaceDTO): QuestionBankApiData {
  const questionPage = workspace.questions;
  const questionItems = questionPage?.items ?? [];
  const subjects = buildWorkspaceSubjects(workspace, questionItems);

  const questions = questionItems.map((question, index) => mapQuestion(question, subjects, index));
  const quizzes = workspace.quizzes?.length
    ? workspace.quizzes.map((quiz, index) => mapQuiz(quiz, subjects, questions, index))
    : [];

  return {
    questions,
    questionPage: {
      page: questionPage?.page ?? 0,
      size: questionPage?.size ?? 50,
      totalItems: questionPage?.totalItems ?? questions.length,
      totalPages: questionPage?.totalPages ?? (questions.length ? 1 : 0),
      hasNext: Boolean(questionPage?.hasNext),
      hasPrevious: Boolean(questionPage?.hasPrevious),
    },
    quizzes,
    subjects,
  };
}

function buildWorkspaceSubjects(workspace: QuestionBankWorkspaceDTO, questions: QuestionBankQuestionDTO[]): QuestionBankSubject[] {
  const subjectOptions = collectOptions(
    workspace.subjects,
    questions.map((question) => question.subjectId),
    new Map(questionBankSubjects.map((subject) => [subject.id, subject.label])),
  );
  if (!subjectOptions.length) return [];

  const fallbackSubject = questionBankSubjects[0];
  const levelOptions = collectOptions(
    workspace.levels,
    questions.map((question) => question.levelId),
    new Map(fallbackSubject.levels.map((level) => [level.id, level.label])),
  );
  const topicOptions = collectOptions(
    workspace.topics,
    questions.map((question) => question.topicId),
    new Map(fallbackSubject.categories.map((category) => [category.id, category.label])),
  );
  const levels = levelOptions.length
    ? levelOptions.map((level) => {
        const categoryIds = topicOptions
          .filter((topic) => !topic.levelId || topic.levelId === level.id)
          .map((topic) => topic.id);
        return {
          id: level.id,
          label: level.label,
          description: level.description?.trim() || level.label,
          categoryIds: level.categoryIds?.length ? level.categoryIds : categoryIds,
        };
      })
    : fallbackSubject.levels;
  const categories = topicOptions.length
    ? topicOptions.map((topic) => ({
        id: topic.id,
        label: topic.label,
        levelId: topic.levelId ?? levels[0]?.id ?? "level",
      }))
    : fallbackSubject.categories;

  return subjectOptions.map((subject) => {
    const subjectLevels = levels.filter((level) => {
      const sourceLevel = levelOptions.find((item) => item.id === level.id);
      return !sourceLevel?.subjectId || sourceLevel.subjectId === subject.id;
    });
    const effectiveLevels = subjectLevels.length ? subjectLevels : levels;
    const effectiveLevelIds = new Set(effectiveLevels.map((level) => level.id));

    return {
      id: subject.id,
      label: subject.label,
      description: subject.description?.trim() || subject.label,
      companyScopeLabel: subject.scopeLabel?.trim() || "Dung chung toan cong ty",
      levels: effectiveLevels,
      categories: categories.filter((category) => !effectiveLevelIds.size || effectiveLevelIds.has(category.levelId)),
    };
  });
}

function collectOptions(
  graphQlOptions: QuestionBankOptionDTO[] | undefined,
  fallbackIds: Array<string | null | undefined>,
  fallbackLabels: Map<string, string>,
) {
  const seen = new Set<string>();
  const options: Array<{ id: string; label: string; levelId?: string | null; subjectId?: string | null; description?: string | null; scopeLabel?: string | null; categoryIds?: string[] | null }> = [];

  [...(graphQlOptions ?? []), ...fallbackIds.map((id) => (id ? { id, label: fallbackLabels.get(id) } : undefined))].forEach((option) => {
    if (!option?.id || seen.has(option.id)) return;
    seen.add(option.id);
    options.push({
      id: option.id,
      label: normalizeLabel(option.label, option.id, fallbackLabels.get(option.id)),
      levelId: "levelId" in option ? option.levelId : null,
      subjectId: "subjectId" in option ? option.subjectId : null,
      description: "description" in option ? option.description : null,
      scopeLabel: "scopeLabel" in option ? option.scopeLabel : null,
      categoryIds: "categoryIds" in option && Array.isArray(option.categoryIds) ? option.categoryIds : null,
    });
  });

  return options;
}

function mapQuestion(question: QuestionBankQuestionDTO, subjects: QuestionBankSubject[], index: number): QuestionBankQuestion {
  const template = questionTemplateFor(question.id, index);
  const subject = subjects.find((item) => item.id === (question.subjectId ?? template.subjectId)) ?? subjects[0] ?? questionBankSubjects[0];
  const level = subject.levels.find((item) => item.id === (question.levelId ?? template.levelId)) ?? subject.levels[0];
  const category =
    subject.categories.find((item) => item.id === (question.topicId ?? template.categoryId) && item.levelId === level?.id) ??
    subject.categories.find((item) => item.id === (question.topicId ?? template.categoryId)) ??
    subject.categories[0];

  return {
    ...template,
    id: question.id || template.id,
    scope: mapQuestionScope(question, template.scope),
    subjectId: subject.id,
    subjectLabel: question.subjectLabel?.trim() || subject.label,
    levelId: level?.id ?? question.levelId ?? subject.levels[0]?.id ?? "level",
    levelLabel: question.levelLabel?.trim() || level?.label || template.levelLabel,
    categoryId: category?.id ?? question.topicId ?? subject.categories[0]?.id ?? "topic",
    categoryLabel: question.categoryLabel?.trim() || category?.label || "Chu de",
    gradeLabel: question.gradeLabel?.trim() || level?.label || subject.label,
    type: mapQuestionType(question.type ?? template.type),
    difficulty: mapQuestionDifficulty(question.difficulty ?? template.difficulty),
    status: mapQuestionStatus(question.status ?? template.status),
    stem: question.title || `Cau hoi ${index + 1}`,
    objective: question.objective?.trim() || template.objective || `${subject.label} - ${level?.label ?? "Level"}`,
    tags: question.tags?.length
      ? question.tags.filter((tag): tag is string => Boolean(tag?.trim()))
      : Array.from(new Set([subject.label, level?.label, category?.label, ...template.tags].filter(Boolean))) as string[],
    masteryRate: question.masteryRate ?? template.masteryRate,
    usageCount: question.usageCount ?? template.usageCount,
    schoolsUsing: question.schoolsUsing ?? template.schoolsUsing,
    lastUsedAt: question.lastUsedAt ? formatDateLabel(question.lastUsedAt) : question.updatedAt ? formatDateLabel(question.updatedAt) : "Moi cap nhat",
    recommendedCluster: question.recommendedCluster?.trim() || template.recommendedCluster || "ERG",
    rationale: question.rationale?.trim() || template.rationale,
    answer: question.answer ?? template.answer,
    settings: template.settings,
    choices: question.choices?.length
      ? question.choices.map((choice, choiceIndex) => ({
          id: choice.id || `choice-${choiceIndex + 1}`,
          label: choice.label?.trim() || `Choice ${choiceIndex + 1}`,
          correct: Boolean(choice.correct),
        }))
      : template.choices,
  };
}

function mapQuiz(
  quiz: NonNullable<QuestionBankWorkspaceDTO["quizzes"]>[number],
  subjects: QuestionBankSubject[],
  questions: QuestionBankQuestion[],
  index: number,
): QuizBankItem {
  const template = quizTemplateFor(quiz.id, index);
  const subject =
    subjects.find((item) => item.id === (quiz.subjectId ?? template.subjectId)) ??
    subjects[index % Math.max(subjects.length, 1)] ??
    questionBankSubjects[0];
  const level =
    subject.levels.find((item) => item.id === (quiz.levelId ?? template.levelId)) ??
    subject.levels[index % Math.max(subject.levels.length, 1)] ??
    subject.levels[0];
  const questionIds = Array.isArray(quiz.questionIds) ? quiz.questionIds.filter(Boolean) : [];
  const questionTopics = questions
    .filter((item) => questionIds.includes(item.id))
    .map((item) => item.categoryLabel);
  const topicLabels = subject.categories
    .filter((category) => category.levelId === level?.id && (!quiz.categoryId || category.id === quiz.categoryId))
    .map((category) => category.label)
    .slice(0, 4);

  return {
    ...template,
    id: quiz.id || template.id,
    title: quiz.title?.trim() || template.title,
    kind: mapQuizKind(quiz.kind ?? quiz.title ?? template.title, quiz.status ?? template.status),
    status: mapQuizStatus(quiz.status ?? template.status),
    subjectId: subject.id,
    subjectLabel: subject.label,
    levelId: level?.id ?? subject.levels[0]?.id ?? "level",
    levelLabel: level?.label ?? template.levelLabel,
    categoryId: quiz.categoryId ?? template.categoryId,
    topicLabels: Array.from(new Set(questionTopics.length ? questionTopics : topicLabels)),
    questionIds,
    questionCount: quiz.questionCount ?? questionIds.length,
    durationLabel: quiz.durationLabel?.trim() || template.durationLabel,
    scopeLabel: quiz.scopeLabel?.trim() || template.scopeLabel || subject.companyScopeLabel,
    sourceMode: mapSourceMode(quiz.sourceMode ?? template.sourceMode),
    ownerLabel: quiz.ownerLabel?.trim() || template.ownerLabel,
    updatedAt: quiz.updatedAt ? formatDateLabel(quiz.updatedAt) : template.updatedAt,
  };
}

function mapQuestionScope(question: QuestionBankQuestionDTO, fallback: QuestionBankQuestion["scope"]): QuestionBankQuestion["scope"] {
  const type = question.scopeType?.trim().toLowerCase();
  if (type === "center" || type === "school") {
    const centerId = question.scopeId?.trim() || "school";
    return {
      type: "center",
      centerId,
      centerName: question.scopeLabel?.trim() || centerId,
    };
  }
  if (type === "global") return { type: "global" };
  return fallback;
}

function questionTemplateFor(questionId: string, index: number) {
  return questionBankQuestions.find((question) => question.id === questionId) ?? questionBankQuestions[index % questionBankQuestions.length];
}

function quizTemplateFor(quizId: string, index: number) {
  return quizBankItems.find((quiz) => quiz.id === quizId) ?? quizBankItems[index % quizBankItems.length];
}

function normalizeLabel(value: string | null | undefined, id: string, fallback?: string) {
  if (value?.trim()) return value.trim();
  if (fallback?.trim()) return fallback.trim();
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapQuestionType(value?: string | null): QuestionType {
  switch (value) {
    case "multiple_choice":
    case "multiple-response":
    case "multiple_response":
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

function mapQuestionStatus(value?: string | null): QuestionBankStatus {
  if (value === "reviewing" || value === "pilot") return value;
  return "ready";
}

function mapQuestionDifficulty(value?: string | null) {
  if (value === "stretch" || value === "challenge") return value;
  return "core";
}

function mapQuizKind(title?: string | null, status?: string | null): QuizBankKind {
  const haystack = `${title ?? ""} ${status ?? ""}`.toLowerCase();
  if (haystack.includes("test") || haystack.includes("exam") || haystack.includes("kiem tra")) {
    return "test";
  }
  return "train";
}

function mapQuizStatus(value?: string | null): QuizBankStatus {
  if (value === "draft" || value === "reviewing") return value;
  return "ready";
}

function mapSourceMode(value?: string | null): QuizBankItem["sourceMode"] {
  return value === "auto-random" ? "auto-random" : "manual";
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Moi cap nhat";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function mockQuestionBankData(): QuestionBankApiData {
  return {
    questions: questionBankQuestions,
    questionPage: {
      page: 0,
      size: questionBankQuestions.length,
      totalItems: questionBankQuestions.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
    quizzes: quizBankItems,
    subjects: questionBankSubjects,
  };
}
