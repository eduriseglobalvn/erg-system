import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { quizThemeToneSurface } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Colors and radii the preview derives from the draft template. */
export function usePreviewStyle(value: QuizPlayerTemplate) {
  const { palette } = useTheme();
  // Saved templates may carry a color MUI cannot parse; fall back instead of crashing the dialog.
  const contrastText = (color: string) => {
    try {
      return palette.getContrastText(color);
    } catch {
      return t.color.text;
    }
  };
  return {
    tone: quizThemeToneSurface[value.backgroundTone] ?? quizThemeToneSurface["soft-blue"],
    radius: (px: number) => (value.roundedCorners ? `${px}px` : "2px"),
    onAccent: contrastText(value.accentColor),
    onHighlight: contrastText(value.highlightColor),
  };
}

export type PreviewState = keyof QuizThemeCopy["preview"]["states"];
export type PreviewDevice = keyof QuizThemeCopy["preview"]["devices"];

type PreviewProps = { copy: QuizThemeCopy; value: QuizPlayerTemplate };

const RIGHT_OPTION = 1;
const WRONG_OPTION = 0;

/** Opaque light fills with their own dark text: readable on every theme, including the dark "contrast" tone. */
const fixedLook = {
  right: { tint: t.statusTint.success, border: t.color.success },
  wrong: { tint: t.statusTint.error, border: t.color.danger },
} as const;

/** How an option reads in each state; right/wrong colors are fixed tokens, never theme colors. */
function optionRole(state: PreviewState, index: number) {
  if (state === "playing") return index === RIGHT_OPTION ? "selected" : null;
  if (index === RIGHT_OPTION) return "right";
  return state === "wrong" && index === WRONG_OPTION ? "wrong" : null;
}

export function PreviewBadge({ value }: { value: QuizPlayerTemplate }) {
  const style = usePreviewStyle(value);
  return (
    <Box sx={{ bgcolor: value.accentColor, borderRadius: style.radius(7), color: style.onAccent, px: 1, py: 0.25 }}>
      <Typography variant="caption" sx={{ fontWeight: "fontWeightBold", letterSpacing: "0.04em" }}>
        ERG
      </Typography>
    </Box>
  );
}

export function PreviewButton({ label, value, primary }: { label: string; value: QuizPlayerTemplate; primary?: boolean }) {
  const style = usePreviewStyle(value);
  return (
    <Box
      sx={{
        bgcolor: primary ? value.accentColor : style.tone.card,
        border: `1px solid ${primary ? value.accentColor : style.tone.border}`,
        borderRadius: style.radius(t.radius.control),
        color: primary ? style.onAccent : style.tone.text,
        px: 1.75,
        py: 0.75,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: "fontWeightMedium" }}>
        {label}
      </Typography>
    </Box>
  );
}

export function PreviewQuestionCard({ copy, value, state, phone }: PreviewProps & { state: PreviewState; phone: boolean }) {
  const style = usePreviewStyle(value);
  const options = (
    <Stack sx={{ gap: 0.75 }}>
      {copy.preview.options.map((option, index) => {
        const role = optionRole(state, index);
        const selected = role === "selected";
        const fixed = role === "right" || role === "wrong" ? fixedLook[role] : null;
        return (
          <Stack
            key={option}
            direction="row"
            sx={{
              alignItems: "center",
              bgcolor: fixed ? fixed.tint.bg : selected ? value.highlightColor : style.tone.card,
              border: `1.5px solid ${fixed ? fixed.border : selected ? value.accentColor : style.tone.border}`,
              borderRadius: style.radius(12),
              color: fixed ? fixed.tint.color : selected ? style.onHighlight : style.tone.text,
              gap: 1.25,
              px: 1.5,
              py: 0.75,
            }}
          >
            {value.textLabels ? (
              <Box
                component="span"
                sx={{
                  bgcolor: selected ? value.accentColor : "transparent",
                  border: `1.5px solid ${selected ? value.accentColor : style.tone.border}`,
                  borderRadius: "50%",
                  color: fixed ? fixed.tint.color : selected ? style.onAccent : style.tone.muted,
                  display: "grid",
                  flex: "none",
                  height: 22,
                  placeItems: "center",
                  width: 22,
                }}
              >
                <Typography variant="caption">{String.fromCharCode(65 + index)}</Typography>
              </Box>
            ) : null}
            <Typography variant="body2" sx={{ flex: 1 }}>{option}</Typography>
            {fixed ? (
              <Typography variant="caption" sx={{ color: fixed.tint.color, fontWeight: "fontWeightBold" }}>
                {role === "right" ? copy.preview.correctAnswer : copy.preview.yourChoice}
              </Typography>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );

  return (
    <Stack sx={{ bgcolor: style.tone.card, border: `1px solid ${style.tone.border}`, borderRadius: style.radius(16), flex: 1, gap: 1.25, minWidth: 0, p: 2.25 }}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: value.layout === "split" && !phone ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)" }}>
        <Stack sx={{ gap: 1 }}>
          <Typography variant="caption" sx={{ color: value.accentColor, fontWeight: "fontWeightBold" }}>
            {copy.preview.questionType}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: style.tone.text }}>
            {copy.preview.question}
          </Typography>
        </Stack>
        {options}
      </Box>
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <PreviewButton label={copy.preview.previous} value={value} />
        <PreviewButton label={copy.preview.next} value={value} primary />
      </Stack>
    </Stack>
  );
}

export function PreviewQuestionList({ copy, value }: PreviewProps) {
  const style = usePreviewStyle(value);
  return (
    <Stack sx={{ bgcolor: style.tone.card, border: `1px solid ${style.tone.border}`, borderRadius: style.radius(16), flex: "0 0 150px", gap: 1, p: 1.5 }}>
      <Typography variant="caption" sx={{ color: style.tone.text, fontWeight: "fontWeightMedium" }}>
        {copy.preview.questionList}
      </Typography>
      <Box sx={{ display: "grid", gap: 0.625, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {Array.from({ length: 10 }, (_, index) => {
          const answered = index < 2;
          const current = index === 2;
          return (
            <Box
              key={index}
              sx={{
                bgcolor: answered ? value.accentColor : style.tone.card,
                border: `1.5px solid ${answered || current ? value.accentColor : style.tone.border}`,
                borderRadius: style.radius(7),
                color: answered ? style.onAccent : current ? value.accentColor : style.tone.muted,
                display: "grid",
                height: 26,
                placeItems: "center",
              }}
            >
              <Typography variant="caption">{index + 1}</Typography>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
