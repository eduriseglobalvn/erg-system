export const appFontStack = '"Geist Variable", "Segoe UI", Arial, Helvetica, sans-serif';

export const quizFontStacks = {
  Geist: appFontStack,
  "IBM Plex Sans": '"IBM Plex Sans", "Geist Variable", "Segoe UI", Arial, sans-serif',
  Merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
  Inter: '"Inter", "Geist Variable", "Segoe UI", Arial, sans-serif',
  "Source Sans 3": '"Source Sans 3", "Geist Variable", "Segoe UI", Arial, sans-serif',
  "DM Sans": '"DM Sans", "Geist Variable", "Segoe UI", Arial, sans-serif',
  Manrope: '"Manrope", "Geist Variable", "Segoe UI", Arial, sans-serif',
  Nunito: '"Nunito", "Geist Variable", "Segoe UI", Arial, sans-serif',
  "Fira Sans": '"Fira Sans", "Geist Variable", "Segoe UI", Arial, sans-serif',
  "Libre Baskerville": '"Libre Baskerville", Georgia, "Times New Roman", serif',
  "Playfair Display": '"Playfair Display", Georgia, "Times New Roman", serif',
} as const;

export const defaultQuizFontFamily = "Geist";

export const quizEditorFontOptions = Object.keys(quizFontStacks) as Array<keyof typeof quizFontStacks>;

export function resolveQuizFontStack(fontFamily: string) {
  return quizFontStacks[fontFamily as keyof typeof quizFontStacks] ?? appFontStack;
}
