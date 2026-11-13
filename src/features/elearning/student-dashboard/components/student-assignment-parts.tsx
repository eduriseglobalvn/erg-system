import type { ComponentType, ReactNode } from "react";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import Box from "@mui/material/Box";
import type { SvgIconProps } from "@mui/material/SvgIcon";

import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type Tone = { bg: string; fg: string; Icon: ComponentType<SvgIconProps> };

const TONES: Record<"math" | "lit" | "eng" | "sci", Tone> = {
  eng: { bg: t.statusTint.success.bg, fg: t.color.success, Icon: TranslateRoundedIcon },
  lit: { bg: t.statusTint.warning.bg, fg: t.color.warning, Icon: MenuBookRoundedIcon },
  math: { bg: t.statusTint.info.bg, fg: t.color.primary, Icon: CalculateRoundedIcon },
  sci: { bg: t.statusTint.neutral.bg, fg: t.statusTint.neutral.color, Icon: ScienceRoundedIcon },
};

function subjectTone(label = ""): Tone {
  const v = label.toLowerCase();
  if (v.includes("văn")) return TONES.lit;
  if (v.includes("anh")) return TONES.eng;
  if (v.includes("khtn") || v.includes("khoa học")) return TONES.sci;
  return TONES.math;
}

/** Subject tile (canvas H10): tinted square with the subject icon; tests use the quiz icon. */
export function SubjectIcon({ assignment, size = 32 }: { assignment: StudentDashboardAssignment; size?: number }) {
  const tone = subjectTone(assignment.subjectLabel);
  const Icon = assignment.kind === "TEST" ? QuizRoundedIcon : tone.Icon;
  return (
    <Box aria-hidden sx={{ alignItems: "center", bgcolor: tone.bg, borderRadius: `${t.radius.md}px`, color: tone.fg, display: "flex", flexShrink: 0, height: size, justifyContent: "center", width: size }}>
      <Icon sx={{ fontSize: t.size.iconMd }} />
    </Box>
  );
}

const PILL = {
  error: { bg: t.statusTint.error.bg, fg: t.statusTint.error.color },
  info: { bg: t.statusTint.info.bg, fg: t.statusTint.info.color },
  muted: { bg: t.statusTint.neutral.bg, fg: t.statusTint.neutral.color },
  ok: { bg: t.statusTint.success.bg, fg: t.statusTint.success.color },
  warn: { bg: t.statusTint.warning.bg, fg: t.statusTint.warning.color },
} as const;
export type PillTone = keyof typeof PILL;

/** Rounded status pill: due chip, XP reward, "Không còn XP". */
export function Pill({ children, icon, tone, block = false }: { children: ReactNode; icon?: ReactNode; tone: PillTone; block?: boolean }) {
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: PILL[tone].bg, borderRadius: `${t.radius.chip}px`, color: PILL[tone].fg, display: block ? "flex" : "inline-flex", gap: 0.5, minHeight: 28, px: 1.25, typography: "subtitle2", whiteSpace: "nowrap", width: block ? "100%" : undefined }}>
      {icon}
      {children}
    </Box>
  );
}

export function ProgressBar({ percent, color = t.color.primary, label }: { percent: number; color?: string; label?: string }) {
  return (
    <Box aria-label={label} aria-valuemax={100} aria-valuemin={0} aria-valuenow={percent} role="progressbar" sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, flex: 1, height: 6, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ bgcolor: color, borderRadius: `${t.radius.chip}px`, height: "100%", width: `${percent}%` }} />
    </Box>
  );
}

/** Card surface: 1px border, no shadow (CLAUDE.md). */
export const boardCardSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, overflow: "hidden" } as const;
