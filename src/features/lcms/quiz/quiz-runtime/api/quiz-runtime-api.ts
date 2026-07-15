import { createAttemptSession, createQuizPackage, gradeAttemptLocally } from "@/lib/assessment-engine";
import { getAllQuestions } from "@/lib/quiz";
import { getLocalQuizById, sampleQuiz } from "@/lib/sample-quiz";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { shouldUseLocalQuizRuntimeFallback } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-fallback";
import type {
  Attempt,
  Choice,
  DragDropItem,
  DragWord,
  Feedback,
  HotspotArea,
  InlineBlank,
  Question,
  QuestionKind,
  Quiz,
  QuizPackage,
  QuizResultDisplay,
  Section,
  Theme,
} from "@/lib/types";
import type {
  FinalSubmitPayload,
  SaveAttemptAnswerInput,
  SaveAttemptAnswerResult,
  SaveAttemptDraftInput,
  RuntimeServerAttemptSnapshot,
  QuizRuntimePortal,
  StartAttemptInput,
  StartAttemptResult,
  SyncAttemptInput,
  SyncAttemptResult,
  SubmitAttemptInput,
} from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";

type BackendQuizPackage = Partial<Omit<QuizPackage, "quiz">> & {
  quiz?: unknown;
  answerKey?: Record<string, Record<string, unknown>>;
  packageHash?: string;
  version?: string | number;
};

type BackendStartAttemptResponse = {
  attemptId?: string;
  id?: string;
  attempt?: {
    id?: string;
  };
};

type BackendSubmitAttemptResponse =
  | Attempt
  | BackendSubmitAttemptAggregate
  | {
      attempt?: Attempt;
      result?: Attempt;
    };

type BackendSubmitAttemptAggregate = {
  score?: number;
  maxScore?: number;
  percent?: number;
  passed?: boolean;
};

const DEFAULT_QUIZ_RUNTIME_PORTAL: QuizRuntimePortal = "elearning";
const normalizedPackageCache = new Map<string, QuizPackage>();

export function clearNormalizedQuizPackageCache(quizId?: string) {
  if (!quizId) {
    normalizedPackageCache.clear();
    return;
  }

  Array.from(normalizedPackageCache.keys())
    .filter((key) => key.endsWith(`:${quizId}`))
    .forEach((key) => normalizedPackageCache.delete(key));
}

export async function getQuizPackage(
  quizId: string,
  portal: QuizRuntimePortal = DEFAULT_QUIZ_RUNTIME_PORTAL,
  tenantId: string = getDefaultTenantId(),
): Promise<QuizPackage> {
  const localQuiz = getLocalQuizById(quizId) ?? sampleQuiz;

  if (!hasApiBase()) {
    return createQuizPackage(localQuiz, {
      gradingMode: "client-first",
      source: "local",
    });
  }

  try {
    const cacheKey = `${tenantId}:${portal}:${quizId}`;
    const backendPackage = await apiRequest<BackendQuizPackage | undefined>(`/api/v1/lms/quizzes/${quizId}/package`, {
      cache: "default",
      portal,
    });
    if (!backendPackage) {
      const cachedPackage = normalizedPackageCache.get(cacheKey);
      if (cachedPackage) {
        return cachedPackage;
      }
      throw new Error("Quiz package returned no body and no cached package is available.");
    }

    const normalizedPackage = normalizeQuizPackage(backendPackage);
    normalizedPackageCache.set(cacheKey, normalizedPackage);
    return normalizedPackage;
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(quizId, error)) {
      return createQuizPackage(localQuiz, {
        gradingMode: "client-first",
        source: "local",
      });
    }

    throw error;
  }
}

