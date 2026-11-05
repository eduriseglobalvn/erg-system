import { describe, expect, it } from "vitest";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  applyQuizThemePreset,
  findMatchingQuizThemePreset,
  quizThemePresets,
} from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";

const saved: QuizPlayerTemplate = {
  layout: "classic",
  showToolbar: false,
  showPanel: true,
  roundedCorners: true,
  rolledPaper: true,
  backgroundTone: "soft-blue",
  playerSize: "standard",
  accentColor: "#d12b2b",
  highlightColor: "#ffb35c",
  soundEffect: "subtle",
  textLabels: true,
};

describe("quiz theme presets", () => {
  it("has nine templates with unique ids and unique values", () => {
    expect(quizThemePresets).toHaveLength(9);
    expect(new Set(quizThemePresets.map((preset) => preset.id)).size).toBe(9);
    for (const preset of quizThemePresets) {
      expect(findMatchingQuizThemePreset(applyQuizThemePreset(saved, preset))?.id).toBe(preset.id);
    }
  });

  it("overwrites template fields and keeps the rest", () => {
    const night = quizThemePresets.find((preset) => preset.id === "night")!;
    const next = applyQuizThemePreset(saved, night);
    expect(next).toMatchObject(night.values);
    expect(next).toMatchObject({ showToolbar: false, showPanel: true, rolledPaper: true });
  });

  it("matches colors case-insensitively and reports custom values as no match", () => {
    expect(findMatchingQuizThemePreset(saved)).toBeUndefined();
    const sky = applyQuizThemePreset(saved, quizThemePresets[1]);
    expect(findMatchingQuizThemePreset({ ...sky, highlightColor: sky.highlightColor.toUpperCase() })?.id).toBe("sky");
    expect(findMatchingQuizThemePreset({ ...sky, soundEffect: "off" })).toBeUndefined();
  });
});
