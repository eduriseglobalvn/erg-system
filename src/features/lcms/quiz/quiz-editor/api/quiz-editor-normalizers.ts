import {
  createEmptyQuizEditorGroups,
  createMockPlayerTemplate,
  createMockQuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type {
  QuizEditorGroup,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

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

  return normalized.length ? normalized : createEmptyQuizEditorGroups();
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
  const normalizedStatus = source.status === "published" ? "published" : source.status === "unsaved" ? "unsaved" : "draft";

  return {
    ...source,
    id: stringValue(source.id ?? source.slideId, `slide-${index + 1}`),
    title: stringValue(source.title, `Question ${index + 1}`),
    kind: stringValue(source.kind, "multiple-choice"),
    status: normalizedStatus as "unsaved" | "draft" | "published",
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