export async function startAttempt(input: StartAttemptInput): Promise<StartAttemptResult> {
  if (!hasApiBase()) {
    return { attemptId: input.localAttemptId };
  }

  try {
    const response = await apiRequest<BackendStartAttemptResponse>("/api/v1/lms/attempts", {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "POST",
      headers: {
        "X-Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        assignmentId: input.assignmentId,
        quizId: input.quizId,
        packageId: input.packageId,
        packageHash: input.packageHash,
      }),
    });

    const attemptId = response.attemptId ?? response.id ?? response.attempt?.id;
    if (!attemptId) {
      throw new Error("Start attempt response is missing attemptId.");
    }

    return {
      attemptId,
    };
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(input.quizId, error)) {
      return { attemptId: input.localAttemptId };
    }

    throw error;
  }
}

export async function submitFinalAttempt(input: SubmitAttemptInput): Promise<Attempt> {
  if (!hasApiBase()) {
    return gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.payload.answers);
  }

  try {
    const response = await apiRequest<BackendSubmitAttemptResponse>(
      `/api/v1/lms/attempts/${input.attemptId}/submit`,
      {
        portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
        method: "POST",
        headers: {
          "X-Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify(input.payload),
      },
    );

    return normalizeSubmitResponse(response, input);
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(input.quiz.id, error)) {
      return gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.payload.answers);
    }

    throw error;
  }
}

export async function saveAttemptDraft(input: SaveAttemptDraftInput): Promise<RuntimeServerAttemptSnapshot | null> {
  if (!hasApiBase()) {
    return null;
  }

  const response = await apiRequest<RuntimeServerAttemptSnapshot>(
    `/api/v1/lms/attempts/${input.attemptId}/draft`,
    {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "PATCH",
      body: JSON.stringify(input.payload),
    },
  );

  if (!isServerAttemptSnapshot(response)) {
    throw new Error("Save draft response is missing a valid server attempt.");
  }

  return response;
}

export async function saveAttemptAnswer(input: SaveAttemptAnswerInput): Promise<SaveAttemptAnswerResult | null> {
  if (!hasApiBase()) {
    return null;
  }

  const response = await apiRequest<SaveAttemptAnswerResult>(
    `/api/v1/lms/attempts/${input.attemptId}/answers/${encodeURIComponent(input.questionId)}`,
    {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "PUT",
      body: JSON.stringify(input.payload),
    },
  );

  if (!response?.saved) {
    throw new Error("Save answer response did not confirm persistence.");
  }

  return response;
}

export async function syncAttempt(input: SyncAttemptInput): Promise<SyncAttemptResult | null> {
  if (!hasApiBase()) {
    return null;
  }

  const response = await apiRequest<SyncAttemptResult>(
    `/api/v1/lms/attempts/${input.attemptId}/sync`,
    {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "POST",
      body: JSON.stringify(input.payload),
    },
  );

  if (!response || !Array.isArray(response.conflicts)) {
    throw new Error("Sync attempt response is missing conflict metadata.");
  }

  if (response.conflicts.length > 0) {
    throw new Error(`Sync attempt conflict: ${response.conflicts.join(", ")}`);
  }

  return response;
}

export function buildClientSubmitPayload(input: {
  answers: FinalSubmitPayload["answers"];
  attemptId: string;
  clientEvents: FinalSubmitPayload["clientEvents"];
  quizPackage: QuizPackage;
  startedAt: string;
  submittedAt: string;
}): FinalSubmitPayload {
  const clientAttempt = gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.answers);

  return {
    packageHash: input.quizPackage.contentHash,
    quizVersion: input.quizPackage.quizVersion,
    startedAt: input.startedAt,
    submittedAt: input.submittedAt,
    durationMs: Math.max(0, Date.parse(input.submittedAt) - Date.parse(input.startedAt)),
    answers: input.answers,
    clientResult: {
      score: clientAttempt.totalScore,
      maxScore: clientAttempt.maxScore,
      percent: clientAttempt.percent,
    },
    clientEvents: input.clientEvents,
  };
}

export function createEmptyAttempt(quizPackage: QuizPackage, attemptId: string): Attempt {
  return createAttemptSession(quizPackage, attemptId).attempt;
}

