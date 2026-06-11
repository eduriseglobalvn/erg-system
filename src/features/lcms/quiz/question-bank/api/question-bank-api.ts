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
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";

type QuestionBankWorkspaceInput = {
  tenantId?: string;
  search?: string;
  subjectId?: string;
  levelId?: string;
  topicId?: string;
  status?: string;
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
  subjects?: Array<{
    id: string;
    label?: string | null;
  }>;
  levels?: Array<{
    id: string;
    label?: string | null;
  }>;
  topics?: Array<{
    id: string;
    label?: string | null;
  }>;
  quizzes?: Array<{
    id: string;
    title?: string | null;
    status?: string | null;
  }>;
};

type QuestionBankQuestionDTO = {
  id: string;
  subjectId?: string | null;
  levelId?: string | null;
  topicId?: string | null;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  usageCount?: number | null;
  updatedAt?: string | null;
};

export type QuestionBankApiData = {
  questions: QuestionBankQuestion[];
  quizzes: QuizBankItem[];
  subjects: QuestionBankSubject[];
};

const QuestionBankWorkspaceDocument = `
query LcmsQuestionBankWorkspace($input: QuestionBankWorkspaceInput) {
  lcms {
    questionBankWorkspace(input: $input) {
      tenantId
      questions {
        items {
          id
          subjectId
          levelId
          topicId
          title
          type
          status
          usageCount
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
      }
      levels {
        id
        label
      }
      topics {
        id
        label
      }
      quizzes {
        id
        title
        status
      }
    }
  }
}
`;

export async function loadQuestionBankData(): Promise<QuestionBankApiData> {
  if (!hasApiBase()) return mockQuestionBankData();

  try {
    return mapWorkspace(await loadQuestionBankWorkspace({ tenantId: getDefaultTenantId(), page: 0, size: 50 }));
  } catch {
    return mockQuestionBankData();
  }
}

async function loadQuestionBankWorkspace(input: QuestionBankWorkspaceInput): Promise<QuestionBankWorkspaceDTO> {
  const workspaceInput = normalizeQuestionBankInput(input);
  const firstPage = await requestQuestionBankWorkspacePage(workspaceInput);
  const questionPage = firstPage.questions;
  if (!questionPage?.hasNext || questionPage.totalPages <= 1) return firstPage;

  const items = [...questionPage.items];
  for (let page = questionPage.page + 1; page < questionPage.totalPages; page += 1) {
    const nextPage = await requestQuestionBankWorkspacePage({ ...workspaceInput, page });
    items.push(...(nextPage.questions?.items ?? []));
  }

  return {
    ...firstPage,
    questions: {
      ...questionPage,
      hasNext: false,
      hasPrevious: false,
      items,
    },
  };
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
    page: Math.max(0, input.page ?? 0),
    size: Math.min(Math.max(input.size ?? 50, 1), 50),
    tenantId: input.tenantId ?? getDefaultTenantId(),
  };
}

function mapWorkspace(workspace: QuestionBankWorkspaceDTO): QuestionBankApiData {
  const questionItems = workspace.questions?.items ?? [];
  const subjects = buildWorkspaceSubjects(workspace, questionItems);

  const questions = questionItems.length ? questionItems.map((question, index) => mapQuestion(question, subjects, index)) : questionBankQuestions;
  const quizzes = workspace.quizzes?.length
    ? workspace.quizzes.map((quiz, index) => mapQuiz(quiz, subjects, questions, index))
    : quizBankItems;

  return {
    questions,
    quizzes,
    subjects: subjects.length ? subjects : questionBankSubjects,
  };
}

function buildWorkspaceSubjects(workspace: QuestionBankWorkspaceDTO, questions: QuestionBankQuestionDTO[]): QuestionBankSubject[] {
  const subjectOptions = collectOptions(
    workspace.subjects,
    questions.map((question) => question.subjectId),
    new Map(questionBankSubjects.map((subject) => [subject.id, subject.label])),
  );
  if (!subjectOptions.length) return questionBankSubjects;

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
    ? levelOptions.map((level) => ({
        id: level.id,
        label: level.label,
        description: level.label,
        categoryIds: topicOptions.map((topic) => topic.id),
      }))
    : fallbackSubject.levels;
  const categories = topicOptions.length
    ? levels.flatMap((level) =>
        topicOptions.map((topic) => ({
          id: topic.id,
          label: topic.label,
          levelId: level.id,
        })),
      )
    : fallbackSubject.categories;

  return subjectOptions.map((subject) => ({
    id: subject.id,
    label: subject.label,
    description: subject.label,
    companyScopeLabel: "Dung chung toan cong ty",
    levels,
    categories,
  }));
}

