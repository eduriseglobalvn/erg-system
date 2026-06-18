import { defaultQuizFontFamily, resolveQuizFontStack } from "@/config/fonts";
import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { defaultQuizTheme } from "@/features/lcms/quiz/quiz-theme";
import { tr } from "@/platform/i18n";
import type {
  QuizEditorChoice,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorGroup,
  QuizEditorSlide,
  QuizEditorSlideOptions,
  QuizPlayerTemplate,
  QuizProjectSettings,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuizEditorMockProjectPayload = {
  groups: QuizEditorGroup[];
  resultSlide: QuizEditorSlide;
  quizProject: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  selectedThemeId: string;
  selectedNode: SelectedEditorNode;
};

const hotspotMockImageSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500">
    <rect width="900" height="500" fill="#f8fafc" />
    <circle cx="275" cy="250" r="110" fill="#86efac" />
    <circle cx="625" cy="250" r="110" fill="#fecaca" />
    <text
      x="275"
      y="265"
      text-anchor="middle"
      font-family="${resolveQuizFontStack(defaultQuizFontFamily)}"
      font-size="40"
      fill="#166534"
    >
      Fruit
    </text>
    <text
      x="625"
      y="265"
      text-anchor="middle"
      font-family="${resolveQuizFontStack(defaultQuizFontFamily)}"
      font-size="40"
      fill="#991b1b"
    >
      Candy
    </text>
  </svg>
`.replace(/\s{2,}/g, " ").trim();

const hotspotMockImageDataUrl = `data:image/svg+xml,${encodeURIComponent(hotspotMockImageSvg)}`;

export function createMockQuizEditorProject(): QuizEditorMockProjectPayload {
  return {
    groups: createMockQuizEditorGroups(),
    resultSlide: createMockResultSlide(),
    quizProject: createMockQuizProjectSettings(),
    playerTemplate: createMockPlayerTemplate(),
    selectedThemeId: defaultQuizTheme.id,
    selectedNode: createMockSelectedEditorNode(),
  };
}

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

export function createMockFinalSlideOptions(): QuizEditorFinalSlideOptions {
  return {
    whenQuizFinished: tr("quiz.showSlideWithResults"),
    showUserScore: false,
    showPassingScore: false,
    allowReview: false,
    showCorrectAnswers: false,
    showDetailedReport: false,
    showResultsByGroup: false,
    showAnswerResults: false,
    allowPrintResults: false,
    allowRetry: false,
    retryLabel: tr("quiz.retryOnce"),
  };
}

export function createMockQuizProjectSettings(): QuizProjectSettings {
  return {
    info: {
      title: tr("quiz.sampleQuizTitle"),
      author: "ERG Teacher Hub",
      introduction: tr("quiz.sampleProjectIntroduction"),
      showIntroductionPage: true,
      showQuizStatistics: true,
      page: {
        theme: "academic-wave",
        organization: "ERG Teacher Hub",
        courseTitle: "IC3 GS6 Level 2",
        lessonTitle: "Chu de 1: Can ban ve cong nghe",
        testTitle: "Test 1",
        version: "Version 1.0",
        lecturer: "Nguyen Phat Tai",
        contributors: "Tong Thanh Nhan\nNguyen Hoang Minh\nTran Hoang Trinh\nTran Van Khanh Duy",
        startButtonLabel: "Start Quiz",
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
      reviewButtonLabel: "REVIEW QUIZ",
      thankYouMessage: "Thank you!",
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

export function createMockQuizEditorGroups(): QuizEditorGroup[] {
  return [
    {
      id: "group-intro",
      title: tr("quiz.introGroup"),
      rule: "all",
      randomCount: 0,
      slides: [
        {
          id: "slide-intro-1",
          title: tr("quiz.sampleQuizTitle"),
          kind: "instruction-slide",
          instructions: [
            tr("quiz.instructionBullet1"),
            tr("quiz.instructionBullet2"),
            tr("quiz.instructionBullet3"),
            tr("quiz.instructionBullet4"),
          ],
          textStyle: defaultQuizTextStyle,
          options: {
            displayQuizInstructions: true,
          },
        },
      ],
    },
    {
      id: "group-1",
      title: `${tr("quiz.sampleGroupPrefix")} 1`,
      rule: "all",
      randomCount: 0,
      slides: [
        createMultipleResponseSlide(),
        createMultipleChoiceSlide(),
        createTrueFalseSlide(),
        createDragAndDropSlide(),
        createMatchingSlide(),
        createSequenceSlide(),
        createFillInTheBlanksSlide(),
        createSelectFromListsSlide(),
        createDragTheWordsSlide(),
        createHotspotSlide(),
        createShortAnswerSlide(),
        createNumericSlide(),
        createLikertSlide(),
        createEssaySlide(),
      ],
    },
  ];
}

export function createMockResultSlide(): QuizEditorSlide {
  return {
    id: "slide-results",
    title: tr("common.quizResults"),
    kind: "result-slide",
    textStyle: defaultQuizTextStyle,
    activeResultTab: "passed",
    finishAction: tr("quiz.closeBrowserWindow"),
    options: {
      finalSlide: createMockFinalSlideOptions(),
    },
    layers: [tr("quiz.resultsLayer")],
  };
}

export function createMockSelectedEditorNode(): SelectedEditorNode {
  return {
    type: "slide",
    groupId: "group-1",
    slideId: "slide-drag-drop",
  };
}

function createBaseQuestion(
  patch: Omit<QuizEditorSlide, "feedbackRows" | "options" | "layers"> & {
    feedbackRows?: QuizEditorFeedbackRow[];
    options?: QuizEditorSlideOptions;
    layers?: string[];
  },
): QuizEditorSlide {
  return {
    textStyle: defaultQuizTextStyle,
    feedbackRows: createMockFeedbackRows(tr("quiz.defaultCorrectFeedback"), tr("quiz.defaultIncorrectFeedback")),
    options: createMockQuestionOptions({ shuffleAnswers: true }),
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback")],
    ...patch,
  };
}

function createMultipleResponseSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-multiple-response",
    title: tr("quiz.sampleQuestion1"),
    kind: "multiple-response",
    choiceControlType: "checkbox",
    choices: [
      createMockChoice("choice-potatoes", tr("quiz.sampleChoicePotatoes"), true),
      createMockChoice("choice-apples", tr("quiz.sampleChoiceApples"), true),
      createMockChoice("choice-baked-beans", tr("quiz.sampleChoiceBakedBeans"), true),
      createMockChoice("choice-pasta", tr("quiz.sampleChoiceWholegrainPasta"), true),
    ],
    feedbackRows: createMockFeedbackRows(
      tr("quiz.sampleFeedbackFiberCorrect"),
      tr("quiz.sampleFeedbackFiberIncorrect"),
    ),
    options: createMockQuestionOptions({
      shuffleAnswers: true,
      limitResponses: true,
      limitResponsesValue: 4,
    }),
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.multipleResponse")],
  });
}

function createMultipleChoiceSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-multiple-choice",
    title: "A slice of toast has fewer calories than a slice of bread.",
    kind: "multiple-choice",
    choiceControlType: "radio",
    choices: [
      createMockChoice("choice-toast-true", tr("quiz.sampleChoiceTrue"), false),
      createMockChoice("choice-toast-false", tr("quiz.sampleChoiceFalse"), true),
    ],
    feedbackRows: createMockFeedbackRows(tr("quiz.sampleFeedbackCalories"), tr("quiz.sampleFeedbackCalories")),
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.multipleChoice")],
  });
}

function createTrueFalseSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-true-false",
    title: "Fresh fruit and vegetables can be part of a balanced breakfast.",
    kind: "true-false",
    choiceControlType: "radio",
    choices: [
      createMockChoice("choice-true", tr("quiz.sampleChoiceTrue"), true),
      createMockChoice("choice-false", tr("quiz.sampleChoiceFalse"), false),
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.trueFalse")],
  });
}

function createDragAndDropSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-drag-drop",
    title: tr("quiz.sampleQuestion3"),
    kind: "drag-and-drop",
    textStyle: { ...defaultQuizTextStyle, fontSize: 16, bold: true },
    dragDropItems: [
      { id: "item-broccoli", label: tr("quiz.sampleFoodBroccoli"), emoji: "🥦", target: tr("quiz.sampleTargetHealthy") },
      { id: "item-eggs", label: tr("quiz.sampleFoodBoiledEggs"), emoji: "🥚", target: tr("quiz.sampleTargetHealthy") },
      { id: "item-tomatoes", label: tr("quiz.sampleFoodTomatoes"), emoji: "🍅", target: tr("quiz.sampleTargetHealthy") },
      { id: "item-avocado", label: tr("quiz.sampleFoodAvocado"), emoji: "🥑", target: tr("quiz.sampleTargetHealthy") },
      { id: "item-almond", label: tr("quiz.sampleFoodAlmond"), emoji: "🥜", target: tr("quiz.sampleTargetHealthy") },
      { id: "item-cookies", label: tr("quiz.sampleFoodCookies"), emoji: "🍪", target: tr("quiz.sampleTargetUnhealthy") },
      { id: "item-chips", label: tr("quiz.sampleFoodChips"), emoji: "🍟", target: tr("quiz.sampleTargetUnhealthy") },
      { id: "item-cupcake", label: tr("quiz.sampleFoodCupcake"), emoji: "🧁", target: tr("quiz.sampleTargetUnhealthy") },
      { id: "item-chicken", label: tr("quiz.sampleFoodFriedChicken"), emoji: "🍗", target: tr("quiz.sampleTargetUnhealthy") },
    ],
    feedbackRows: createMockFeedbackRows(
      tr("quiz.sampleFeedbackHealthyFoods"),
      tr("quiz.sampleFeedbackHealthyFoods"),
    ),
    options: createMockQuestionOptions({
      shuffleAnswers: true,
      dragDrop: {
        snapTo: "Any drop target",
        snappingType: "Stack random",
        replacePrevious: false,
        enableReset: false,
        beforeNewAttempt: "Leave drag items in place",
      },
    }),
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.dragDropQuestion")],
  });
}

function createMatchingSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-matching",
    title: "Match each learning activity with the best tool.",
    kind: "matching",
    dragDropItems: [
      { id: "match-video", label: "Short explainer", emoji: "🎬", target: "Video" },
      { id: "match-poll", label: "Quick opinion check", emoji: "📊", target: "Poll" },
      { id: "match-file", label: "Reference handout", emoji: "📄", target: "Document" },
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.matching")],
  });
}

function createSequenceSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-sequence",
    title: "Put the lesson planning steps in the correct order.",
    kind: "sequence",
    choices: [
      createMockChoice("sequence-objective", "Write the learning objective", true),
      createMockChoice("sequence-activity", "Choose the classroom activity", true),
      createMockChoice("sequence-check", "Design the check for understanding", true),
      createMockChoice("sequence-feedback", "Prepare feedback", true),
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.sequence")],
  });
}

function createFillInTheBlanksSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-fill-blanks",
    title: "Complete the sentence: Fiber helps support ____.",
    kind: "fill-in-the-blanks",
    choices: [
      createMockChoice("blank-digestion", "digestion", true),
      createMockChoice("blank-sleep", "sleep", false),
      createMockChoice("blank-speed", "speed", false),
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.fillInTheBlanks")],
  });
}

function createSelectFromListsSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-select-lists",
    title: "Select the best category for each food.",
    kind: "select-from-lists",
    choices: [
      createMockChoice("list-broccoli", "Broccoli -> vegetable", true),
      createMockChoice("list-cookie", "Cookie -> dessert", true),
      createMockChoice("list-avocado", "Avocado -> fruit", true),
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.selectFromLists")],
  });
}

function createDragTheWordsSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-drag-words",
    title: "Drag the words into the correct nutrition sentence.",
    kind: "drag-the-words",
    choices: [
      createMockChoice("word-balanced", "balanced", true),
      createMockChoice("word-energy", "energy", true),
      createMockChoice("word-fiber", "fiber", true),
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.dragTheWords")],
  });
}

function createHotspotSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-hotspot",
    title: "Click the area that shows a healthy food option.",
    kind: "hotspot",
    media: {
      type: "image",
      src: hotspotMockImageDataUrl,
      alt: "Fruit and candy hotspot mock image",
      name: "hotspot-mock.svg",
    },
    hotspotAreas: [
      {
        id: "hotspot-fruit",
        shape: "rect",
        x: 0.18,
        y: 0.28,
        width: 0.24,
        height: 0.44,
        correct: true,
      },
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.hotspot")],
  });
}

function createShortAnswerSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-short-answer",
    title: "Name one healthy snack you can prepare quickly.",
    kind: "short-answer",
    choices: [createMockChoice("short-answer-example", "fruit", true)],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.shortAnswer")],
  });
}

function createNumericSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-numeric",
    title: "How many servings of fruit are shown?",
    kind: "numeric",
    choices: [createMockChoice("numeric-answer", "3", true)],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.numeric")],
  });
}

function createLikertSlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-likert",
    title: "Rate your confidence explaining balanced nutrition.",
    kind: "likert-scale",
    choices: [
      createMockChoice("likert-low", "Not confident yet", false),
      createMockChoice("likert-mid", "Somewhat confident", true),
      createMockChoice("likert-high", "Very confident", true),
    ],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.likertScale")],
  });
}

function createEssaySlide(): QuizEditorSlide {
  return createBaseQuestion({
    id: "slide-essay",
    title: "Explain how you would teach healthy food choices to your class.",
    kind: "essay",
    choices: [createMockChoice("essay-rubric", "Mention examples, categories, and learner action.", true)],
    layers: [tr("quiz.correctFeedback"), tr("quiz.incorrectFeedback"), tr("quiz.essay")],
  });
}