export function gradeFinalAttemptLocally(
  quizPackage: QuizPackage,
  attemptId: string,
  answers: FinalSubmitPayload["answers"],
): Attempt {
  const session = createAttemptSession(quizPackage, attemptId);
  return gradeAttemptLocally(session, answers).attempt;
}

function normalizeQuizPackage(value: BackendQuizPackage): QuizPackage {
  const gradingMode = value.gradingMode ?? "server-authoritative";
  const quiz = extractQuiz(value.quiz, value.answerKey ?? {}, gradingMode);
  const quizVersion = String(value.quizVersion ?? value.version ?? quiz.version);
  const contentHash = value.contentHash ?? value.packageHash ?? createQuizPackage(quiz).contentHash;

  return {
    id: value.id ?? `pkg_${quiz.id}_${quizVersion}_${contentHash.slice(-10)}`,
    quizId: value.quizId ?? quiz.id,
    quizVersion,
    generatedAt: value.generatedAt ?? new Date().toISOString(),
    expiresAt: value.expiresAt,
    contentHash,
    signature: value.signature,
    publicKeyId: value.publicKeyId,
    gradingMode,
    source: value.source ?? "server",
    quiz,
  };
}

export function prepareQuizPackageForAttempt(quizPackage: QuizPackage, attemptSeed: string): QuizPackage {
  const quiz = quizPackage.quiz;
  const isTestingMode = quiz.settings.mode === "testing";
  const isTrainingMode = quiz.settings.mode === "training";
  const enforcedSettings = {
    ...quiz.settings,
    shuffleQuestions: isTestingMode ? true : isTrainingMode ? false : quiz.settings.shuffleQuestions,
    shuffleChoices: isTestingMode ? true : isTrainingMode ? false : quiz.settings.shuffleChoices,
  };
  const enforcedQuiz: Quiz = {
    ...quiz,
    settings: enforcedSettings,
    sections: enforceSectionsOrder(quiz.sections, {
      seed: `${quizPackage.contentHash}:${quiz.id}:${quizPackage.quizVersion}:${attemptSeed}`,
      shuffleChoices: enforcedSettings.shuffleChoices,
      shuffleQuestions: enforcedSettings.shuffleQuestions,
    }),
  };

  return {
    ...quizPackage,
    quiz: enforcedQuiz,
  };
}

function enforceSectionsOrder(
  sections: Section[],
  options: {
    seed: string;
    shuffleChoices: boolean;
    shuffleQuestions: boolean;
  },
): Section[] {
  return sections.map((section, sectionIndex) => {
    const questions = section.questions.map((question) =>
      options.shuffleChoices
        ? shuffleQuestionChoices(question, `${options.seed}:section-${sectionIndex}:${question.id}`)
        : question,
    );

    return {
      ...section,
      questions: options.shuffleQuestions
        ? shuffleBySeed(questions, `${options.seed}:section-${sectionIndex}:questions`)
        : questions,
    };
  });
}

function shuffleQuestionChoices(question: Question, seed: string): Question {
  return {
    ...question,
    choices: question.choices ? shuffleBySeed<Choice>(question.choices, `${seed}:choices`) : question.choices,
    dragDropItems: question.dragDropItems
      ? shuffleBySeed<DragDropItem>(question.dragDropItems, `${seed}:drag-drop-items`)
      : question.dragDropItems,
    inlineBlanks: question.inlineBlanks?.map((blank) => ({
      ...blank,
      options: shuffleBySeed<string>(blank.options, `${seed}:inline:${blank.id}`),
    })) as InlineBlank[] | undefined,
    wordBank: question.wordBank ? shuffleBySeed<DragWord>(question.wordBank, `${seed}:word-bank`) : question.wordBank,
  };
}

function shuffleBySeed<TItem>(items: TItem[], seed: string): TItem[] {
  return [...items]
    .map((item, index) => ({
      item,
      order: stableHashNumber(`${seed}:${index}:${stableStringifyForShuffle(item)}`),
    }))
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item);
}

