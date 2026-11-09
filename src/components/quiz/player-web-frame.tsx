import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Fragment, type ReactNode } from "react";

import type { QuestionKind } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

/** Web player frame (WL1–WL5): top bar, optional progress line, centred two-column main. */
export const quizAccent = `var(--quiz-accent, ${tk.color.primary})`;

export const webCardSx = {
  bgcolor: `var(--quiz-player-bg, ${tk.color.surface})`,
  border: "1px solid",
  borderColor: `var(--quiz-canvas-border, ${tk.color.border})`,
  borderRadius: `var(--quiz-radius, ${tk.radius.card}px)`,
  p: 2,
} as const;

export const webColumnSx = { display: "flex", flex: "1 1 560px", flexDirection: "column", gap: 2, maxWidth: 820, minWidth: 0 } as const;
export const webSideSx = { display: "flex", flex: "0 1 340px", flexDirection: "column", gap: 2, minWidth: 280 } as const;

type PlayerWebPageProps = {
  backLabel: string;
  onBack: () => void;
  title: string;
  meta?: string;
  /** Right side of the bar: autosave status and timer while playing. */
  actions?: ReactNode;
  /** 0–1; the 4px line under the bar. Omitted = no line. */
  progress?: number;
  /** WL1 only: soft accent wash behind the intro. */
  hero?: boolean;
  alignTop?: boolean;
  children: ReactNode;
};

export function PlayerWebPage({ backLabel, onBack, title, meta, actions, progress, hero = false, alignTop = false, children }: PlayerWebPageProps) {
  return (
    <Box
      sx={{
        background: hero ? `linear-gradient(165deg, ${tk.color.primarySoft} 0%, ${tk.color.surface} 72%)` : `var(--quiz-page-bg, ${tk.color.surfaceSubtle})`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        width: "100%",
      }}
    >
      <Box component="header" sx={{ alignItems: "center", bgcolor: tk.color.surface, borderBottom: "1px solid", borderColor: tk.color.border, display: "flex", flexShrink: 0, gap: 1.5, px: 3, py: 1.5 }}>
        <Button startIcon={<ArrowBackRounded />} sx={{ color: quizAccent, flexShrink: 0, px: 1.25 }} variant="text" onClick={onBack}>{backLabel}</Button>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ color: tk.color.text }} variant="subtitle1">{title}</Typography>
          {meta ? <Typography noWrap component="div" sx={{ color: tk.color.textMuted }} variant="caption">{meta}</Typography> : null}
        </Box>
        {actions ? <Box sx={{ alignItems: "center", display: "flex", flexShrink: 0, gap: 1.5 }}>{actions}</Box> : null}
      </Box>
      {progress === undefined ? null : (
        <Box aria-hidden sx={{ bgcolor: tk.color.divider, flexShrink: 0, height: 4 }}>
          <Box sx={{ bgcolor: quizAccent, borderRadius: "0 2px 2px 0", height: "100%", transition: `width ${tk.motion.duration.base}ms ${tk.motion.easing.standard}`, width: `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%` }} />
        </Box>
      )}
      <Box
        component="main"
        sx={{ alignContent: "flex-start", alignItems: alignTop ? "flex-start" : "stretch", display: "flex", flex: 1, flexWrap: "wrap", gap: 3, justifyContent: "center", minHeight: 0, overflowY: "auto", p: 3 }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <Box
      component="kbd"
      sx={{
        bgcolor: tk.color.surface,
        border: "1px solid",
        borderBottomWidth: 2,
        borderColor: tk.color.borderStrong,
        borderRadius: `${tk.radius.xs}px`,
        color: tk.color.textSecondary,
        display: "inline-grid",
        fontFamily: "inherit",
        fontVariantNumeric: "tabular-nums",
        fontWeight: "fontWeightBold",
        height: 22,
        minWidth: 22,
        placeItems: "center",
        px: 0.75,
        typography: "caption",
      }}
    >
      {children}
    </Box>
  );
}

// Leading tokens without a lowercase letter are keys ("1–4", "←", "F"); the rest is the label.
const isKey = (token: string) => !/[a-zà-ỹđ]/.test(token);

/** "1–4 chọn · ← → đổi câu" from buildKeyHint, drawn as key caps. */
export function KeyHintRow({ hint }: { hint: string }) {
  return (
    <Box aria-label={hint} role="note" sx={{ alignItems: "center", color: tk.color.textMuted, display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", typography: "caption" }}>
      {hint.split(" · ").map((part) => {
        const tokens = part.split(" ");
        const keyCount = tokens.findIndex((token) => !isKey(token));
        const keys = tokens.slice(0, keyCount < 0 ? tokens.length : keyCount);
        return (
          <Box aria-hidden component="span" key={part} sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
            {keys.map((key) => (
              <Fragment key={key}>
                {key.split("–").map((cap, i) => <Fragment key={cap}>{i > 0 ? "–" : null}<Kbd>{cap}</Kbd></Fragment>)}
              </Fragment>
            ))}
            {tokens.slice(keys.length).join(" ")}
          </Box>
        );
      })}
    </Box>
  );
}

const KIND_LABEL: Record<QuestionKind, string> = {
  single_choice: "Một đáp án",
  true_false: "Đúng/Sai",
  multiple_response: "Nhiều đáp án",
  short_answer: "Trả lời ngắn",
  numeric: "Trả lời số",
  fill_blank: "Điền chỗ trống",
  inline_choice: "Chọn trong câu",
  select_from_lists: "Chọn trong câu",
  matching: "Ghép nối",
  sequence: "Sắp xếp",
  drag_words: "Kéo thả từ",
  drag_drop: "Kéo thả",
  hotspot: "Điểm nóng",
  likert_scale: "Thang đo",
  essay: "Trả lời mở",
};

export const questionKindLabel = (kind: QuestionKind) => KIND_LABEL[kind];

const pointsVi = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
export const pointsLabel = (points: number) => `${pointsVi.format(points)} điểm`;

/** Square tag in the question meta row ("Một đáp án", "Sai · 0 điểm"). */
export function MetaTag({ children, tone = "info" }: { children: ReactNode; tone?: keyof typeof tk.statusTint }) {
  const tint = tk.statusTint[tone];
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: `${tk.radius.xs}px`, color: tint.color, display: "inline-flex", fontWeight: "fontWeightBold", gap: 0.5, height: 22, px: 0.875, typography: "caption", whiteSpace: "nowrap" }}>
      {children}
    </Box>
  );
}
