import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { ChoiceGroup } from "@/features/lcms/quiz/quiz-theme/quiz-theme-controls";
import {
  PreviewBadge,
  PreviewButton,
  type PreviewDevice,
  type PreviewState,
  PreviewQuestionCard,
  PreviewQuestionList,
  usePreviewStyle,
} from "@/features/lcms/quiz/quiz-theme/quiz-theme-preview-parts";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const PHONE_WIDTH = 260;

type PreviewProps = { copy: QuizThemeCopy; value: QuizPlayerTemplate };

export function QuizThemePreview({ copy, value }: PreviewProps) {
  const style = usePreviewStyle(value);
  const [state, setState] = useState<PreviewState>("playing");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const phone = device === "phone";
  const SoundIcon = value.soundEffect === "off" ? VolumeOffRoundedIcon : VolumeUpRoundedIcon;

  return (
    <>
      <Typography variant="subtitle2" color="text.secondary">
        {copy.previewLabel}
      </Typography>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <ChoiceGroup<PreviewState> label={copy.preview.stateLabel} value={state} options={copy.preview.states} onChange={setState} />
        <ChoiceGroup<PreviewDevice> label={copy.preview.deviceLabel} value={device} options={copy.preview.devices} onChange={setDevice} />
      </Box>
      <Box
        data-device={device}
        sx={{
          background: style.tone.background,
          border: `1px solid ${t.color.border}`,
          borderRadius: `${t.radius.card}px`,
          // Phone is a narrow 260px mock with the question list hidden; desktop uses the full column width.
          maxWidth: phone ? PHONE_WIDTH : "none",
          minHeight: phone ? 440 : 360,
          mx: "auto",
          p: 2,
          width: "100%",
        }}
      >
        <Stack sx={{ gap: 1.5, height: "100%", mx: "auto", width: value.playerSize === "wide" || phone ? "100%" : "86%" }}>
          <Stack direction="row" sx={{ alignItems: "center", color: style.tone.text, gap: 1.25 }}>
            <PreviewBadge value={value} />
            <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
              {copy.preview.quizTitle}
            </Typography>
            <SoundIcon sx={{ color: style.tone.muted, fontSize: t.size.iconSm }} />
            <Typography variant="caption" sx={{ color: style.tone.muted }}>
              {copy.preview.progress}
            </Typography>
            <Box sx={{ bgcolor: style.tone.border, borderRadius: "3px", height: 6, overflow: "hidden", width: { xs: 60, sm: 120 } }}>
              <Box sx={{ bgcolor: value.accentColor, height: "100%", width: "30%" }} />
            </Box>
          </Stack>
          <Stack direction="row" sx={{ flex: 1, gap: 1.5, mx: "auto", width: value.layout === "focus" ? "80%" : "100%" }}>
            <PreviewQuestionCard copy={copy} value={value} state={state} phone={phone} />
            {value.layout === "classic" && !phone ? (
              <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                <PreviewQuestionList copy={copy} value={value} />
              </Box>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <MiniScreen caption={copy.preview.startScreen} value={value}>
          <PreviewBadge value={value} />
          <Typography variant="caption" sx={{ fontWeight: "fontWeightBold" }}>
            {copy.preview.quizTitle}
          </Typography>
          <Typography variant="caption" sx={{ color: style.tone.muted }}>
            {copy.preview.startMeta}
          </Typography>
          <PreviewButton label={copy.preview.start} value={value} primary />
        </MiniScreen>
        <MiniScreen caption={copy.preview.feedbackScreen} value={value}>
          <Box sx={{ bgcolor: t.color.successSoft, border: `1.5px solid ${t.color.success}`, borderRadius: style.radius(6), height: 22, width: "100%" }} />
          <Box sx={{ bgcolor: style.tone.card, border: `1.5px solid ${style.tone.border}`, borderRadius: style.radius(6), height: 22, width: "100%" }} />
          <Stack direction="row" sx={{ alignItems: "center", alignSelf: "stretch", bgcolor: t.color.surface, borderRadius: style.radius(7), color: t.color.success, gap: 0.75, px: 1, py: 0.5 }}>
            <CheckRoundedIcon sx={{ fontSize: t.size.iconSm }} />
            <Typography variant="caption" sx={{ fontWeight: "fontWeightMedium" }}>
              {copy.preview.correct}
            </Typography>
          </Stack>
        </MiniScreen>
        <MiniScreen caption={copy.preview.summaryScreen} value={value}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <ScoreRing value={value} />
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: "fontWeightBold" }}>
                {copy.preview.summaryTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: style.tone.muted }}>
                {copy.preview.summaryMeta}
              </Typography>
            </Stack>
          </Stack>
        </MiniScreen>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {copy.preview.note}
      </Typography>
    </>
  );
}

function MiniScreen({ caption, value, children }: { caption: string; value: QuizPlayerTemplate; children: ReactNode }) {
  const { tone } = usePreviewStyle(value);
  return (
    <Stack sx={{ gap: 0.75, minWidth: 0 }}>
      <Stack
        sx={{
          alignItems: "center",
          background: tone.background,
          border: `1px solid ${t.color.border}`,
          borderRadius: `${t.radius.control}px`,
          color: tone.text,
          gap: 0.75,
          height: 132,
          justifyContent: "center",
          px: 1.75,
        }}
      >
        {children}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {caption}
      </Typography>
    </Stack>
  );
}

function ScoreRing({ value }: { value: QuizPlayerTemplate }) {
  const { tone } = usePreviewStyle(value);
  const circumference = 2 * Math.PI * 26;
  return (
    <Box sx={{ display: "grid", flex: "none", height: 64, placeItems: "center", position: "relative", width: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style={{ inset: 0, position: "absolute" }}>
        <circle cx="32" cy="32" r="26" fill="none" stroke={tone.border} strokeWidth="8" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={value.accentColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${circumference * 0.8} ${circumference}`} transform="rotate(-90 32 32)" />
      </svg>
      <Typography variant="subtitle2">80</Typography>
    </Box>
  );
}
