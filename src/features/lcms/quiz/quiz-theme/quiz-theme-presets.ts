import { amber, blue, deepOrange, deepPurple, green, orange } from "@mui/material/colors";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type QuizThemeValues = Pick<
  QuizPlayerTemplate,
  "layout" | "backgroundTone" | "accentColor" | "highlightColor" | "playerSize" | "roundedCorners" | "textLabels" | "soundEffect"
>;

export type QuizThemeGroup = "default" | "school" | "exam" | "fun" | "dark";

export type QuizPlayerThemePreset = { id: string; group: QuizThemeGroup; values: QuizThemeValues };

const base: QuizThemeValues = {
  layout: "classic",
  backgroundTone: "soft-blue",
  accentColor: t.color.primary,
  highlightColor: t.color.primarySofter,
  playerSize: "standard",
  roundedCorners: true,
  textLabels: true,
  soundEffect: "subtle",
};

// Player data, not UI chrome: accent/highlight feed <input type="color">, so they must resolve to #rrggbb.
// ERG tokens where one fits; MUI's named palette for hues the ERG tokens do not have.
export const quizThemePresets = [
  { id: "erg-blue", group: "default", values: base },
  { id: "sky", group: "school", values: { ...base, layout: "focus", playerSize: "wide", highlightColor: t.color.primarySoft } },
  { id: "grid-paper", group: "school", values: { ...base, backgroundTone: "paper", accentColor: t.statusTint.warning.color, highlightColor: orange[50], roundedCorners: false } },
  { id: "chalkboard", group: "school", values: { ...base, backgroundTone: "contrast", accentColor: amber[300], highlightColor: green[900] } },
  { id: "exam-room", group: "exam", values: { ...base, layout: "split", backgroundTone: "paper", accentColor: t.color.text, highlightColor: t.color.divider, roundedCorners: false, soundEffect: "off" } },
  { id: "night", group: "dark", values: { ...base, backgroundTone: "contrast", accentColor: blue[300], highlightColor: blue[900], playerSize: "wide" } },
  { id: "summer", group: "fun", values: { ...base, layout: "focus", backgroundTone: "paper", accentColor: deepOrange[700], highlightColor: deepOrange[50] } },
  { id: "forest", group: "school", values: { ...base, accentColor: t.color.success, highlightColor: t.statusTint.success.bg } },
  { id: "lavender", group: "fun", values: { ...base, layout: "focus", accentColor: deepPurple[400], highlightColor: deepPurple[50] } },
] as const satisfies readonly QuizPlayerThemePreset[];

export type QuizThemePresetId = (typeof quizThemePresets)[number]["id"];

export const defaultQuizThemePreset = quizThemePresets[0];

/** Picking a template overwrites every template field and keeps the rest (toolbar, panel, paper). */
export function applyQuizThemePreset(value: QuizPlayerTemplate, preset: QuizPlayerThemePreset): QuizPlayerTemplate {
  return { ...value, ...preset.values };
}

const sameField = (a: unknown, b: unknown) =>
  typeof a === "string" && typeof b === "string" ? a.toLowerCase() === b.toLowerCase() : a === b;

export function findMatchingQuizThemePreset(value: QuizPlayerTemplate) {
  return quizThemePresets.find((preset) =>
    (Object.keys(preset.values) as (keyof QuizThemeValues)[]).every((key) => sameField(preset.values[key], value[key])),
  );
}

type ToneSurface = { background: string; card: string; text: string; muted: string; border: string };

export const quizThemeToneSurface: Record<QuizPlayerTemplate["backgroundTone"], ToneSurface> = {
  "soft-blue": {
    background: `linear-gradient(165deg, ${t.color.primarySoft} 0%, ${t.color.surface} 100%)`,
    card: t.color.surface,
    text: t.color.text,
    muted: t.color.textMuted,
    border: t.color.border,
  },
  paper: { background: t.statusTint.warning.bg, card: t.color.surface, text: t.color.text, muted: t.color.textMuted, border: t.color.border },
  contrast: { background: t.color.text, card: "rgba(255, 255, 255, 0.08)", text: t.color.surface, muted: t.color.textSoft, border: "rgba(255, 255, 255, 0.24)" },
};
