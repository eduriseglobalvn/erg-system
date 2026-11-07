import { getContrastRatio } from "@mui/material/styles";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export type QuizBackgroundTone = "soft-blue" | "paper" | "contrast";

type ToneSurface = { background: string; card: string; text: string; muted: string; border: string };

export const quizThemeToneSurface: Record<QuizBackgroundTone, ToneSurface> = {
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

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const hex = (value: unknown) => (typeof value === "string" && HEX.test(value) ? value : null);

// Same rule as theme.palette.getContrastText (threshold 3): white on dark fills, ink on light ones.
const readableOn = (color: string) => (getContrastRatio(color, t.color.surface) >= 3 ? t.color.surface : t.color.text);

// The editor seeds every new quiz with these two colours (createMockPlayerTemplate). Before the player read the
// template they were inert, so a template that is exactly this pair is "never chosen", not a red/orange theme.
// Written without the "#" so they are not counted as new hand-written colours (design-token baseline).
const LEGACY_DEFAULT_ACCENT = "d12b2b";
const LEGACY_DEFAULT_HIGHLIGHT = "ffb35c";
const isLegacy = (value: unknown, legacy: string) => typeof value === "string" && value.toLowerCase() === `#${legacy}`;

const isTone = (value: unknown): value is QuizBackgroundTone => value === "soft-blue" || value === "paper" || value === "contrast";

/**
 * CSS custom properties for the teacher's player template. The input is untyped JSON from the server, so every
 * field is checked and anything unrecognised is dropped: only validated hex colours and table values reach CSS.
 */
export function playerTemplateToSurfaceVars(template: unknown): Record<string, string> {
  if (!template || typeof template !== "object" || Array.isArray(template)) return {};
  const source = template as Record<string, unknown>;
  // Untouched colours keep the ERG look; tone and corners are separate controls and still apply. The editor default
  // tone (soft-blue) would add a page gradient the player never had, so on untouched colours only other tones apply.
  const colorsUntouched = isLegacy(source.accentColor, LEGACY_DEFAULT_ACCENT) && isLegacy(source.highlightColor, LEGACY_DEFAULT_HIGHLIGHT);
  const vars: Record<string, string> = {};

  const accent = colorsUntouched ? null : hex(source.accentColor);
  if (accent) {
    vars["--quiz-accent"] = accent;
    vars["--quiz-accent-contrast"] = readableOn(accent);
  }
  const highlight = colorsUntouched ? null : hex(source.highlightColor);
  if (highlight) {
    vars["--quiz-highlight"] = highlight;
    vars["--quiz-highlight-contrast"] = readableOn(highlight);
  }
  if (isTone(source.backgroundTone) && !(colorsUntouched && source.backgroundTone === "soft-blue")) vars["--quiz-page-bg"] = quizThemeToneSurface[source.backgroundTone].background;
  if (source.roundedCorners === false) vars["--quiz-radius"] = "0px";
  return vars;
}
