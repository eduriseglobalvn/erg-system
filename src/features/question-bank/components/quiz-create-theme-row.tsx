import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui";
import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { enCopy as enThemeCopy, viCopy as viThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { QuizThemeDialog } from "@/features/lcms/quiz/quiz-theme/quiz-theme-dialog";
import { findMatchingQuizThemePreset, quizThemeToneSurface } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";

const bar = { height: 5, borderRadius: `${t.radius.xs / 2}px` } as const;

/** Current quiz theme (name + mini swatch) with a button that opens the shared theme picker. */
export function QuizCreateThemeRow({ copy, value, onChange }: {
  copy: QuestionBankCopy;
  value: QuizPlayerTemplate;
  onChange: (value: QuizPlayerTemplate) => void;
}) {
  const { locale } = useI18n();
  const themeCopy = locale === "vi" ? viThemeCopy : enThemeCopy;
  const [open, setOpen] = useState(false);
  const preset = findMatchingQuizThemePreset(value);
  const tone = quizThemeToneSurface[value.backgroundTone];
  const name = [preset ? themeCopy.presets[preset.id] : themeCopy.custom, themeCopy.layouts[value.layout], themeCopy.sizes[value.playerSize]].join(" · ");

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, px: 1.5, py: 1.25, border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.card}px` }}>
      <Box aria-hidden sx={{ background: tone.background, borderRadius: `${t.radius.sm}px`, display: "flex", flex: "none", flexDirection: "column", gap: 0.5, height: 44, p: 0.875, width: 64 }}>
        <Box sx={{ ...bar, bgcolor: tone.text, width: "70%" }} />
        <Box sx={{ ...bar, bgcolor: tone.card }} />
        <Box sx={{ ...bar, bgcolor: value.accentColor }} />
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">{copy.themeLabel}</Typography>
        <Typography variant="body2" noWrap>{name}</Typography>
      </Stack>
      <ErgButton variant="text" onClick={() => setOpen(true)}>{copy.changeThemeAction}</ErgButton>
      <QuizThemeDialog open={open} value={value} onClose={() => setOpen(false)} onApply={(next) => { onChange(next); setOpen(false); }} />
    </Stack>
  );
}
