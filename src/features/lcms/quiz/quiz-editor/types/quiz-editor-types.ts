import type { MessageKey } from "@/platform/i18n";
import type { Question } from "@/lib/types";

export type QuestionType =
  | "multiple-choice"
  | "multiple-response"
  | "true-false"
  | "short-answer"
  | "numeric"
  | "sequence"
  | "matching"
  | "fill-in-the-blanks"
  | "select-from-lists"
  | "drag-the-words"
  | "hotspot"
  | "drag-and-drop"
  | "likert-scale"
  | "essay";

export type QuestionCreationPreset = "yes-no";

export type IntroSlideKind = "intro-slide" | "user-info" | "instruction-slide";

export type SlideKind = "info-slide" | "result-slide" | IntroSlideKind | QuestionType;

export type QuestionManagerFilter = "all" | SlideKind;

export type QuestionManagerGrouping = "type" | "group";

export type QuizEditorTextStyle = {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right" | "justify";
};

export type QuizEditorTextStyleTarget = "question" | "answer" | "textBox" | "feedback";

export type QuizEditorTextStyles = Partial<Record<QuizEditorTextStyleTarget, Partial<QuizEditorTextStyle>>>;

export type QuizInformationTheme =
  | "academic-wave"
  | "corporate-frame"
  | "creative-student"
  | "minimal-focus";

export type QuizInformationPage = {
  theme: QuizInformationTheme;
  organization: string;
  courseTitle: string;
  lessonTitle: string;
  testTitle: string;
  version: string;
  lecturer: string;
  contributors: string;
  startButtonLabel: string;
};

export type QuizEditorChoice = {
  id: string;
  label: string;
  correct: boolean;
  media?: QuizEditorSlideMedia | null;
};

export type QuizEditorSlideMedia = {
  type: "image";
  src: string;
  alt: string;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
};

export type QuizEditorDragDropItem = {
  id: string;
  label: string;
  emoji: string;
  target: string;
  media?: QuizEditorSlideMedia | null;
  targetMedia?: QuizEditorSlideMedia | null;
};

export type QuizEditorHotspotArea = {
  id: string;
  shape: "rect" | "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
  correct: boolean;
  visible?: boolean;
};

export type QuizEditorFeedbackBranching = "By Result" | "Next Question" | "Finish Quiz";

export type QuizEditorFeedbackRow = {
  id: string;
  kind: "correct" | "incorrect" | "answered";
  feedback: string;
  score: number;
  branching?: QuizEditorFeedbackBranching;
};

export type QuizEditorElementOffset = {
  x: number;
  y: number;
};

export type QuizEditorFinalSlideOptions = {
  whenQuizFinished: string;
  showUserScore: boolean;
  showPassingScore: boolean;
  allowReview: boolean;
  showCorrectAnswers: boolean;
  showDetailedReport: boolean;
  showResultsByGroup: boolean;
  showAnswerResults: boolean;
  allowPrintResults: boolean;
  allowRetry: boolean;
  retryLabel: string;
};

export type QuizEditorLayoutPreset =
  | "title-slide"
  | "title-only"
  | "section-header"
  | "title-and-content"
  | "title-and-two-content"
  | "comparison"
  | "title-and-picture"
  | "picture-with-caption"
  | "standard"
  | "centered"
  | "compact"
  | "side-panel-1"
  | "side-panel-2"
  | "side-panel-3"
  | "horizontal-1"
  | "horizontal-2"
  | "balanced-1"
  | "balanced-2"
  | "balanced-3";

export type QuizEditorSlideOptions = {
  questionType?: string;
  feedback?: string;
  branching?: string;
  score?: string;
  attempts?: number;
  layoutPreset?: QuizEditorLayoutPreset;
  themeColor?: string;
  answerColumns?: 1 | 2;
  animationPreset?: "none" | "appear" | "fade" | "float-in";
  elementOffsets?: Record<string, QuizEditorElementOffset>;
  limitTime?: boolean;
  timeLimit?: string;
  shuffleAnswers?: boolean;
  acceptPartial?: boolean;
  limitResponses?: boolean;
  limitResponsesValue?: number;
  displayQuizInstructions?: boolean;
  dragDrop?: {
    snapTo: string;
    snappingType: string;
    replacePrevious: boolean;
    enableReset: boolean;
    beforeNewAttempt: string;
  };
  matchingAuthoringMode?: "edit" | "practice";
  finalSlide?: QuizEditorFinalSlideOptions;
};

