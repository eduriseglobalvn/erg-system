import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { quizThemeToneSurface } from "@/components/quiz/player-template-surface";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import {
  type QuizPlayerThemePreset,
  type QuizThemeGroup,
  quizThemePresets,
} from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type Filter = QuizThemeGroup | "all";

const filters: Filter[] = ["all", "school", "exam", "fun", "dark"];

type QuizThemeLibraryProps = {
  copy: QuizThemeCopy;
  selectedId?: string;
  onPick(preset: QuizPlayerThemePreset): void;
};

export function QuizThemeLibrary({ copy, selectedId, onPick }: QuizThemeLibraryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = quizThemePresets.filter((preset) => filter === "all" || preset.group === filter);

  return (
    <>
      <Stack direction="row" role="group" aria-label={copy.libraryLabel} sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {filters.map((key) => (
          <Chip
            key={key}
            label={copy.groups[key]}
            size="small"
            clickable
            aria-pressed={filter === key}
            color={filter === key ? "primary" : "default"}
            variant={filter === key ? "filled" : "outlined"}
            onClick={() => setFilter(key)}
          />
        ))}
      </Stack>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {visible.map((preset) => {
          const selected = preset.id === selectedId;
          return (
            <ButtonBase
              key={preset.id}
              aria-pressed={selected}
              onClick={() => onPick(preset)}
              sx={{
                alignItems: "stretch",
                border: `1.5px solid ${selected ? t.color.primary : t.color.border}`,
                borderRadius: `${t.radius.card}px`,
                boxShadow: selected ? t.shadow.focus : "none",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                p: 0.75,
                textAlign: "left",
              }}
            >
              <PresetThumbnail preset={preset} selected={selected} />
              {/* Two lines: the cards are narrow, a shared line cut both labels. */}
              <Stack sx={{ minWidth: 0, px: 0.5 }}>
                <Typography variant="caption" noWrap sx={{ color: "text.primary", fontWeight: "fontWeightMedium" }}>
                  {copy.presets[preset.id]}
                </Typography>
                <Typography variant="caption" noWrap color="text.secondary">
                  {copy.groups[preset.group]}
                </Typography>
              </Stack>
            </ButtonBase>
          );
        })}
      </Box>
    </>
  );
}

function PresetThumbnail({ preset, selected }: { preset: QuizPlayerThemePreset; selected: boolean }) {
  const { accentColor, backgroundTone, roundedCorners } = preset.values;
  const tone = quizThemeToneSurface[backgroundTone];
  const line = (color: string, width = "100%") => ({ border: `1.5px solid ${color}`, borderRadius: "3px", height: 9, width });

  return (
    <Box sx={{ background: tone.background, borderRadius: "9px", display: "flex", flexDirection: "column", gap: 0.5, height: 72, justifyContent: "center", p: 1, position: "relative" }}>
      <Box sx={{ bgcolor: tone.card, border: `1px solid ${tone.border}`, borderRadius: roundedCorners ? "7px" : "2px", display: "flex", flexDirection: "column", gap: 0.4, p: 0.75 }}>
        <Box sx={{ bgcolor: tone.text, borderRadius: "3px", height: 5, opacity: 0.85, width: "80%" }} />
        <Box sx={line(accentColor)} />
        <Box sx={line(tone.border)} />
      </Box>
      <Box sx={{ alignSelf: "flex-end", bgcolor: accentColor, borderRadius: "4px", height: 8, width: 30 }} />
      {selected ? (
        <Box sx={{ bgcolor: "primary.main", borderRadius: "50%", boxShadow: `0 0 0 2px ${t.color.surface}`, color: "common.white", display: "grid", height: 18, placeItems: "center", position: "absolute", right: 6, top: 6, width: 18 }}>
          <CheckRoundedIcon sx={{ fontSize: t.size.iconSm - 4 }} />
        </Box>
      ) : null}
    </Box>
  );
}
