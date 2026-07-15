import { apiRequest, hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import { createMockPlayerTemplate, createMockQuizEditorGroups, createMockQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/mock-quiz-editor-project";
import type {
  QuizEditorGroup,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuizEditorWorkspaceInput = {
  search?: string;
  subjectId?: string;
  levelId?: string;
  categoryId?: string;
  status?: string;
  kind?: string;
  page?: number;
  size?: number;
  tenantId?: string;
};

export type QuizEditorSummary = {
  id: string;
  title: string;
  subtitle?: string | null;
  kind?: string | null;
  status?: string | null;
  subjectId?: string | null;
  levelId?: string | null;
  categoryId?: string | null;
  currentVersionLabel?: string | null;
  questionCount: number;
  updatedAt?: string | null;
};

export type QuizEditorOption = {
  id: string;
  label: string;
};

export type QuizEditorWorkspaceData = {
  tenantId: string;
  quizzes: GraphQlPage<QuizEditorSummary>;
  subjects: QuizEditorOption[];
  levels: QuizEditorOption[];
  categories: QuizEditorOption[];
};

export type QuizEditorDraftDocument = {
  quizId: string;
  draftId: string;
  docVersion: number;
  baseVersionLabel?: string | null;
  updatedAt?: string | null;
  settings: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  tree: QuizEditorGroup[];
};

export type QuizEditorCreateInput = {
  title: string;
  subtitle?: string;
  kind?: "train" | "test";
  subjectId?: string;
  levelId?: string;
  categoryId?: string;
  questionIds?: string[];
  idempotencyKey: string;
};

export type QuizEditorCreateResult = {
  quizId: string;
  draftId: string;
  docVersion: number;
};

export type QuizEditorDeleteResult = {
  quizId: string;
  deleted: boolean;
};

export type QuizEditorSaveDraftInput = {
  quizId: string;
  docVersion?: number | null;
  settings?: QuizProjectSettings;
  playerTemplate?: QuizPlayerTemplate;
  tree?: QuizEditorGroup[];
};

export type QuizEditorSaveDraftResult = {
  docVersion: number;
};

export type QuizEditorUpsertSlideInput = {
  quizId: string;
  docVersion?: number | null;
  groupId: string;
  slide: QuizEditorGroup["slides"][number];
  afterSlideId?: string | null;
};

export type QuizEditorReorderInput = {
  quizId: string;
  docVersion?: number | null;
  groups: Array<{
    groupId: string;
    slideIds: string[];
  }>;
};

export type QuizEditorValidationResult = {
  valid: boolean;
  errors: Array<{
    path: string;
    code: string;
    message: string;
  }>;
};

export type QuizEditorPublishInput = {
  quizId: string;
  docVersion?: number | null;
  gradingMode?: "client-first" | "server-authoritative";
  versionLabel?: string;
  idempotencyKey: string;
};

export type QuizEditorPublishResult = {
  quizVersionId: string;
  versionLabel: string;
  versionNumber: number;
  packageId?: string | null;
  contentHash?: string | null;
};

export type QuizEditorVersionSummary = {
  id: string;
  versionLabel: string;
  versionNumber: number;
  gradingMode?: string | null;
  contentHash?: string | null;
  publishedBy?: string | null;
  publishedAt?: string | null;
  isActive: boolean;
};

export type QuizEditorMediaPresignInput = {
  sha256: string;
  mimeType: string;
  byteSize: number;
  originalName?: string;
};

export type QuizEditorMediaPresignResult = {
  deduped: boolean;
  mediaId: string;
  url: string;
  uploadUrl?: string | null;
  storageKey?: string | null;
};

export type QuizEditorMediaCommitInput = {
  mediaId: string;
  width?: number;
  height?: number;
};

export type QuizEditorMediaCommitResult = {
  mediaId: string;
  url: string;
  width?: number | null;
  height?: number | null;
};

type QuizWorkspaceResponse = {
  lcms: {
    quizWorkspace: {
      tenantId?: string | null;
      quizzes: GraphQlPage<QuizEditorSummary>;
      subjects?: QuizEditorOption[];
      levels?: QuizEditorOption[];
      categories?: QuizEditorOption[];
    };
  };
};

type QuizDraftResponse = {
  lcms: {
    quizDraft: {
      quizId: string;
      draftId: string;
      docVersion: number;
      baseVersionLabel?: string | null;
      updatedAt?: string | null;
      settings?: string | null;
      playerTemplate?: string | null;
      tree?: string | null;
    };
  };
};

type QuizVersionsResponse = {
  lcms: {
    quizVersions: {
      quizId: string;
      items: QuizEditorVersionSummary[];
    };
  };
};

const QuizEditorWorkspaceDocument = `
query LcmsQuizWorkspace($input: QuizWorkspaceInput) {
  lcms {
    quizWorkspace(input: $input) {
      tenantId
      quizzes {
        items {
          id
          title
          subtitle
          kind
          status
          subjectId
          levelId
          categoryId
          currentVersionLabel
          questionCount
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      subjects { id label }
      levels { id label }
      categories { id label }
    }
  }
}
`;

const QuizDraftDocument = `
query LcmsQuizDraft($quizId: String!) {
  lcms {
    quizDraft(quizId: $quizId) {
      quizId
      draftId
      docVersion
      baseVersionLabel
      updatedAt
      settings
      playerTemplate
      tree
    }
  }
}
`;

const QuizVersionsDocument = `
query LcmsQuizVersions($quizId: String!) {
  lcms {
    quizVersions(quizId: $quizId) {
      quizId
      items {
        id
        versionLabel
        versionNumber
        gradingMode
        contentHash
        publishedBy
        publishedAt
        isActive
      }
    }
  }
}
`;

export async function loadQuizEditorWorkspace(input: QuizEditorWorkspaceInput = {}): Promise<QuizEditorWorkspaceData> {
  const tenantId = input.tenantId ?? getDefaultTenantId();
  if (!hasApiBase()) {
    return emptyWorkspace(tenantId);
  }

  const response = await graphQlRequest<QuizWorkspaceResponse, { input: QuizEditorWorkspaceInput }>({
    operationName: "LcmsQuizWorkspace",
    portal: "lcms",
    query: QuizEditorWorkspaceDocument,
    tenantId,
    variables: {
      input: {
        ...input,
        page: Math.max(0, input.page ?? 0),
        size: Math.min(Math.max(input.size ?? 20, 1), 50),
        tenantId,
      },
    },
  });
  const workspace = response.lcms.quizWorkspace;

  return {
    tenantId: workspace.tenantId ?? tenantId,
    quizzes: workspace.quizzes,
    subjects: workspace.subjects ?? [],
    levels: workspace.levels ?? [],
    categories: workspace.categories ?? [],
  };
}

export async function loadQuizEditorDraft(quizId: string): Promise<QuizEditorDraftDocument> {
  if (!hasApiBase()) {
    return mockDraft(quizId);
  }

  const response = await graphQlRequest<QuizDraftResponse, { quizId: string }>({
    operationName: "LcmsQuizDraft",
    portal: "lcms",
    query: QuizDraftDocument,
    variables: { quizId },
  });
  const draft = response.lcms.quizDraft;

  return {
    quizId: draft.quizId,
    draftId: draft.draftId,
    docVersion: draft.docVersion,
    baseVersionLabel: draft.baseVersionLabel,
    updatedAt: draft.updatedAt,
    settings: normalizeQuizProjectSettings(parseJson(draft.settings, null)),
    playerTemplate: normalizeQuizPlayerTemplate(parseJson(draft.playerTemplate, null)),
    tree: normalizeQuizEditorGroups(parseJson(draft.tree, null)),
  };
}

export async function loadQuizEditorVersions(quizId: string): Promise<QuizEditorVersionSummary[]> {
  if (!hasApiBase()) return [];

  const response = await graphQlRequest<QuizVersionsResponse, { quizId: string }>({
    operationName: "LcmsQuizVersions",
    portal: "lcms",
    query: QuizVersionsDocument,
    variables: { quizId },
  });

  return response.lcms.quizVersions.items;
}

export async function createQuizEditorQuiz(input: QuizEditorCreateInput): Promise<QuizEditorCreateResult> {
  return apiRequest<QuizEditorCreateResult>("/api/v1/lcms/quizzes", {
    body: JSON.stringify({
      title: input.title,
      subtitle: input.subtitle,
      kind: input.kind,
      subjectId: input.subjectId,
      levelId: input.levelId,
      categoryId: input.categoryId,
      questionIds: input.questionIds,
    }),
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
    },
    method: "POST",
    portal: "lcms",
  });
}

export async function deleteQuizEditorQuiz(quizId: string): Promise<QuizEditorDeleteResult> {
  return apiRequest<QuizEditorDeleteResult>(`/api/v1/lcms/quizzes/${quizId}`, {
    method: "DELETE",
    portal: "lcms",
  });
}

export async function saveQuizEditorDraft(input: QuizEditorSaveDraftInput): Promise<QuizEditorSaveDraftResult> {
  return apiRequest<QuizEditorSaveDraftResult>(`/api/v1/lcms/quizzes/${input.quizId}/draft`, {
    body: JSON.stringify({
      docVersion: input.docVersion,
      settings: input.settings,
      playerTemplate: input.playerTemplate,
      tree: input.tree,
    }),
    method: "PUT",
    portal: "lcms",
  });
}

export async function upsertQuizEditorSlide(input: QuizEditorUpsertSlideInput): Promise<QuizEditorSaveDraftResult> {
  return apiRequest<QuizEditorSaveDraftResult>(`/api/v1/lcms/quizzes/${input.quizId}/slides`, {
    body: JSON.stringify({
      afterSlideId: input.afterSlideId,
      docVersion: input.docVersion,
      groupId: input.groupId,
      slide: input.slide,
    }),
    method: "POST",
    portal: "lcms",
  });
}

export async function reorderQuizEditorSlides(input: QuizEditorReorderInput): Promise<QuizEditorSaveDraftResult> {
  return apiRequest<QuizEditorSaveDraftResult>(`/api/v1/lcms/quizzes/${input.quizId}/reorder`, {
    body: JSON.stringify({
      docVersion: input.docVersion,
      groups: input.groups,
    }),
    method: "POST",
    portal: "lcms",
  });
}

export async function validateQuizEditorDraft(quizId: string): Promise<QuizEditorValidationResult> {
  return apiRequest<QuizEditorValidationResult>(`/api/v1/lcms/quizzes/${quizId}/validate`, {
    method: "POST",
    portal: "lcms",
  });
}

export async function publishQuizEditorDraft(input: QuizEditorPublishInput): Promise<QuizEditorPublishResult> {
  return apiRequest<QuizEditorPublishResult>(`/api/v1/lcms/quizzes/${input.quizId}/publish`, {
    body: JSON.stringify({
      docVersion: input.docVersion,
      gradingMode: input.gradingMode,
      versionLabel: input.versionLabel,
    }),
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
    },
    method: "POST",
    portal: "lcms",
  });
}

export async function forkQuizEditorVersion(input: {
  quizId: string;
  versionId: string;
}): Promise<{ draftId: string; docVersion: number; baseVersionLabel?: string | null }> {
  return apiRequest(`/api/v1/lcms/quizzes/${input.quizId}/versions/${input.versionId}/fork`, {
    method: "POST",
    portal: "lcms",
  });
}

export async function presignQuizEditorMedia(input: QuizEditorMediaPresignInput): Promise<QuizEditorMediaPresignResult> {
  return apiRequest<QuizEditorMediaPresignResult>("/api/v1/lcms/media/presign", {
    body: JSON.stringify(input),
    method: "POST",
    portal: "lcms",
  });
}

export async function commitQuizEditorMedia(input: QuizEditorMediaCommitInput): Promise<QuizEditorMediaCommitResult> {
  return apiRequest<QuizEditorMediaCommitResult>(`/api/v1/lcms/media/${input.mediaId}/commit`, {
    body: JSON.stringify({
      mediaId: input.mediaId,
      width: input.width,
      height: input.height,
    }),
    method: "POST",
    portal: "lcms",
  });
}

export async function exportQuizEditorBundle(input: { quizId?: string; quizVersionId?: string }): Promise<unknown> {
  if (input.quizVersionId) {
    return apiRequest(`/api/v1/lcms/quiz-versions/${input.quizVersionId}/bundle`, {
      cache: "default",
      portal: "lcms",
    });
  }
  if (!input.quizId) {
    throw new Error("quizId or quizVersionId is required to export a quiz bundle.");
  }
  return apiRequest(`/api/v1/lcms/quizzes/${input.quizId}/bundle`, {
    cache: "default",
    portal: "lcms",
  });
}

function emptyWorkspace(tenantId: string): QuizEditorWorkspaceData {
  return {
    tenantId,
    quizzes: {
      hasNext: false,
      hasPrevious: false,
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    },
    subjects: [],
    levels: [],
    categories: [],
  };
}

function mockDraft(quizId: string): QuizEditorDraftDocument {
  return {
    quizId,
    draftId: `draft-${quizId}`,
    docVersion: 0,
    settings: createMockQuizProjectSettings(),
    playerTemplate: createMockPlayerTemplate(),
    tree: createMockQuizEditorGroups(),
  };
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(
      `Quiz editor draft JSON is invalid: ${error instanceof Error ? error.message : "unknown parse error"}`,
    );
  }
}

