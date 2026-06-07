export const appFontStack = '"Segoe UI Variable", "Segoe UI", "Aptos", "Geist Variable", Arial, Helvetica, sans-serif';

export const quizFontStacks = {
  "Office 365": appFontStack,
} as const;

export const defaultQuizFontFamily = "Office 365";

export const quizEditorFontOptions = Object.keys(quizFontStacks) as Array<keyof typeof quizFontStacks>;

export function resolveQuizFontStack(fontFamily: string) {
  return quizFontStacks[fontFamily as keyof typeof quizFontStacks] ?? appFontStack;
}
