import { createMockPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { defaultQuizThemePreset, findMatchingQuizThemePreset } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";

/** Quizzes the editor created or normalized without a theme carry the built-in player default; that is "no theme chosen", not a customization. */
function isBuiltInDefault(template: QuizPlayerTemplate): boolean {
  const builtIn = createMockPlayerTemplate();
  return (Object.keys(defaultQuizThemePreset.values) as (keyof typeof defaultQuizThemePreset.values)[]).every((key) => template[key] === builtIn[key]);
}

/** Preset name when the template matches one exactly, "Tuỳ chỉnh" when it does not, the default preset name when there is no template. */
export function themeNameFor(template: QuizPlayerTemplate | null | undefined, copy: QuizThemeCopy): string {
  if (!template) return copy.presets[defaultQuizThemePreset.id];
  const preset = findMatchingQuizThemePreset(template);
  if (preset) return copy.presets[preset.id];
  return isBuiltInDefault(template) ? copy.defaultTheme : copy.custom;
}