function stableHashNumber(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function stableStringifyForShuffle(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyForShuffle(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringifyForShuffle(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function extractQuiz(
  value: unknown,
  answerKey: Record<string, Record<string, unknown>>,
  gradingMode: QuizPackage["gradingMode"],
): Quiz {
  if (isQuiz(value)) {
    return mergeAnswerKey(value, answerKey, gradingMode);
  }

  if (value && typeof value === "object" && "quiz" in value) {
    const detail = value as { quiz?: unknown; slides?: unknown; settings?: unknown; result?: unknown; theme?: unknown };
    const nestedQuiz = detail.quiz;
    if (isQuiz(nestedQuiz)) {
      return mergeAnswerKey(nestedQuiz, answerKey, gradingMode);
    }
    return buildQuizFromBackendDetail(detail, answerKey, gradingMode);
  }

  throw new Error("Quiz package response is missing a playable quiz.");
}

function buildQuizFromBackendDetail(
  detail: { quiz?: unknown; slides?: unknown; settings?: unknown; result?: unknown; theme?: unknown },
  answerKey: Record<string, Record<string, unknown>>,
  gradingMode: QuizPackage["gradingMode"],
): Quiz {
  const summary = isRecord(detail.quiz) ? detail.quiz : {};
  const settingsRecord = isRecord(detail.settings) ? detail.settings : {};
  const nestedSettings = isRecord(settingsRecord.settings) ? settingsRecord.settings : settingsRecord;
  const mode = normalizeQuizMode(nestedSettings.mode ?? summary.kind);

  return {
    id: stringValue(summary.id, "quiz"),
    title: stringValue(summary.title ?? nestedValue(settingsRecord.info, "title"), "Bài làm"),
    subtitle: stringValue(summary.subtitle, ""),
    version: String(summary.version ?? "1"),
    description: stringValue(summary.description, ""),
    themeId: stringValue(summary.themeId, "erg-default"),
    theme: normalizeTheme(detail.theme),
    settings: {
      mode,
      timeLimitMinutes: numberValue(nestedSettings.timeLimitMinutes ?? nestedSettings.maxDurationMinutes),
      passPercent: numberValue(nestedSettings.passPercent ?? nestedSettings.passingRate, 50),
      shuffleQuestions: booleanValue(nestedSettings.shuffleQuestions ?? nestedSettings.randomizeQuestionOrder, mode === "testing"),
      shuffleChoices: booleanValue(nestedSettings.shuffleChoices ?? nestedSettings.shuffleAnswers, mode === "testing"),
      revealFeedbackPerStep: booleanValue(nestedSettings.revealFeedbackPerStep, mode === "training"),
    },
    result: normalizeResult(detail.result),
    sections: normalizeBackendSections(detail.slides, answerKey, gradingMode),
  };
}

function normalizeBackendSections(
  value: unknown,
  answerKey: Record<string, Record<string, unknown>>,
  gradingMode: QuizPackage["gradingMode"],
): Section[] {
  if (!Array.isArray(value)) return [];

  return value.map((section, sectionIndex) => {
    const record = isRecord(section) ? section : {};
    const questions = Array.isArray(record.questions) ? record.questions : [];
    return {
      id: stringValue(record.id, `section-${sectionIndex + 1}`),
      title: stringValue(record.title, `Phần ${sectionIndex + 1}`),
      questions: questions
        .map((question, questionIndex) => normalizeBackendQuestion(question, questionIndex, answerKey, gradingMode))
        .filter((question): question is Question => Boolean(question)),
    };
  });
}

function normalizeBackendQuestion(
  value: unknown,
  questionIndex: number,
  answerKey: Record<string, Record<string, unknown>>,
  gradingMode: QuizPackage["gradingMode"],
): Question | null {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id ?? value.questionId ?? value.slideId, `question-${questionIndex + 1}`);
  const kind = normalizeQuestionKind(value.kind ?? value.type);
  if (!kind) return null;

  const key = gradingMode === "server-authoritative" ? undefined : answerKey[id];
  const feedback: Feedback = {
    correct: stringValue(nestedValue(value.feedback, "correct"), "Chính xác."),
    incorrect: stringValue(nestedValue(value.feedback, "incorrect"), "Chưa chính xác."),
    partial: stringValue(nestedValue(value.feedback, "partial"), "Đúng một phần."),
  };

  return {
    id,
    kind,
    title: stringValue(value.title ?? value.question, `Câu ${questionIndex + 1}`),
    instructions: Array.isArray(value.instructions)
      ? value.instructions.filter((item): item is string => typeof item === "string").join("\n")
      : stringValue(value.description ?? value.instructions, ""),
    points: numberValue(value.points, 1),
    feedback,
    choices: normalizeChoices(value.choices ?? value.options, key),
    matching: normalizeList(value.matching),
    sequenceItems: normalizeList(value.sequenceItems),
    inlineBlanks: normalizeInlineBlanks(value.inlineBlanks, key),
    textBlanks: normalizeTextBlanks(value.textBlanks ?? value.blanks, key),
    numericAnswer: normalizeNumericAnswer(value.numericAnswer, key),
    wordBank: normalizeList(value.wordBank),
    wordSlots: normalizeWordSlots(value.wordSlots, key),
    dropTargets: normalizeList(value.dropTargets),
    dragDropItems: normalizeDragDropItems(value.dragDropItems, key),
    likertRows: normalizeList(value.likertRows),
    likertScale: normalizeList(value.likertScale),
    essayRubric: normalizeList(value.essayRubric),
    hotspotImage: isRecord(value.hotspotImage) ? value.hotspotImage as Question["hotspotImage"] : undefined,
    hotspotAreas: normalizeHotspotAreas(value.hotspotAreas ?? value.regions, key),
  };
}

function mergeAnswerKey(
  quiz: Quiz,
  answerKey: Record<string, Record<string, unknown>>,
  gradingMode: QuizPackage["gradingMode"],
): Quiz {
  if (gradingMode === "server-authoritative") return quiz;

  return {
    ...quiz,
    sections: quiz.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question, index) =>
        normalizeBackendQuestion(question, index, answerKey, gradingMode) ?? question,
      ),
    })),
  };
}

