import { createInitialAnswer } from "@/lib/quiz";
import type { AnswerPayload, Question } from "@/lib/types";
import type { QuizEditorFeedbackRow, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type PreviewMode = "question" | "correct" | "incorrect";

export function createPreviewAnswer(question: Question, previewMode: PreviewMode): AnswerPayload {
  if (previewMode === "question") {
    return createInitialAnswer(question);
  }

  const correct = previewMode === "correct";

  switch (question.kind) {
    case "single_choice": {
      const choice = correct
        ? question.choices?.find((item) => item.correct)
        : question.choices?.find((item) => !item.correct) ?? question.choices?.[0];
      return choice ? { choiceId: choice.id } : {};
    }
    case "multiple_response": {
      const choices = question.choices?.filter((item) => (correct ? item.correct : !item.correct)) ?? [];
      return { choiceIds: choices.map((choice) => choice.id) };
    }
    case "matching": {
      const order = question.matching?.map((pair) => pair.id) ?? [];
      return { matchingOrder: correct ? order : [...order].reverse(), matchingConnectedRows: order };
    }
    case "sequence": {
      const order = question.sequenceItems?.map((item) => item.id) ?? [];
      return { sequenceOrder: correct ? order : [...order].reverse() };
    }
    case "inline_choice":
      return {
        inlineSelections: Object.fromEntries(
          (question.inlineBlanks ?? []).map((blank) => [
            blank.id,
            correct ? blank.correctOptionId : blank.options.find((option) => option !== blank.correctOptionId) ?? "",
          ]),
        ),
      };
    case "hotspot": {
      const area = question.hotspotAreas?.find((item) => item.correct);
      return {
        hotspotPoint:
          correct && area
            ? { x: area.x + area.width / 2, y: area.y + area.height / 2 }
            : { x: 0.12, y: 0.16 },
      };
    }
    default:
      return {};
  }
}

export function getFeedbackText(slide: QuizEditorSlide, previewMode: PreviewMode) {
  if (previewMode === "question") {
    return "";
  }

  return slide.feedbackRows?.find((row) =>
    previewMode === "correct" ? row.kind === "correct" : row.kind === "incorrect",
  )?.feedback;
}

export function updateFeedbackText(
  rows: QuizEditorFeedbackRow[] | undefined,
  previewMode: PreviewMode,
  feedback: string,
) {
  const targetKind: QuizEditorFeedbackRow["kind"] = previewMode === "correct" ? "correct" : "incorrect";
  const sourceRows: QuizEditorFeedbackRow[] = rows?.length
    ? rows
    : [
        { id: "feedback-correct", kind: "correct" as const, feedback: "", score: 10, branching: "By Result" as const },
        { id: "feedback-incorrect", kind: "incorrect" as const, feedback: "", score: 0, branching: "By Result" as const },
      ];

  if (sourceRows.some((row) => row.kind === targetKind)) {
    return sourceRows.map((row) => (row.kind === targetKind ? { ...row, feedback } : row));
  }

  return [
    ...sourceRows,
    {
      id: `feedback-${targetKind}`,
      kind: targetKind,
      feedback,
      score: targetKind === "correct" ? 10 : 0,
      branching: "By Result" as const,
    },
  ];
}

export function isInstructionLikeSlide(kind: QuizEditorSlide["kind"]) {
  return kind === "instruction-slide" || kind === "intro-slide" || kind === "info-slide" || kind === "user-info";
}