export function normalizeQuizProjectSettings(value: unknown): QuizProjectSettings {
  const defaults = createMockQuizProjectSettings();
  const source = asRecord(value);
  const info = asRecord(source.info);
  const runtime = asRecord(source.runtime ?? source.settings);
  const result = asRecord(source.result);

  return {
    ...defaults,
    info: {
      ...defaults.info,
      ...pickObject(info, ["title", "author", "introduction", "showIntroductionPage", "showQuizStatistics"]),
      page: {
        ...defaults.info.page,
        ...asRecord(info.page),
        courseTitle: stringValue(asRecord(info.page).courseTitle, stringValue(source.subjectLabel, defaults.info.page.courseTitle)),
        lessonTitle: stringValue(asRecord(info.page).lessonTitle, stringValue(source.levelLabel, defaults.info.page.lessonTitle)),
        testTitle: stringValue(asRecord(info.page).testTitle, stringValue(info.title, defaults.info.page.testTitle)),
        version: stringValue(asRecord(info.page).version, stringValue(source.versionLabel, defaults.info.page.version)),
      },
      title: stringValue(info.title, defaults.info.title),
      author: stringValue(info.author, defaults.info.author),
      introduction: stringValue(info.introduction, defaults.info.introduction),
    },
    settings: {
      ...defaults.settings,
      passingRate: numberValue(runtime.passPercent ?? runtime.passingRate, defaults.settings.passingRate),
      enableTimeLimit: runtime.timeLimitMinutes != null || booleanValue(runtime.enableTimeLimit, defaults.settings.enableTimeLimit),
      timeLimit: timeLimitValue(runtime.timeLimit ?? runtime.timeLimitMinutes, defaults.settings.timeLimit),
      randomizeQuestionOrder: booleanValue(runtime.shuffleQuestions ?? runtime.randomizeQuestionOrder, defaults.settings.randomizeQuestionOrder),
      randomQuestionCount: numberValue(runtime.randomQuestionCount, defaults.settings.randomQuestionCount),
      answerSubmission: runtime.mode === "training" ? "one-by-one" : defaults.settings.answerSubmission,
      showCorrectAnswersAfterSubmission: booleanValue(
        runtime.revealFeedbackPerStep ?? runtime.showCorrectAnswersAfterSubmission,
        defaults.settings.showCorrectAnswersAfterSubmission,
      ),
      allowReview: booleanValue(runtime.allowReview, defaults.settings.allowReview),
      oneAttemptOnly: booleanValue(runtime.oneAttemptOnly, defaults.settings.oneAttemptOnly),
      promptResume: booleanValue(runtime.promptResume, defaults.settings.promptResume),
    },
    result: {
      ...defaults.result,
      ...pickObject(result, [
        "feedbackMode",
        "passMessage",
        "failMessage",
        "reviewButtonLabel",
        "thankYouMessage",
        "showStatistics",
        "showFinishButton",
        "passRedirect",
        "failRedirect",
        "openInCurrentWindow",
      ]),
      passMessage: stringValue(result.passMessage, defaults.result.passMessage),
      failMessage: stringValue(result.failMessage, defaults.result.failMessage),
      reviewButtonLabel: stringValue(result.reviewButtonLabel, defaults.result.reviewButtonLabel),
      thankYouMessage: stringValue(result.thankYouMessage, defaults.result.thankYouMessage),
    },
    questionDefaults: {
      ...defaults.questionDefaults,
      shuffleAnswers: booleanValue(runtime.shuffleChoices ?? runtime.shuffleAnswers, defaults.questionDefaults.shuffleAnswers),
      shuffleQuestions: booleanValue(runtime.shuffleQuestions, defaults.questionDefaults.shuffleQuestions),
      positivePoints: numberValue(source.positivePoints, defaults.questionDefaults.positivePoints),
      negativePoints: numberValue(source.negativePoints, defaults.questionDefaults.negativePoints),
    },
    others: {
      ...defaults.others,
      ...pickObject(asRecord(source.others), ["passwordMode", "password", "domain", "metaDescription", "metaKeywords"]),
    },
  };
}