function normalizeChoices(value: unknown, key?: Record<string, unknown>): Choice[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const correctIds = new Set([
    ...stringArray(key?.correctChoiceIds),
    ...stringArray(key?.correctChoiceId),
  ]);
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `choice-${index + 1}`);
    return {
      id,
      label: stringValue(record.label ?? record.text, `Đáp án ${index + 1}`),
      correct: booleanValue(record.correct ?? record.isCorrect, correctIds.has(id)),
    };
  });
}

function normalizeTextBlanks(value: unknown, key?: Record<string, unknown>): Question["textBlanks"] {
  const keyBlanks = keyBlanksById(key);
  if (!Array.isArray(value) && keyBlanks.size === 0) return undefined;
  const blanks = Array.isArray(value) ? value : Array.from(keyBlanks.keys()).map((id) => ({ id }));
  return blanks.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `blank-${index + 1}`);
    return {
      id,
      label: stringValue(record.label ?? record.statement, ""),
      correctAnswers: stringArray(record.correctAnswers ?? keyBlanks.get(id)),
      placeholder: stringValue(record.placeholder, ""),
    };
  });
}

function normalizeInlineBlanks(value: unknown, key?: Record<string, unknown>): InlineBlank[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const keyBlanks = keyBlanksById(key);
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `inline-${index + 1}`);
    return {
      id,
      statement: stringValue(record.statement, ""),
      options: stringArray(record.options),
      correctOptionId: stringArray(record.correctOptionId ?? keyBlanks.get(id))[0] ?? "",
    };
  });
}

