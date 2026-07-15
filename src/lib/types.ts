export type Theme = {
  pageBackground: string;
  playerBackground: string;
  canvasBorder: string;
  headerBackground: string;
  headerText: string;
  accentStart: string;
  accentEnd: string;
  optionText: string;
  optionSelectedBackground: string;
  inputBackground: string;
  sidebarActiveBackground: string;
  sidebarActiveText: string;
};

export type QuizSettings = {
  mode: "training" | "testing";
  timeLimitMinutes?: number;
  passPercent: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  revealFeedbackPerStep: boolean;
};

export type QuizResultDisplay = {
  passMessage: string;
  failMessage: string;
  reviewButtonLabel: string;
  thankYouMessage: string;
  showReviewButton: boolean;
  submitAllPrompt: string;
  confirmSubmitPrompt: string;
  submitAllLabel: string;
  returnToQuizLabel: string;
  confirmYesLabel: string;
  confirmNoLabel: string;
};

export type Feedback = {
  correct: string;
  incorrect: string;
  partial: string;
};

export type QuestionImage = {
  url: string;
  alt?: string;
  width?: number;
};

export type Choice = {
  id: string;
  label: string;
  correct: boolean;
};

export type MatchingPair = {
  id: string;
  prompt: string;
  response: string;
  promptIcon?: string;
  responseIcon?: string;
  promptImage?: QuestionImage;
  responseImage?: QuestionImage;
};

export type SequenceItem = {
  id: string;
  label: string;
  image?: QuestionImage;
};

export type InlineBlank = {
  id: string;
  statement: string;
  options: string[];
  correctOptionId: string;
  selectPosition?: "before" | "after";
};

export type TextBlank = {
  id: string;
  label: string;
  correctAnswers: string[];
  placeholder?: string;
  prefix?: string;
  suffix?: string;
};

export type NumericAnswer = {
  correctValue: number;
  tolerance?: number;
  unit?: string;
};

export type DragWord = {
  id: string;
  label: string;
};

export type DragWordSlot = {
  id: string;
  label: string;
  correctWordId: string;
};

export type DropTarget = {
  id: string;
  label: string;
};

export type DragDropItem = {
  id: string;
  label: string;
  correctTargetId: string;
};

export type LikertScalePoint = {
  id: string;
  label: string;
  value: number;
};

export type LikertRow = {
  id: string;
  label: string;
};

export type EssayRubricCriterion = {
  id: string;
  label: string;
  points: number;
};

export type HotspotArea = {
  id: string;
  shape: "rect" | "ellipse" | "polygon";
  x: number;
  y: number;
  width: number;
  height: number;
  correct: boolean;
  visible?: boolean;
};

export type HotspotImage = {
  url: string;
  width: number;
  height: number;
};

export type QuestionKind =
  | "single_choice"
  | "multiple_response"
  | "true_false"
  | "short_answer"
  | "numeric"
  | "matching"
  | "sequence"
  | "fill_blank"
  | "inline_choice"
  | "select_from_lists"
  | "drag_words"
  | "hotspot"
  | "drag_drop"
  | "likert_scale"
  | "essay";

export type Question = {
  id: string;
  kind: QuestionKind;
  title: string;
  instructions?: string;
  points: number;
  feedback: Feedback;
  contentImage?: QuestionImage;
  choices?: Choice[];
  matching?: MatchingPair[];
  sequenceItems?: SequenceItem[];
  inlineBlanks?: InlineBlank[];
  textBlanks?: TextBlank[];
  numericAnswer?: NumericAnswer;
  wordBank?: DragWord[];
  wordSlots?: DragWordSlot[];
  dropTargets?: DropTarget[];
  dragDropItems?: DragDropItem[];
  likertRows?: LikertRow[];
  likertScale?: LikertScalePoint[];
  essayRubric?: EssayRubricCriterion[];
  hotspotImage?: HotspotImage;
  hotspotAreas?: HotspotArea[];
};

export type Section = {
  id: string;
  title: string;
  questions: Question[];
};

export type Quiz = {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  description: string;
  themeId: string;
  theme: Theme;
  settings: QuizSettings;
  result?: QuizResultDisplay;
  sections: Section[];
};

export type QuizSummary = {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  sectionCount: number;
  questionCount: number;
};

export type HotspotPoint = {
  x: number;
  y: number;
};

export type AnswerPayload = {
  choiceId?: string;
  choiceIds?: string[];
  matchingOrder?: string[];
  matchingAssignments?: Record<string, string>;
  matchingConnectedRows?: string[];
  sequenceOrder?: string[];
  inlineSelections?: Record<string, string>;
  textResponses?: Record<string, string>;
  numericValue?: string;
  dragWordPlacements?: Record<string, string>;
  dragDropPlacements?: Record<string, string>;
  likertResponses?: Record<string, string>;
  essayText?: string;
  hotspotPoint?: HotspotPoint;
};

export type AnswerResult = {
  questionId: string;
  correct: boolean;
  partiallyRight: boolean;
  awardedPoints: number;
  maxPoints: number;
  message: string;
  correctChoiceIds?: string[];
  correctMatchingOrder?: string[];
  correctSequenceOrder?: string[];
  correctInlineSelections?: Record<string, string>;
  correctTextResponses?: Record<string, string>;
  correctNumericValue?: string;
  correctDragWordPlacements?: Record<string, string>;
  correctDragDropPlacements?: Record<string, string>;
};

export type AnswerRecord = {
  questionId: string;
  input: AnswerPayload;
  result: AnswerResult;
};

export type Attempt = {
  id: string;
  quizId: string;
  submittedCount: number;
  totalQuestions: number;
  totalScore: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  answers: Record<string, AnswerRecord>;
};

export type QuizPackage = {
  id: string;
  quizId: string;
  quizVersion: string;
  generatedAt: string;
  expiresAt?: string;
  contentHash: string;
  signature?: string;
  publicKeyId?: string;
  gradingMode: "client-first" | "server-authoritative";
  source: "local" | "server" | "tauri-cache";
  quiz: Quiz;
};

export type AttemptEventType =
  | "attempt_started"
  | "answer_graded"
  | "attempt_submitted"
  | "sync_failed"
  | "sync_succeeded";

export type AttemptEvent = {
  id: string;
  attemptId: string;
  quizId: string;
  packageId: string;
  type: AttemptEventType;
  createdAt: string;
  questionId?: string;
  answer?: AnswerPayload;
  result?: AnswerResult;
  attemptSnapshot?: Attempt;
  meta?: Record<string, unknown>;
};

export type AttemptSyncStatus = "pending" | "synced" | "failed";

export type AttemptSession = {
  attempt: Attempt;
  package: QuizPackage;
  events: AttemptEvent[];
  syncStatus: AttemptSyncStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
};

export type AttemptSyncPayload = {
  attemptId: string;
  quizId: string;
  packageId: string;
  packageHash: string;
  quizVersion: string;
  submittedAt?: string;
  attempt: Attempt;
  events: AttemptEvent[];
  client: {
    runtime: "web" | "tauri";
    gradingStrategy: "client-first" | "server-authoritative";
    appVersion?: string;
  };
};

export type StudentProgressStatus = "not_started" | "in_progress" | "submitted";

export type StudentProgress = {
  id: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  mode: QuizSettings["mode"];
  status: StudentProgressStatus;
  currentQuestionIndex: number;
  currentQuestionTitle: string;
  answeredCount: number;
  totalQuestions: number;
  percentComplete: number;
  score: number | null;
  passed: boolean | null;
  startedAt: string | null;
  submittedAt: string | null;
  lastActiveAt: string;
};
