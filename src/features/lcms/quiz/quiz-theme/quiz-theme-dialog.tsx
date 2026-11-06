import Box from "@mui/material/Box";
import { useState } from "react";

import { ErgButton, ErgDialog, ErgStatusChip } from "@/components/erg-mui";
import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { checkThemeContrast } from "@/features/lcms/quiz/quiz-theme/quiz-theme-contrast";
import { QuizThemeCustomize } from "@/features/lcms/quiz/quiz-theme/quiz-theme-customize";
import { enCopy, viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { QuizThemeLibrary } from "@/features/lcms/quiz/quiz-theme/quiz-theme-library";
import {
  applyQuizThemePreset,
  defaultQuizThemePreset,
  findMatchingQuizThemePreset,
} from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { QuizThemePreview } from "@/features/lcms/quiz/quiz-theme/quiz-theme-preview";
import { usePreviewStyle } from "@/features/lcms/quiz/quiz-theme/quiz-theme-preview-parts";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type QuizThemeDialogProps = {
  open: boolean;
  value: QuizPlayerTemplate;
  onClose(): void;
  onApply(next: QuizPlayerTemplate): void;
};

/** Theme picker for a quiz: edits stay local until "Áp dụng". Mounting only while open resets the draft each time. */
export function QuizThemeDialog(props: QuizThemeDialogProps) {
  return props.open ? <QuizThemeDialogBody {...props} /> : null;
}

const column = { display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 } as const;

function QuizThemeDialogBody({ value, onClose, onApply }: QuizThemeDialogProps) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [draft, setDraft] = useState(value);
  const matched = findMatchingQuizThemePreset(draft);
  // Same on-accent colour the preview draws, so the verdict matches what the learner sees.
  const contrast = checkThemeContrast(draft, usePreviewStyle(draft).onAccent);
  const failing = contrast.filter((pair) => !pair.pass).length;
  const customizeTitle = matched ? copy.customizeFrom(copy.presets[matched.id]) : copy.custom;

  return (
    <ErgDialog
      open
      maxWidth="lg"
      onClose={onClose}
      title={
        <>
          {copy.title}
          <ErgStatusChip
            component="span"
            status={failing ? "warning" : "success"}
            label={failing ? copy.contrast.chipFail(failing) : copy.contrast.chipPass}
            sx={{ ml: 1.5, verticalAlign: "middle" }}
          />
        </>
      }
      description={copy.description}
      actions={
        <>
          <ErgButton variant="text" color="inherit" onClick={() => setDraft(applyQuizThemePreset(draft, defaultQuizThemePreset))}>
            {copy.resetDefault}
          </ErgButton>
          <Box sx={{ flex: 1 }} />
          <ErgButton variant="text" onClick={onClose}>
            {copy.cancel}
          </ErgButton>
          <ErgButton onClick={() => onApply(draft)}>{copy.apply}</ErgButton>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)", lg: "280px 320px minmax(0, 1fr)" },
        }}
      >
        <Box component="section" aria-label={copy.libraryLabel} sx={column}>
          <QuizThemeLibrary copy={copy} selectedId={matched?.id} onPick={(preset) => setDraft(applyQuizThemePreset(draft, preset))} />
        </Box>
        <Box
          component="section"
          aria-label={customizeTitle}
          sx={{ ...column, bgcolor: t.color.surfaceMuted, borderRadius: `${t.radius.card}px`, p: 1.5 }}
        >
          <QuizThemeCustomize
            copy={copy}
            title={customizeTitle}
            value={draft}
            contrast={contrast}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
            onUndo={() => setDraft(value)}
          />
        </Box>
        <Box component="section" aria-label={copy.previewLabel} sx={{ ...column, gridColumn: { md: "1 / -1", lg: "auto" } }}>
          <QuizThemePreview copy={copy} value={draft} />
        </Box>
      </Box>
    </ErgDialog>
  );
}
