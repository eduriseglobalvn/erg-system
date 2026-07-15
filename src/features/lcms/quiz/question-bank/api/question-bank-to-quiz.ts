import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import {
  createMockPlayerTemplate,
  createMockQuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/api/mock-quiz-editor-project";
import type {
  QuizEditorGroup,
  QuizEditorChoice,
  QuizEditorFeedbackRow,
  QuizEditorSlide,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

type QuizImportDefaults = {
  questionFont: string;
  answerFont: string;
  positivePoints: number;
  negativePoints: number;
  shuffleAnswers: boolean;
  correctFeedback: string;
  incorrectFeedback: string;
};

export const QUESTION_BANK_PACKAGE_TOTAL_POINTS = 1000;

export type CreateQuizFromBankOptions = {
  kind?: "train" | "test";
  title?: string;
  timeLimitMinutes?: number;
  passingScoreMode?: "percent" | "points";
  passingScorePoints?: number;
  passingRate?: number;
  templateLayout?: QuizPlayerTemplate["layout"];
  playerSize?: QuizPlayerTemplate["playerSize"];
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
};

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
  const playerTemplate = createMockPlayerTemplate();
  const firstQuestion = questions[0] ?? null;
  const timeLimitMinutes = normalizeNumberOption(options.timeLimitMinutes, 0, 240, 20);
  const totalPoints = getQuestionBankPackageTotalPoints(questions);
  const passingRate = resolvePassingRate(options, totalPoints, settings.settings.passingRate);
  const shuffleAnswers = options.shuffleAnswers ?? settings.questionDefaults.shuffleAnswers;
  const shuffleQuestions = options.shuffleQuestions ?? settings.settings.randomizeQuestionOrder;
  const questionPoints = getQuestionBankAutoQuestionPoints(questions.length);
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
    playerTemplate: {
      ...playerTemplate,
      layout: options.templateLayout ?? playerTemplate.layout,
      playerSize: options.playerSize ?? playerTemplate.playerSize,
    },
    tree: [
      {
        id: "group-question-bank-selection",
        title: firstQuestion?.categoryLabel ?? "Question bank selection",
        rule: "all",
        randomCount: 0,
        slides: questions.map((question) =>
          createQuizSlideFromBankQuestion(question, createId, {
            questionFont: settings.questionDefaults.questionFont,
            answerFont: settings.questionDefaults.answerFont,
            positivePoints: questionPoints,
            negativePoints: settings.questionDefaults.negativePoints,
            shuffleAnswers,
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

export function getQuestionBankPackageTotalPoints(questions: QuestionBankQuestion[]) {
  return questions.length > 0 ? QUESTION_BANK_PACKAGE_TOTAL_POINTS : 0;
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
