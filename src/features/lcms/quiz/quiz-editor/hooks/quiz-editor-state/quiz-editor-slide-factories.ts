import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import type { Question } from "@/domain/quiz/types";
import { likertPresetLabels } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/likert-presets";
import { tr } from "@/platform/i18n";
import {
  createMockChoice,
  createMockFeedbackRows,
  createMockFinalSlideOptions,
  createMockQuestionOptions,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type {
  IntroSlideKind,
  QuestionType,
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorSlide,
  QuizEditorSlideOptions,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

function createChoice(id: string, label: string, correct = false): QuizEditorChoice {
  return createMockChoice(id, label, correct);
}

function createFeedbackRows(correct: string, incorrect: string): QuizEditorFeedbackRow[] {
  return createMockFeedbackRows(correct, incorrect);
}

function createQuestionOptions(
  patch: Partial<QuizEditorSlideOptions> = {},
): QuizEditorSlideOptions {
  return createMockQuestionOptions(patch);
}

export function createFinalSlideOptions(): QuizEditorFinalSlideOptions {
  return createMockFinalSlideOptions();
}

type CreateId = (prefix: string) => string;

export function buildQuestionSlide(
  type: QuestionType,
  quizProject: QuizProjectSettings,
  createId: CreateId,
): QuizEditorSlide {
  const defaultFeedbackRows = createFeedbackRows(
    quizProject.questionDefaults.correctFeedback,
    quizProject.questionDefaults.incorrectFeedback,
  ).map((row) =>
    row.kind === "correct"
      ? { ...row, score: quizProject.questionDefaults.positivePoints }
      : { ...row, score: quizProject.questionDefaults.negativePoints },
  );

  // A new question starts empty so placeholder text can never count as authored content.
  const choiceLabels = type === "true-false" ? ["Đúng", "Sai"] : ["", "", ""];
  // A sequence slide mirrors its steps as choices (all "correct"), matching what the runtime sync writes back.
  const choices = type === "sequence"
    ? choiceLabels.map((label) => createChoice(createId("step"), label, true))
    : choiceLabels.map((label) => createChoice(createId("choice"), label));

  const isMatchQuestion = type === "matching" || type === "drag-and-drop";
  const id = createId("slide");
  const runtimeQuestion = buildRuntimeQuestion(type, id, choices, quizProject.questionDefaults.positivePoints, createId);
  // Mirrors the pairs as mapRuntimeDragDropItems writes them; classification starts with no items.
  const matchItems: QuizEditorDragDropItem[] = (runtimeQuestion?.matching ?? []).map((pair) => ({
    id: pair.id,
    label: "",
    emoji: "",
    target: "",
    media: null,
    targetMedia: null,
  }));

  return {
    id,
    title: "",
    kind: type,
    textStyle: {
      ...defaultQuizTextStyle,
      fontFamily: quizProject.questionDefaults.questionFont,
    },
    textStyles: {
      answer: {
        fontFamily: quizProject.questionDefaults.answerFont,
      },
    },
    choiceControlType: type === "multiple-choice" || type === "true-false" ? "radio" : "checkbox",
    choices: isMatchQuestion ? [] : choices,
    dragDropItems: isMatchQuestion ? matchItems : undefined,
    feedbackRows: defaultFeedbackRows,
    options: createQuestionOptions({
      shuffleAnswers: quizProject.questionDefaults.shuffleAnswers,
      matchingAuthoringMode: isMatchQuestion ? "edit" : undefined,
    }),
    ...(runtimeQuestion ? { runtimeQuestion } : {}),
  };
}

// Only kinds that have an authoring surface get a runtime question up front.
function buildRuntimeQuestion(
  type: QuestionType,
  id: string,
  choices: QuizEditorChoice[],
  points: number,
  createId: CreateId,
): Question | undefined {
  const base = { id, title: "", points, feedback: { correct: "", incorrect: "", partial: "" } };
  const runtimeChoices = choices.map(({ id: choiceId, label, correct }) => ({ id: choiceId, label, correct }));
  switch (type) {
    case "multiple-response":
      return { ...base, kind: "multiple_response", choices: runtimeChoices };
    case "true-false":
      return { ...base, kind: "true_false", choices: runtimeChoices };
    case "likert-scale":
      return {
        ...base,
        kind: "likert_scale",
        likertScale: likertPresetLabels("agree", 5).map((label, index) => ({ id: `scale-${index + 1}`, label, value: index + 1 })),
        likertRows: [{ id: createId("row"), label: "" }],
      };
    case "sequence": {
      const sequenceItems = choices.map(({ id: stepId, label }) => ({ id: stepId, label }));
      return { ...base, kind: "sequence", sequenceItems, sequenceCorrectOrder: sequenceItems.map((item) => item.id) };
    }
    case "fill-in-the-blanks":
      return { ...base, kind: "fill_blank", textBlanks: [] };
    case "select-from-lists":
      return { ...base, kind: "select_from_lists", inlineBlanks: [] };
    case "drag-the-words":
      return { ...base, kind: "drag_words", wordSlots: [], wordBank: [] };
    case "short-answer":
      return { ...base, kind: "short_answer", textBlanks: [] };
    case "numeric":
      return { ...base, kind: "numeric" };
    case "matching":
      return {
        ...base,
        kind: "matching",
        matching: [1, 2].map(() => ({ id: createId("pair"), prompt: "", response: "" })),
      };
    case "drag-and-drop":
      return {
        ...base,
        kind: "drag_drop",
        dropTargets: [1, 2].map(() => ({ id: createId("group"), label: "" })),
        dragDropItems: [],
      };
    case "hotspot":
      return { ...base, kind: "hotspot", hotspotAreas: [] };
    case "essay":
      return { ...base, kind: "essay", essayRubric: [] };
    default:
      return undefined;
  }
}

export function buildIntroductionSlide(type: IntroSlideKind, createId: CreateId): QuizEditorSlide {
  const titleByType: Record<IntroSlideKind, string> = {
    "intro-slide": tr("quiz.introWelcome"),
    "user-info": tr("quiz.userInfo"),
    "instruction-slide": tr("quiz.introInstruction"),
  };

  return {
    id: createId("slide"),
    title: titleByType[type],
    kind: type,
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
  };
}
