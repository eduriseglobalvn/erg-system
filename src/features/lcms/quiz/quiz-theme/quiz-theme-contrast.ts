import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { quizThemeToneSurface } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export type ContrastPair = {
  id: "text-bg" | "onAccent-accent" | "highlight-bg";
  ratio: number | null;
  min: 4.5 | 3;
  pass: boolean;
};

/** Accepts #rgb / #rrggbb, with or without the leading #. Anything else (names, rgba, gradients) is null. */
export function parseHexColor(input: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(fg: string, bg: string): number | null {
  const a = parseHexColor(fg);
  const b = parseHexColor(bg);
  if (!a || !b) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// shortcut: a gradient background is judged by its first stop (the darker one for soft-blue); upgrade if tones get gradients where that is not the worst case.
const solidOf = (background: string) => /#[0-9a-f]{6}/i.exec(background)?.[0] ?? background;

/** MUI's dark contrast text is rgba(0, 0, 0, 0.87): flatten it onto the fill so the ratio is the one the eye sees. */
function flattenOnto(fg: string, bg: string): string {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(fg.trim());
  const base = parseHexColor(bg);
  if (!m || !base) return fg;
  const a = m[4] === undefined ? 1 : Number(m[4]);
  const hex = [1, 2, 3].map((i, k) => Math.round(Number(m[i]) * a + base[k] * (1 - a)).toString(16).padStart(2, "0"));
  return `#${hex.join("")}`;
}

/**
 * `onAccent` is the text colour the player draws on accent fills; white unless the caller
 * resolves it from the MUI theme (palette.getContrastText), as the preview does.
 */
export function checkThemeContrast(tpl: QuizPlayerTemplate, onAccent: string = t.color.surface): ContrastPair[] {
  const tone = quizThemeToneSurface[tpl.backgroundTone] ?? quizThemeToneSurface["soft-blue"];
  const pair = (id: ContrastPair["id"], fg: string, bg: string, min: ContrastPair["min"]): ContrastPair => {
    const ratio = contrastRatio(fg, bg);
    return { id, ratio, min, pass: ratio !== null && ratio >= min };
  };
  return [
    pair("text-bg", tone.text, solidOf(tone.background), 4.5),
    pair("onAccent-accent", flattenOnto(onAccent, tpl.accentColor), tpl.accentColor, 4.5),
    pair("highlight-bg", tone.text, tpl.highlightColor, 3),
  ];
}

export function formatRatio(r: number | null): string {
  // Truncate, never round: 4.4999 must not read "4,5:1" next to a fail mark.
  return r === null ? "—" : `${(Math.floor(r * 10 + 1e-9) / 10).toFixed(1).replace(".", ",")}:1`;
}
