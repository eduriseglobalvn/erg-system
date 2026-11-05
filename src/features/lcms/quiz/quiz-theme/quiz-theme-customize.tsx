import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ErgButton } from "@/components/erg-mui";
import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ChoiceGroup, SwatchPicker } from "@/features/lcms/quiz/quiz-theme/quiz-theme-controls";
import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { quizThemePresets, quizThemeToneSurface } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type QuizThemeCustomizeProps = {
  copy: QuizThemeCopy;
  title: string;
  value: QuizPlayerTemplate;
  onChange(patch: Partial<QuizPlayerTemplate>): void;
  onUndo(): void;
};

// One swatch per distinct preset color, named after the first template that uses it.
const swatchesOf = (key: "accentColor" | "highlightColor", copy: QuizThemeCopy) =>
  [...new Map(quizThemePresets.map((preset) => [preset.values[key].toLowerCase(), copy.presets[preset.id]])).entries()]
    .map(([color, name]) => ({ color, name }));

export function QuizThemeCustomize({ copy, title, value, onChange, onUndo }: QuizThemeCustomizeProps) {
  return (
    <>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary", flex: 1 }}>
          {title}
        </Typography>
        <ErgButton variant="text" color="inherit" size="small" onClick={onUndo}>
          {copy.undo}
        </ErgButton>
      </Stack>

      <Section title={copy.colorSection} defaultExpanded>
        <ChoiceGroup
          label={copy.backgroundTone}
          value={value.backgroundTone}
          options={copy.tones}
          adornment={(tone) => <Box sx={{ background: quizThemeToneSurface[tone].background, border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.xs}px`, height: 24, width: "100%" }} />}
          onChange={(backgroundTone) => onChange({ backgroundTone })}
        />
        <SwatchPicker label={copy.accentColor} otherLabel={copy.otherColor} value={value.accentColor} swatches={swatchesOf("accentColor", copy)} onChange={(accentColor) => onChange({ accentColor })} />
        <SwatchPicker label={copy.highlightColor} otherLabel={copy.otherColor} value={value.highlightColor} swatches={swatchesOf("highlightColor", copy)} onChange={(highlightColor) => onChange({ highlightColor })} />
      </Section>

      <Section title={copy.layoutSection} summary={`${copy.layouts[value.layout]} · ${copy.sizes[value.playerSize]}`}>
        <ChoiceGroup label={copy.layout} value={value.layout} options={copy.layouts} onChange={(layout) => onChange({ layout })} />
        <ChoiceGroup label={copy.playerSize} value={value.playerSize} options={copy.sizes} onChange={(playerSize) => onChange({ playerSize })} />
      </Section>

      <Section title={copy.optionSection}>
        <FormControlLabel
          control={<Switch checked={value.roundedCorners} onChange={(event) => onChange({ roundedCorners: event.target.checked })} />}
          label={<Typography variant="body2">{copy.roundedCorners}</Typography>}
        />
        <FormControlLabel
          control={<Switch checked={value.textLabels} onChange={(event) => onChange({ textLabels: event.target.checked })} />}
          label={<Typography variant="body2">{copy.textLabels}</Typography>}
        />
      </Section>

      <Section title={copy.soundSection} summary={copy.sounds[value.soundEffect]}>
        <ChoiceGroup label={copy.soundSection} value={value.soundEffect} options={copy.sounds} onChange={(soundEffect) => onChange({ soundEffect })} />
      </Section>
    </>
  );
}

function Section({ title, summary, defaultExpanded, children }: { title: string; summary?: string; defaultExpanded?: boolean; children: ReactNode }) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={defaultExpanded}
      sx={{ border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.card}px !important`, "&::before": { display: "none" } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {summary ? (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            {summary}
          </Typography>
        ) : null}
      </AccordionSummary>
      <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
