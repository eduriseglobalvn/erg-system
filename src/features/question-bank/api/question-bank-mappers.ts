import type {
  QuestionBankQuestion,
  QuestionBankStatus,
  QuestionBankSubject,
  QuizBankItem,
  QuizBankKind,
  QuizBankStatus,
} from "@/features/question-bank/types/question-bank-types";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { GraphQlPage } from "@/lib/graphql-client";

// Neutral defaults for fields the workspace payload does not carry. Never seeded with demo content.
const emptySubject: QuestionBankSubject = {
  id: "subject",
  label: "Môn học",
  description: "",
  companyScopeLabel: "Dùng chung toàn công ty",
  levels: [],
  categories: [],
};
const blankQuestion: QuestionBankQuestion = {
  id: "",
  scope: { type: "global" },
  subjectId: "",
  subjectLabel: "",
  levelId: "",
  levelLabel: "",
  categoryId: "",
  categoryLabel: "",
  gradeLabel: "",
  type: "multiple-choice",
  difficulty: "core",
  status: "ready",
  stem: "",
  objective: "",
  tags: [],
  masteryRate: 0,
  usageCount: 0,
  schoolsUsing: 0,
  lastUsedAt: "",
  recommendedCluster: "",
};
const blankQuiz: QuizBankItem = {
  id: "",
  scope: { type: "global" },
  title: "",
  kind: "train",
  status: "draft",
  subjectId: "",
  subjectLabel: "",
  levelId: "",
  levelLabel: "",
  topicLabels: [],
  questionIds: [],
  questionCount: 0,
  durationLabel: "",
  scopeLabel: "",
  sourceMode: "manual",
  ownerLabel: "",
  updatedAt: "",
};

export type QuestionBankWorkspaceDTO = {
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

export type QuestionBankOptionDTO = {
  id: string;
  label?: string | null;
  subjectId?: string | null;
  levelId?: string | null;
  description?: string | null;
  scopeLabel?: string | null;
  categoryIds?: string[] | null;
  questionCount?: number | null;
};

export type QuestionBankQuestionDTO = {
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

export function mapWorkspace(workspace: QuestionBankWorkspaceDTO) {
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
    new Map<string, string>(),
  );
  if (!subjectOptions.length) return [];

  const fallbackSubject = emptySubject;
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
        ...(topic.questionCount == null ? {} : { questionCount: topic.questionCount }),
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
  const options: Array<{ id: string; label: string; levelId?: string | null; subjectId?: string | null; description?: string | null; scopeLabel?: string | null; categoryIds?: string[] | null; questionCount?: number | null }> = [];

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
      questionCount: "questionCount" in option && typeof option.questionCount === "number" ? option.questionCount : null,
    });
  });

  return options;
}

function mapQuestion(question: QuestionBankQuestionDTO, subjects: QuestionBankSubject[], index: number): QuestionBankQuestion {
  const template = blankQuestion;
  const subject = subjects.find((item) => item.id === (question.subjectId ?? template.subjectId)) ?? subjects[0] ?? emptySubject;
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
    subjectLabel: readableLabel(question.subjectLabel, question.subjectId) || subject.label,
    levelId: level?.id ?? question.levelId ?? subject.levels[0]?.id ?? "level",
    levelLabel: readableLabel(question.levelLabel, question.levelId) || level?.label || template.levelLabel,
    categoryId: category?.id ?? question.topicId ?? subject.categories[0]?.id ?? "topic",
    categoryLabel: readableLabel(question.categoryLabel, question.topicId) || category?.label || "Chu de",
    gradeLabel: readableLabel(question.gradeLabel, question.levelId, question.subjectId) || level?.label || subject.label,
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

/** The API falls back to the id when a label is missing; an id is not a label. */
function readableLabel(label: string | null | undefined, ...ids: (string | null | undefined)[]) {
  const value = label?.trim();
  return value && !ids.includes(value) ? value : "";
}

function mapQuiz(
  quiz: NonNullable<QuestionBankWorkspaceDTO["quizzes"]>[number],
  subjects: QuestionBankSubject[],
  questions: QuestionBankQuestion[],
  index: number,
): QuizBankItem {
  const template = blankQuiz;
  const subject =
    subjects.find((item) => item.id === (quiz.subjectId ?? template.subjectId)) ??
    subjects[index % Math.max(subjects.length, 1)] ??
    emptySubject;
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
