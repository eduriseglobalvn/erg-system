import { describe, expect, it } from "vitest";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  checkThemeContrast,
  contrastRatio,
  formatRatio,
  parseHexColor,
} from "@/features/lcms/quiz/quiz-theme/quiz-theme-contrast";
import { applyQuizThemePreset, quizThemePresets, quizThemeToneSurface } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";

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

const pairsOf = (id: string) => checkThemeContrast(applyQuizThemePreset(saved, quizThemePresets.find((p) => p.id === id)!));

describe("quiz theme contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
    expect(contrastRatio("#767676", "#fff")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("0071e3", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("x", "#fff")).toBeNull();
  });

  it("parses hex only", () => {
    expect(parseHexColor("#FFF")).toEqual([255, 255, 255]);
    expect(parseHexColor("red")).toBeNull();
  });

  it("flags chalkboard's white-on-amber button", () => {
    expect(pairsOf("chalkboard").find((p) => p.id === "onAccent-accent")?.pass).toBe(false);
  });

  it("passes every pair for the default template", () => {
    const pairs = pairsOf("erg-blue");
    expect(pairs).toHaveLength(3);
    expect(pairs.every((p) => p.pass)).toBe(true);
  });

  it("accepts the button text colour from the caller", () => {
    const dark = checkThemeContrast(applyQuizThemePreset(saved, quizThemePresets.find((p) => p.id === "chalkboard")!), "#000000");
    expect(dark.find((p) => p.id === "onAccent-accent")?.pass).toBe(true);
  });

  it("formats with a decimal comma", () => {
    expect(formatRatio(4.54)).toBe("4,5:1");
    expect(formatRatio(null)).toBe("—");
  });

  it("truncates instead of rounding up", () => {
    expect(formatRatio(4.49)).toBe("4,4:1");
    expect(formatRatio(4.5)).toBe("4,5:1");
    expect(formatRatio(2.999)).toBe("2,9:1");
  });

  it("fails highlight-bg when the highlight swallows the text", () => {
    const pairs = checkThemeContrast({ ...saved, highlightColor: "#1D1D1F" });
    expect(pairs.find((p) => p.id === "highlight-bg")?.pass).toBe(false);
  });

  it("fails text-bg when the tone text is too close to its background", () => {
    const original = quizThemeToneSurface["soft-blue"];
    quizThemeToneSurface["soft-blue"] = { ...original, text: "#EEEEEE", background: "#FFFFFF" };
    try {
      expect(checkThemeContrast(saved).find((p) => p.id === "text-bg")?.pass).toBe(false);
    } finally {
      quizThemeToneSurface["soft-blue"] = original;
    }
  });
});