function normalizeNumericAnswer(value: unknown, key?: Record<string, unknown>): Question["numericAnswer"] {
  const record = isRecord(value) ? value : {};
  const expected = numberValue(record.correctValue ?? key?.value, Number.NaN);
  if (!Number.isFinite(expected)) return undefined;
  return {
    correctValue: expected,
    tolerance: numberValue(record.tolerance ?? key?.tolerance),
    unit: typeof record.unit === "string" ? record.unit : undefined,
  };
}

function normalizeWordSlots(value: unknown, key?: Record<string, unknown>): Question["wordSlots"] {
  const keyBlanks = keyBlanksById(key);
  if (!Array.isArray(value)) return undefined;
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `slot-${index + 1}`);
    return {
      id,
      label: stringValue(record.label, ""),
      correctWordId: stringArray(record.correctWordId ?? keyBlanks.get(id))[0] ?? "",
    };
  });
}

function normalizeDragDropItems(value: unknown, key?: Record<string, unknown>): Question["dragDropItems"] {
  const targetMap = pairMap(key?.targets);
  if (!Array.isArray(value)) return undefined;
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `drag-${index + 1}`);
    return {
      id,
      label: stringValue(record.label, ""),
      correctTargetId: stringValue(record.correctTargetId ?? targetMap.get(id), ""),
    };
  });
}

function normalizeHotspotAreas(value: unknown, key?: Record<string, unknown>): HotspotArea[] | undefined {
  const regions = Array.isArray(key?.regions) ? key?.regions : value;
  if (!Array.isArray(regions)) return undefined;
  return regions.map((item, index) => {
    const record = isRecord(item) ? item : {};
    return {
      id: stringValue(record.id, `area-${index + 1}`),
      shape: record.shape === "ellipse" || record.shape === "polygon" ? record.shape : "rect",
      x: numberValue(record.x),
      y: numberValue(record.y),
      width: numberValue(record.width),
      height: numberValue(record.height),
      correct: booleanValue(record.correct, true),
    };
  });
}

function normalizeList<T = never>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? value as T[] : undefined;
}

function normalizeQuestionKind(value: unknown): QuestionKind | null {
  const kind = String(value ?? "").trim();
  const map: Record<string, QuestionKind> = {
    "multiple-choice": "single_choice",
    "multiple-response": "multiple_response",
    "true-false": "true_false",
    "short-answer": "short_answer",
    numeric: "numeric",
    sequence: "sequence",
    matching: "matching",
    "fill-in-the-blanks": "fill_blank",
    "select-from-lists": "select_from_lists",
    "drag-the-words": "drag_words",
    hotspot: "hotspot",
    "drag-and-drop": "drag_drop",
    "likert-scale": "likert_scale",
    essay: "essay",
  };
  const normalized = map[kind] ?? kind;
  return [
    "single_choice", "multiple_response", "true_false", "short_answer", "numeric", "sequence",
    "matching", "fill_blank", "inline_choice", "select_from_lists", "drag_words", "hotspot",
    "drag_drop", "likert_scale", "essay",
  ].includes(normalized) ? normalized as QuestionKind : null;
}

function normalizeQuizMode(value: unknown): Quiz["settings"]["mode"] {
  const mode = String(value ?? "").toLowerCase();
  return mode === "test" || mode === "testing" ? "testing" : "training";
}

function normalizeTheme(value: unknown): Theme {
  const record = isRecord(value) ? value : {};
  return {
    pageBackground: stringValue(record.pageBackground, "#f8fafc"),
    playerBackground: stringValue(record.playerBackground, "#ffffff"),
    canvasBorder: stringValue(record.canvasBorder, "#000088"),
    headerBackground: stringValue(record.headerBackground, "#000088"),
    headerText: stringValue(record.headerText, "#ffffff"),
    accentStart: stringValue(record.accentStart, "#000088"),
    accentEnd: stringValue(record.accentEnd, "#e82828"),
    optionText: stringValue(record.optionText, "#172033"),
    optionSelectedBackground: stringValue(record.optionSelectedBackground, "#eef2ff"),
    inputBackground: stringValue(record.inputBackground, "#ffffff"),
    sidebarActiveBackground: stringValue(record.sidebarActiveBackground, "#eef2ff"),
    sidebarActiveText: stringValue(record.sidebarActiveText, "#000088"),
  };
}

