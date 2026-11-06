import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { defaultQuizThemePreset, findMatchingQuizThemePreset } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";

/** Preset name when the template matches one exactly, "Tuỳ chỉnh" when it does not, the default preset name when there is no template. */
export function themeNameFor(template: QuizPlayerTemplate | null | undefined, copy: QuizThemeCopy): string {
  if (!template) return copy.presets[defaultQuizThemePreset.id];
  const preset = findMatchingQuizThemePreset(template);
  return preset ? copy.presets[preset.id] : copy.custom;
}
