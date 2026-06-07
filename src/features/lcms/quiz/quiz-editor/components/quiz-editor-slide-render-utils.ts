import type { CSSProperties } from "react";

import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorElementOffset,
  QuizEditorFeedbackRow,
  QuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  buildQuizTextStyle,
  defaultQuizTextStyle,
  recommendedQuizTextStyles,
  resolveSlideTextStyle,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";

const foodFallback = [
  { id: "food-1", emoji: "\u{1F95C}", label: "Almond", target: "healthy" },
  { id: "food-2", emoji: "\u{1F951}", label: "Avocado", target: "healthy" },
  { id: "food-3", emoji: "\u{1F357}", label: "Chicken", target: "unhealthy" },
  { id: "food-4", emoji: "\u{1F966}", label: "Broccoli", target: "healthy" },
  { id: "food-5", emoji: "\u{1F36A}", label: "Cookies", target: "unhealthy" },
  { id: "food-6", emoji: "\u{1F345}", label: "Tomatoes", target: "healthy" },
  { id: "food-7", emoji: "\u{1F95A}", label: "Eggs", target: "healthy" },
  { id: "food-8", emoji: "\u{1F9C1}", label: "Cupcake", target: "unhealthy" },
  { id: "food-9", emoji: "\u{1F35F}", label: "Chips", target: "unhealthy" },
]

export function buildElementOffsetStyle(offset?: QuizEditorElementOffset): CSSProperties | undefined {
  if (!offset) return undefined;

  return {
    left: `${offset.x * 100}%`,
    top: `${offset.y * 100}%`,
  };
}

export function togglePreviewChoice(
  choices: QuizEditorChoice[],
  choiceId: string,
  controlType: "checkbox" | "radio",
) {
  if (controlType === "radio") {
    return choices.map((choice) => ({ ...choice, correct: choice.id === choiceId }));
  }

  return choices.map((choice) =>
    choice.id === choiceId ? { ...choice, correct: !choice.correct } : choice,
  );
}

export function clampOffset(value: number) {
  return Math.max(-0.45, Math.min(0.45, value));
}

export function toRenderableDragItems(items?: QuizEditorDragDropItem[]) {
  return items?.length ? items : foodFallback;
}

export function getFeedbackRow(rows: QuizEditorFeedbackRow[], mode: "correct" | "incorrect") {
  return rows.find((row) => row.kind === mode) ?? rows[0] ?? null;
}

export function buildPreviewTitleStyle(slide: QuizEditorSlide, baseSize: number) {
  return buildPreviewTextStyle(slide, "question", baseSize);
}

export function buildPreviewTextStyle(
  slide: QuizEditorSlide,
  target: "question" | "answer" | "textBox" | "feedback",
  baseSize: number,
) {
  const textStyle = resolveSlideTextStyle(slide, target);
  const referenceSize = recommendedQuizTextStyles[target].fontSize ?? defaultQuizTextStyle.fontSize;
  const scaledSize = Math.max(11, Math.round((baseSize * textStyle.fontSize) / referenceSize));

  return buildQuizTextStyle(textStyle, {
    fontSize: `${scaledSize}px`,
  });
}
