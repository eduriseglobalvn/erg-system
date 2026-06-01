import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import type {
  QuizEditorChoice,
  QuizEditorFeedbackRow,
  QuizEditorSlide,
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
