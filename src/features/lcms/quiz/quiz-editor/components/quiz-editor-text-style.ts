import { defaultQuizFontFamily } from "@/config/fonts";
import type { QuizEditorTextStyle } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export const defaultQuizTextStyle: QuizEditorTextStyle = {
  fontFamily: defaultQuizFontFamily,
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
  align: "left",
};