function normalizeResult(value: unknown): QuizResultDisplay | undefined {
  if (!isRecord(value)) return undefined;
  return value as QuizResultDisplay;
}

function keyBlanksById(key?: Record<string, unknown>) {
  const result = new Map<string, unknown>();
  const blanks = key?.blanks;
  if (Array.isArray(blanks)) {
    for (const item of blanks) {
      if (isRecord(item) && item.id) result.set(String(item.id), item.answers);
    }
  }
  return result;
}

function pairMap(value: unknown) {
  const result = new Map<string, string>();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isRecord(item)) continue;
      const itemId = stringValue(item.itemId ?? item.promptId ?? item.id, "");
      const targetId = stringValue(item.targetId ?? item.responseId ?? item.value, "");
      if (itemId && targetId) result.set(itemId, targetId);
    }
  }
  return result;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => item != null).map(String);
  if (value == null) return [];
  return [String(value)];
}

function nestedValue(holder: unknown, key: string) {
  return isRecord(holder) ? holder[key] : undefined;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : value == null ? fallback : String(value);
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeSubmitResponse(response: BackendSubmitAttemptResponse, input: SubmitAttemptInput): Attempt {
  if (isAttempt(response)) {
    return response;
  }

  const record: Record<string, unknown> = isRecord(response) ? response : {};
  if (record.attempt && isAttempt(record.attempt)) {
    return record.attempt;
  }

  if (record.result && isAttempt(record.result)) {
    return record.result;
  }

  if (isSubmitAggregate(response)) {
    return aggregateSubmitResponseToAttempt(response, input);
  }

  throw new Error("Submit attempt response is missing a valid attempt result.");
}

function aggregateSubmitResponseToAttempt(response: BackendSubmitAttemptAggregate, input: SubmitAttemptInput): Attempt {
  const answers = Object.fromEntries(
    Object.entries(input.payload.answers).map(([questionId, answer]) => [
      questionId,
      {
        questionId,
        input: answer,
        result: {
          questionId,
          correct: false,
          partiallyRight: false,
          awardedPoints: 0,
          maxPoints: 0,
        },
      },
    ]),
  ) as Attempt["answers"];
  const totalQuestions = getAllQuestions(input.quizPackage.quiz).length;

  return {
    id: input.attemptId,
    quizId: input.quiz.id,
    answers,
    submittedCount: Object.keys(input.payload.answers).length,
    totalQuestions,
    totalScore: response.score ?? 0,
    maxScore: response.maxScore ?? totalQuestions,
    percent: response.percent ?? 0,
    passed: Boolean(response.passed),
  };
}

function isQuiz(value: unknown): value is Quiz {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "settings" in value &&
      "sections" in value &&
      Array.isArray((value as { sections?: unknown }).sections),
  );
}

function isAttempt(value: unknown): value is Attempt {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "answers" in value &&
      "submittedCount" in value &&
      "totalScore" in value &&
      "maxScore" in value,
  );
}

function isSubmitAggregate(value: unknown): value is BackendSubmitAttemptAggregate {
  return Boolean(
    value &&
      typeof value === "object" &&
      "score" in value &&
      "maxScore" in value &&
      "percent" in value &&
      "passed" in value,
  );
}

function isServerAttemptSnapshot(value: unknown): value is RuntimeServerAttemptSnapshot {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { id?: unknown }).id === "string",
  );
}

export function countAnsweredQuestions(quiz: Quiz, answers: FinalSubmitPayload["answers"]) {
  return getAllQuestions(quiz).filter((question) => Boolean(answers[question.id])).length;
}
