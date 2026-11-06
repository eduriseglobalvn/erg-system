import { createQuizPackage } from "@/domain/quiz/assessment-engine";
import { normalizeBackendQuestion } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-question-normalizers";
import {
  booleanValue,
  isRecord,
  nestedValue,
  normalizeQuizMode,
  normalizeResult,
  normalizeTheme,
  numberValue,
  stringValue,
} from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-normalization-utils";
import type { BackendQuizPackage } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-api";
import type { Question, Quiz, QuizPackage, Section } from "@/domain/quiz/types";

export function normalizeQuizPackage(value: BackendQuizPackage): QuizPackage {
  const gradingMode = value.gradingMode ?? "server-authoritative";
  const extractedQuiz = extractQuiz(value.quiz, value.answerKey ?? {}, gradingMode);
  // Training mode grades per question on the client, so only graded (testing) quizzes can lose the key.
  const quiz = withoutEssayGuide(gradingMode === "server-authoritative" && extractedQuiz.settings.mode === "testing"
    ? stripQuizAnswerKey(extractedQuiz)
    : extractedQuiz);
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
    signatureAlgorithm: value.signatureAlgorithm,
    packageFormat: value.packageFormat,
    minRuntimeVersion: value.minRuntimeVersion,
    downloadUrl: value.downloadUrl,
    sizeBytes: value.sizeBytes,
    releaseChannel: value.releaseChannel,
    portableReady: value.portableReady,
    etag: value.etag,
    revokedAt: value.revokedAt,
    tenantId: value.tenantId,
    quizVersionId: value.quizVersionId,
    assetsManifest: value.assetsManifest,
    gradingMode,
    source: value.source ?? "server",
    quiz,
  };
}

/**
 * 4.4 #18: a server-authoritative package must not carry the answer key even if the backend sent it.
 * Limitation: matching pairs / sequence order are the key by structure; the server has to send those unpaired.
 */
export function stripQuizAnswerKey(quiz: Quiz): Quiz {
  const strip = (question: Question): Question => ({
    ...question,
    answerKeyStripped: true,
    ...(question.choices ? { choices: question.choices.map((choice) => ({ ...choice, correct: false })) } : {}),
    ...(question.inlineBlanks ? { inlineBlanks: question.inlineBlanks.map((blank) => ({ ...blank, correctOptionId: "" })) } : {}),
    ...(question.textBlanks ? { textBlanks: question.textBlanks.map((blank) => ({ ...blank, correctAnswers: [] })) } : {}),
    ...(question.numericAnswer ? { numericAnswer: { ...question.numericAnswer, correctValue: 0, tolerance: 0 } } : {}),
    ...(question.wordSlots ? { wordSlots: question.wordSlots.map((slot) => ({ ...slot, correctWordId: "" })) } : {}),
    ...(question.dragDropItems ? { dragDropItems: question.dragDropItems.map((item) => ({ ...item, correctTargetId: "" })) } : {}),
    ...(question.hotspotAreas ? { hotspotAreas: [] } : {}),
    ...(question.matchingKey ? { matchingKey: undefined } : {}),
    ...(question.sequenceCorrectOrder ? { sequenceCorrectOrder: [] } : {}),
    ...(question.essayRubric ? { essayRubric: undefined } : {}),
  });
  return { ...quiz, sections: quiz.sections.map((section) => ({ ...section, questions: section.questions.map(strip) })) };
}

/** The essay marking guide is for teachers only (spec §7); no learner package keeps it, whatever the mode. */
function withoutEssayGuide(quiz: Quiz): Quiz {
  const drop = (question: Question): Question => (question.essayRubric ? { ...question, essayRubric: undefined } : question);
  return { ...quiz, sections: quiz.sections.map((section) => ({ ...section, questions: section.questions.map(drop) })) };
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