export function normalizeQuizPlayerTemplate(value: unknown): QuizPlayerTemplate {
  const defaults = createMockPlayerTemplate();
  const source = asRecord(value);

  return {
    ...defaults,
    ...pickObject(source, [
      "layout",
      "showToolbar",
      "showPanel",
      "roundedCorners",
      "rolledPaper",
      "backgroundTone",
      "playerSize",
      "accentColor",
      "highlightColor",
      "soundEffect",
      "textLabels",
    ]),
  };
}

export function normalizeQuizEditorGroups(value: unknown): QuizEditorGroup[] {
  const groups = Array.isArray(value) ? value : [];
  const normalized = groups
    .map((group, index) => normalizeQuizEditorGroup(group, index))
    .filter((group): group is QuizEditorGroup => Boolean(group));

  return normalized.length ? normalized : createMockQuizEditorGroups();
}

function normalizeQuizEditorGroup(value: unknown, index: number): QuizEditorGroup | null {
  const source = asRecord(value);
  const slides = Array.isArray(source.slides)
    ? source.slides.map((slide, slideIndex) => normalizeQuizEditorSlide(slide, slideIndex))
    : [];

  return {
    id: stringValue(source.id ?? source.groupId, `group-${index + 1}`),
    title: stringValue(source.title, `Group ${index + 1}`),
    rule: source.rule === "random" || source.rule === "none" ? source.rule : "all",
    randomCount: numberValue(source.randomCount, 0),
    slides,
  };
}

function normalizeQuizEditorSlide(value: unknown, index: number) {
  const source = asRecord(value);

  return {
    ...source,
    id: stringValue(source.id ?? source.slideId, `slide-${index + 1}`),
    title: stringValue(source.title, `Question ${index + 1}`),
    kind: stringValue(source.kind, "multiple-choice"),
  } as QuizEditorGroup["slides"][number];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pickObject(source: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function timeLimitValue(value: unknown, fallback: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.max(1, Math.round(value)).toString().padStart(2, "0")}:00`;
  }
  return stringValue(value, fallback);
}