function collectOptions(
  graphQlOptions: Array<{ id: string; label?: string | null }> | undefined,
  fallbackIds: Array<string | null | undefined>,
  fallbackLabels: Map<string, string>,
) {
  const seen = new Set<string>();
  const options: Array<{ id: string; label: string }> = [];

  [...(graphQlOptions ?? []), ...fallbackIds.map((id) => (id ? { id, label: fallbackLabels.get(id) } : undefined))].forEach((option) => {
    if (!option?.id || seen.has(option.id)) return;
    seen.add(option.id);
    options.push({
      id: option.id,
      label: normalizeLabel(option.label, option.id, fallbackLabels.get(option.id)),
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
    scope: template.scope,
    subjectId: subject.id,
    subjectLabel: subject.label,
    levelId: level?.id ?? question.levelId ?? subject.levels[0]?.id ?? "level",
    levelLabel: level?.label ?? template.levelLabel,
    categoryId: category?.id ?? question.topicId ?? subject.categories[0]?.id ?? "topic",
    categoryLabel: category?.label ?? "Chu de",
    gradeLabel: template.gradeLabel || level?.label || subject.label,
    type: mapQuestionType(question.type ?? template.type),
    difficulty: template.difficulty,
    status: mapQuestionStatus(question.status ?? template.status),
    stem: question.title || `Cau hoi ${index + 1}`,
    objective: `${subject.label} - ${level?.label ?? "Level"}`,
    tags: Array.from(new Set([subject.label, level?.label, category?.label, ...template.tags].filter(Boolean))) as string[],
    masteryRate: template.masteryRate,
    usageCount: question.usageCount ?? template.usageCount,
    schoolsUsing: template.schoolsUsing,
    lastUsedAt: question.updatedAt ? formatDateLabel(question.updatedAt) : "Moi cap nhat",
    recommendedCluster: template.recommendedCluster || "ERG",
    rationale: template.rationale,
    answer: template.answer,
    choices: template.choices,
  };
}

function mapQuiz(
  quiz: NonNullable<QuestionBankWorkspaceDTO["quizzes"]>[number],
  subjects: QuestionBankSubject[],
  questions: QuestionBankQuestion[],
  index: number,
): QuizBankItem {
  const template = quizTemplateFor(quiz.id, index);
  const subject = subjects.find((item) => item.id === template.subjectId) ?? subjects[index % Math.max(subjects.length, 1)] ?? questionBankSubjects[0];
  const level = subject.levels.find((item) => item.id === template.levelId) ?? subject.levels[index % Math.max(subject.levels.length, 1)] ?? subject.levels[0];
  const questionIds = questions.filter((item) => item.subjectId === subject.id && item.levelId === level?.id).map((item) => item.id);
  const topicLabels = subject.categories
    .filter((category) => category.levelId === level?.id)
    .map((category) => category.label)
    .slice(0, 4);

  return {
    ...template,
    id: quiz.id || template.id,
    title: quiz.title?.trim() || template.title,
    kind: mapQuizKind(quiz.title ?? template.title, quiz.status ?? template.status),
    status: mapQuizStatus(quiz.status ?? template.status),
    subjectId: subject.id,
    subjectLabel: subject.label,
    levelId: level?.id ?? subject.levels[0]?.id ?? "level",
    levelLabel: level?.label ?? template.levelLabel,
    topicLabels: topicLabels.length ? topicLabels : template.topicLabels,
    questionIds: questionIds.length ? questionIds : template.questionIds,
    questionCount: questionIds.length || template.questionCount,
    durationLabel: template.durationLabel,
    scopeLabel: template.scopeLabel || subject.companyScopeLabel,
    sourceMode: template.sourceMode,
    ownerLabel: template.ownerLabel,
    updatedAt: template.updatedAt,
  };
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