export type QuizEditorSlide = {
  id: string;
  title: string;
  kind: SlideKind;
  questionId?: string;
  bankQuestionId?: string;
  settings?: Record<string, unknown>;
  questionSettings?: Record<string, unknown>;
  questionSetSettings?: Record<string, unknown>;
  settingsOverride?: Record<string, unknown>;
  overrideSettings?: Record<string, unknown>;
  runtimeQuestion?: Question;
  description?: string;
  media?: QuizEditorSlideMedia | null;
  textStyle?: QuizEditorTextStyle;
  textStyles?: QuizEditorTextStyles;
  instructions?: string[];
  choices?: QuizEditorChoice[];
  choiceControlType?: "checkbox" | "radio";
  dragDropItems?: QuizEditorDragDropItem[];
  hotspotAreas?: QuizEditorHotspotArea[];
  feedbackRows?: QuizEditorFeedbackRow[];
  activeResultTab?: "passed" | "failed";
  finishAction?: string;
  options?: QuizEditorSlideOptions;
  layers?: string[];
  infoPage?: QuizInformationPage;
};

export type QuizProjectSettings = {
  info: {
    title: string;
    author: string;
    introduction: string;
    showIntroductionPage: boolean;
    showQuizStatistics: boolean;
    page: QuizInformationPage;
  };
  settings: {
    passingRate: number;
    enableTimeLimit: boolean;
    timeLimit: string;
    randomizeQuestionOrder: boolean;
    randomQuestionCount: number;
    answerSubmission: "one-by-one" | "all-at-once";
    showCorrectAnswersAfterSubmission: boolean;
    allowReview: boolean;
    oneAttemptOnly: boolean;
    promptResume: boolean;
  };
  result: {
    feedbackMode: "according-to-result" | "despite-the-result";
    passMessage: string;
    failMessage: string;
    reviewButtonLabel: string;
    thankYouMessage: string;
    showStatistics: boolean;
    showFinishButton: boolean;
    passRedirect: string;
    failRedirect: string;
    openInCurrentWindow: boolean;
  };
  questionDefaults: {
    positivePoints: number;
    negativePoints: number;
    shuffleAnswers: boolean;
    shuffleQuestions: boolean;
    questionFont: string;
    answerFont: string;
    correctFeedback: string;
    incorrectFeedback: string;
  };
  others: {
    passwordMode: "none" | "password" | "user-password";
    password: string;
    domain: string;
    metaDescription: string;
    metaKeywords: string;
  };
};

export type QuizPlayerTemplate = {
  layout: "classic" | "focus" | "split";
  showToolbar: boolean;
  showPanel: boolean;
  roundedCorners: boolean;
  rolledPaper: boolean;
  backgroundTone: "soft-blue" | "paper" | "contrast";
  playerSize: "standard" | "wide";
  accentColor: string;
  highlightColor: string;
  soundEffect: "subtle" | "off";
  textLabels: boolean;
};

export type GroupRule = "all" | "random" | "none";

export type QuizEditorGroup = {
  id: string;
  title: string;
  slides: QuizEditorSlide[];
  rule: GroupRule;
  randomCount: number;
};

export type SelectedEditorNode =
  | {
      type: "group";
      groupId: string;
    }
  | {
      type: "slide";
      groupId: string;
      slideId: string;
    }
  | {
      type: "result";
    };

export const questionTypeLabelKeys: Record<QuestionType, MessageKey> = {
  "multiple-choice": "quiz.multipleChoice",
  "multiple-response": "quiz.multipleResponse",
  "true-false": "quiz.trueFalse",
  "short-answer": "quiz.shortAnswer",
  numeric: "quiz.numeric",
  sequence: "quiz.sequence",
  matching: "quiz.matching",
  "fill-in-the-blanks": "quiz.fillInTheBlanks",
  "select-from-lists": "quiz.selectFromLists",
  "drag-the-words": "quiz.dragTheWords",
  hotspot: "quiz.hotspot",
  "drag-and-drop": "quiz.dragAndDrop",
  "likert-scale": "quiz.likertScale",
  essay: "quiz.essay",
};

export const introSlideLabelKeys: Record<IntroSlideKind, MessageKey> = {
  "intro-slide": "quiz.infoSlide",
  "user-info": "quiz.userInfo",
  "instruction-slide": "quiz.instructionSlide",
};

export function isQuestionType(kind: SlideKind): kind is QuestionType {
  return kind in questionTypeLabelKeys;
}

export function isIntroSlideKind(kind: SlideKind): kind is IntroSlideKind {
  return kind === "intro-slide" || kind === "user-info" || kind === "instruction-slide";
}

export function isQuestionManagerSlideKind(kind: SlideKind) {
  return kind !== "info-slide" && kind !== "result-slide";
}

export function getSlideKindLabelKey(kind: SlideKind): MessageKey {
  if (kind === "info-slide") return "quiz.infoSlide";
  if (kind === "result-slide") return "quiz.resultsLayer";
  if (isIntroSlideKind(kind)) return introSlideLabelKeys[kind];
  return questionTypeLabelKeys[kind];
}
