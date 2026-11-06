import { defaultQuizFontFamily } from "@/config/fonts";
import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { tr } from "@/platform/i18n";
import type {
  QuizEditorChoice,
  QuizEditorFeedbackRow,
  QuizEditorGroup,
  QuizEditorSlideOptions,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function createMockChoice(id: string, label: string, correct = false): QuizEditorChoice {
  return { id, label, correct };
}

export function createMockFeedbackRows(correct: string, incorrect: string): QuizEditorFeedbackRow[] {
  return [
    { id: "feedback-correct", kind: "correct", feedback: correct, score: 10, branching: "By Result" },
    { id: "feedback-incorrect", kind: "incorrect", feedback: incorrect, score: 0, branching: "By Result" },
  ];
}

export function createMockQuestionOptions(
  patch: Partial<QuizEditorSlideOptions> = {},
): QuizEditorSlideOptions {
  return {
    questionType: "Graded",
    feedback: "By Result",
    branching: "By Result",
    score: "By Result",
    attempts: 1,
    layoutPreset: "title-and-content",
    answerColumns: 1,
    animationPreset: "none",
    limitTime: false,
    timeLimit: "01:00",
    shuffleAnswers: false,
    acceptPartial: false,
    limitResponses: false,
    limitResponsesValue: 1,
    ...patch,
  };
}

export function createMockQuizProjectSettings(): QuizProjectSettings {
  return {
    info: {
      title: tr("quiz.sampleQuizTitle"),
      author: "",
      introduction: tr("quiz.sampleProjectIntroduction"),
      showIntroductionPage: true,
      showQuizStatistics: true,
      page: {
        theme: "academic-wave",
        organization: "",
        courseTitle: "",
        lessonTitle: "",
        testTitle: "",
        version: "",
        lecturer: "",
        contributors: "",
        startButtonLabel: "Bắt đầu",
      },
    },
    settings: {
      passingRate: 80,
      enableTimeLimit: false,
      timeLimit: "15:00",
      randomizeQuestionOrder: false,
      randomQuestionCount: 10,
      answerSubmission: "all-at-once",
      showCorrectAnswersAfterSubmission: true,
      allowReview: true,
      oneAttemptOnly: false,
      promptResume: false,
    },
    result: {
      feedbackMode: "according-to-result",
      passMessage: tr("quiz.greatYoureSharp"),
      failMessage: tr("quiz.tryAgainMessage"),
      reviewButtonLabel: "Xem lại bài",
      thankYouMessage: "Cảm ơn em!",
      showStatistics: true,
      showFinishButton: false,
      passRedirect: "",
      failRedirect: "",
      openInCurrentWindow: true,
    },
    questionDefaults: {
      positivePoints: 10,
      negativePoints: 0,
      shuffleAnswers: true,
      shuffleQuestions: false,
      questionFont: defaultQuizTextStyle.fontFamily,
      answerFont: defaultQuizFontFamily,
      correctFeedback: tr("quiz.defaultCorrectFeedback"),
      incorrectFeedback: tr("quiz.defaultIncorrectFeedback"),
    },
    others: {
      passwordMode: "none",
      password: "",
      domain: "",
      metaDescription: "",
      metaKeywords: "",
    },
  };
}

export function createMockPlayerTemplate(): QuizPlayerTemplate {
  return {
    layout: "classic",
    showToolbar: true,
    showPanel: true,
    roundedCorners: true,
    rolledPaper: false,
    backgroundTone: "soft-blue",
    playerSize: "standard",
    accentColor: "#d12b2b",
    highlightColor: "#ffb35c",
    soundEffect: "subtle",
    textLabels: true,
  };
}

export function createEmptyQuizEditorGroups(): QuizEditorGroup[] {
  return [
    {
      id: "group-1",
      title: tr("quiz.sampleGroupPrefix") ? `${tr("quiz.sampleGroupPrefix")} 1` : "Nhóm câu hỏi 1",
      rule: "all",
      randomCount: 0,
      slides: [],
    },
  ];
}

export function createNewQuizProjectSettings(title?: string): QuizProjectSettings {
  const base = createMockQuizProjectSettings();
  return {
    ...base,
    info: {
      ...base.info,
      title: title || "Bài kiểm tra mới",
      introduction: "",
      page: {
        ...base.info.page,
        lessonTitle: "",
        testTitle: title || "Bài kiểm tra mới",
      },
    },
  };
}
