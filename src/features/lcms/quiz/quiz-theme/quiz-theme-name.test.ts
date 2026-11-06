import { describe, expect, it } from "vitest";

import { createMockPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { applyQuizThemePreset, quizThemePresets } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { themeNameFor } from "@/features/lcms/quiz/quiz-theme/quiz-theme-name";

const chalkboard = quizThemePresets.find((preset) => preset.id === "chalkboard")!;

describe("themeNameFor", () => {
  it("names a template that matches a preset", () => {
    expect(themeNameFor(applyQuizThemePreset(createMockPlayerTemplate(), chalkboard), viCopy)).toBe(viCopy.presets.chalkboard);
  });

  it("calls a template that matches no preset Tuỳ chỉnh", () => {
    expect(themeNameFor({ ...createMockPlayerTemplate(), accentColor: "#123456" }, viCopy)).toBe("Tuỳ chỉnh");
  });

  it("falls back to the default preset name when there is no template", () => {
    expect(themeNameFor(null, viCopy)).toBe(viCopy.presets["erg-blue"]);
    expect(themeNameFor(undefined, viCopy)).toBe(viCopy.presets["erg-blue"]);
  });
});
