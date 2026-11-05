import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import {
  createMockPlayerTemplate,
  createMockQuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type {
  QuizEditorGroup,
  QuizEditorChoice,
  QuizEditorFeedbackRow,
  QuizEditorSlide,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { applyQuizThemePreset, defaultQuizThemePreset } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

type QuizImportDefaults = {
  questionFont: string;
  answerFont: string;
  positivePoints: number;
  negativePoints: number;
  shuffleAnswers: boolean;
  acceptPartial?: boolean;
  correctFeedback: string;
  incorrectFeedback: string;
};

const QUESTION_BANK_PACKAGE_TOTAL_POINTS = 1000;
/** Starting value of a question in "custom" points mode until the teacher types one. */
const QUESTION_BANK_CUSTOM_DEFAULT_POINTS = 10;

export type QuizPointsMode = "equal" | "custom";

export type CreateQuizFromBankOptions = {
  kind?: "train" | "test";
  title?: string;
  timeLimitMinutes?: number;
  passingScoreMode?: "percent" | "points";
  passingScorePoints?: number;
  passingRate?: number;
  playerTemplate?: QuizPlayerTemplate;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  /** "equal" splits QUESTION_BANK_PACKAGE_TOTAL_POINTS; "custom" reads questionPoints (questionId -> points). */
  pointsMode?: QuizPointsMode;
  questionPoints?: Record<string, number>;
  /** Multi-answer questions score per correct answer instead of all-or-nothing. */
  acceptPartial?: boolean;
};

type QuizPointsOptions = Pick<CreateQuizFromBankOptions, "pointsMode" | "questionPoints">;

export type QuizDraftFromBankQuestions = {
  settings: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  tree: QuizEditorGroup[];
};

export function createQuizDraftFromBankQuestions(
  questions: QuestionBankQuestion[],
  options: CreateQuizFromBankOptions = {},
): QuizDraftFromBankQuestions {
  const settings = createMockQuizProjectSettings();
  const firstQuestion = questions[0] ?? null;
  const timeLimitMinutes = normalizeNumberOption(options.timeLimitMinutes, 0, 240, 20);
  const totalPoints = getQuestionBankPackageMaxPoints(questions, options);
  const passingRate = resolvePassingRate(options, totalPoints, settings.settings.passingRate);
  const shuffleAnswers = options.shuffleAnswers ?? settings.questionDefaults.shuffleAnswers;
  const shuffleQuestions = options.shuffleQuestions ?? settings.settings.randomizeQuestionOrder;
  const acceptPartial = options.acceptPartial ?? false;
  let nextId = 0;
  const createId = (prefix: string) => {
    nextId += 1;
    return `${prefix}-${nextId}`;
  };

  const title = firstQuestion
    ? `${firstQuestion.subjectLabel} - ${firstQuestion.levelLabel}`
    : settings.info.title;

  return {
    settings: {
      ...settings,
      info: {
        ...settings.info,
        title: options.title?.trim() || title,
        introduction: firstQuestion?.objective ?? settings.info.introduction,
        page: {
          ...settings.info.page,
          courseTitle: firstQuestion?.subjectLabel ?? settings.info.page.courseTitle,
          lessonTitle: firstQuestion?.levelLabel ?? settings.info.page.lessonTitle,
          testTitle: options.title?.trim() || title,
        },
      },
      settings: {
        ...settings.settings,
        enableTimeLimit: timeLimitMinutes > 0,
        passingRate,
        randomizeQuestionOrder: shuffleQuestions,
        timeLimit: formatMinuteLimit(timeLimitMinutes),
      },
      questionDefaults: {
        ...settings.questionDefaults,
        shuffleAnswers,
        shuffleQuestions,
      },
    },
    playerTemplate: options.playerTemplate ?? createQuestionBankPlayerTemplate(),
    tree: [
      {
        id: "group-question-bank-selection",
        title: firstQuestion?.categoryLabel ?? "Question bank selection",
        rule: "all",
        randomCount: 0,
        slides: questions.map((question, index) =>
          createQuizSlideFromBankQuestion(question, createId, {
            questionFont: settings.questionDefaults.questionFont,
            answerFont: settings.questionDefaults.answerFont,
            positivePoints: options.pointsMode === "custom"
              ? getQuestionBankQuestionPoints(question.id, questions.length, options)
              : getQuestionBankEqualShare(questions.length, index),
            negativePoints: settings.questionDefaults.negativePoints,
            shuffleAnswers,
            acceptPartial,
            correctFeedback: settings.questionDefaults.correctFeedback,
            incorrectFeedback: settings.questionDefaults.incorrectFeedback,
          }),
        ),
      },
    ],
  };
}

function normalizeNumberOption(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeDecimalOption(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

function resolvePassingRate(options: CreateQuizFromBankOptions, totalPoints: number, fallback: number) {
  if (options.passingScoreMode === "points") {
    const passingPoints = normalizeDecimalOption(options.passingScorePoints, 0, totalPoints, (fallback / 100) * totalPoints);
    return totalPoints > 0 ? normalizeNumberOption((passingPoints / totalPoints) * 100, 0, 100, fallback) : fallback;
  }

  return normalizeNumberOption(options.passingRate, 0, 100, fallback);
}

function formatMinuteLimit(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  return `${String(safeMinutes).padStart(2, "0")}:00`;
}

export function getQuestionBankAutoQuestionPoints(questionCount: number) {
  if (questionCount <= 0) return 0;
  return Math.round((QUESTION_BANK_PACKAGE_TOTAL_POINTS / questionCount) * 100) / 100;
}

/** Equal shares in cents that add up to exactly the package total; leftover cents go to the first questions, like the backend split. */
function getQuestionBankEqualShare(questionCount: number, index: number) {
  const cents = QUESTION_BANK_PACKAGE_TOTAL_POINTS * 100;
  return (Math.floor(cents / questionCount) + (index < cents % questionCount ? 1 : 0)) / 100;
}

function getQuestionBankPackageTotalPoints(questions: QuestionBankQuestion[]) {
  return questions.length > 0 ? QUESTION_BANK_PACKAGE_TOTAL_POINTS : 0;
}

/** Points of one question; invalid custom values fall back to the custom default. */
export function getQuestionBankQuestionPoints(questionId: string, questionCount: number, options: QuizPointsOptions) {
  if (options.pointsMode !== "custom") return getQuestionBankAutoQuestionPoints(questionCount);
  const points = options.questionPoints?.[questionId];
  return typeof points === "number" && Number.isFinite(points) && points > 0
    ? Math.round(points * 100) / 100
    : QUESTION_BANK_CUSTOM_DEFAULT_POINTS;
}

/** Equal mode keeps the fixed package total; custom mode is the sum of the question points. */
export function getQuestionBankPackageMaxPoints(questions: QuestionBankQuestion[], options: QuizPointsOptions) {
  if (options.pointsMode !== "custom") return getQuestionBankPackageTotalPoints(questions);
  const sum = questions.reduce((total, question) => total + getQuestionBankQuestionPoints(question.id, questions.length, options), 0);
  return Math.round(sum * 100) / 100;
}

/** The player template a new package starts with: ERG Xanh. */
export function createQuestionBankPlayerTemplate(): QuizPlayerTemplate {
  return applyQuizThemePreset(createMockPlayerTemplate(), defaultQuizThemePreset);
}

export function createQuizSlideFromBankQuestion(
  question: QuestionBankQuestion,
  createId: (prefix: string) => string,
  defaults: QuizImportDefaults,
): QuizEditorSlide {
  const questionChoices = resolveQuestionChoices(question, createId);
  const feedbackRows: QuizEditorFeedbackRow[] = [
    {
      id: createId("feedback"),
      kind: "correct",
      feedback: question.rationale ?? defaults.correctFeedback,
      score: defaults.positivePoints,
      branching: "By Result",
    },
    {
      id: createId("feedback"),
      kind: "incorrect",
      feedback: defaults.incorrectFeedback,
      score: defaults.negativePoints,
      branching: "By Result",
    },
  ];

  return {
    id: createId("slide"),
    questionId: question.id,
    bankQuestionId: question.id,
    title: question.stem,
    description: `${question.subjectLabel} • ${question.categoryLabel} • ${question.gradeLabel}`,
    kind: question.type,
    textStyle: {
      ...defaultQuizTextStyle,
      fontFamily: defaults.questionFont,
    },
    textStyles: {
      answer: {
        ...defaultQuizTextStyle,
        fontFamily: defaults.answerFont,
      },
    },
    instructions: [question.objective],
    choices: questionChoices,
    choiceControlType: question.type === "multiple-response" ? "checkbox" : "radio",
    feedbackRows,
    options: {
      shuffleAnswers: defaults.shuffleAnswers,
      acceptPartial: defaults.acceptPartial,
    },
    questionSettings: question.settings ?? {},
    questionSetSettings: {
      points: defaults.positivePoints,
      shuffleChoices: defaults.shuffleAnswers,
    },
    layers: [question.subjectLabel, question.categoryLabel, question.gradeLabel],
  };
}

function resolveQuestionChoices(
  question: QuestionBankQuestion,
  createId: (prefix: string) => string,
): QuizEditorChoice[] | undefined {
  if (question.choices?.length) {
    return question.choices.map((choice) => ({
      id: createId("choice"),
      label: choice.label,
      correct: choice.correct,
    }));
  }

  if (question.type === "true-false") {
    return [
      { id: createId("choice"), label: "Đúng", correct: question.answer === "Đúng" || question.answer === "True" },
      { id: createId("choice"), label: "Sai", correct: question.answer === "Sai" || question.answer === "False" },
    ];
  }

  return undefined;
}
