import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { tr } from "@/platform/i18n";
import {
  createMockChoice,
  createMockFeedbackRows,
  createMockFinalSlideOptions,
  createMockQuestionOptions,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type {
  IntroSlideKind,
  QuestionCreationPreset,
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
  preset: QuestionCreationPreset | undefined,
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
  const choiceLabels =
    type === "true-false" ? ["Đúng", "Sai"] : preset === "yes-no" ? [tr("player.yes"), tr("player.no")] : ["", "", ""];
  const choices = choiceLabels.map((label) => createChoice(createId("choice"), label));

  const isMatchQuestion = type === "matching" || type === "drag-and-drop";
  const matchItems: QuizEditorDragDropItem[] = [
    {
      id: createId("item"),
      label: "",
      emoji: "",
      target: "",
      media: null,
      targetMedia: null,
    },
  ];

  return {
    id: createId("slide"),
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
  };
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
