import type { CSSProperties } from "react";

import {
  defaultQuizFontFamily,
  resolveQuizFontStack,
} from "@/config/fonts";
import type {
  QuizEditorSlide,
  QuizEditorTextStyle,
  QuizEditorTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export const defaultQuizTextStyle: QuizEditorTextStyle = {
  fontFamily: defaultQuizFontFamily,
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
  align: "left",
};

export { quizEditorFontOptions } from "@/config/fonts";

export const quizEditorFontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32] as const;

export const recommendedQuizTextStyles: Record<QuizEditorTextStyleTarget, QuizEditorTextStyle> = {
  question: {
    fontFamily: defaultQuizFontFamily,
    fontSize: 22,
    bold: true,
    italic: false,
    underline: false,
    align: "left",
  },
  answer: {
    fontFamily: defaultQuizFontFamily,
    fontSize: 18,
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  },
  textBox: {
    fontFamily: defaultQuizFontFamily,
    fontSize: 18,
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  },
  feedback: {
    fontFamily: defaultQuizFontFamily,
    fontSize: 18,
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  },
};

export function resolveSlideTextStyle(
  slide: Pick<QuizEditorSlide, "textStyle" | "textStyles"> | null | undefined,
  target: QuizEditorTextStyleTarget,
): QuizEditorTextStyle {
  const rootStyle = slide?.textStyle ?? {};
  const slotStyle = slide?.textStyles?.[target] ?? {};

  return {
    ...defaultQuizTextStyle,
    ...(target === "question" ? rootStyle : {}),
    ...slotStyle,
  };
}

export function buildQuizTextStyle(
  textStyle?: Partial<QuizEditorTextStyle>,
  overrides?: Partial<CSSProperties>,
): CSSProperties {
  const style = { ...defaultQuizTextStyle, ...textStyle };

  return {
    fontFamily: resolveQuizFontStack(style.fontFamily),
    fontSize: `${style.fontSize}px`,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textAlign: style.align,
    ...overrides,
  };
}
