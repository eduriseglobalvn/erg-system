import CloudDoneRounded from "@mui/icons-material/CloudDoneRounded";
import CloudOffRounded from "@mui/icons-material/CloudOffRounded";
import CloudSyncRounded from "@mui/icons-material/CloudSyncRounded";
import TimerRounded from "@mui/icons-material/TimerRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";

import { formatTimer } from "@/components/quiz/player-shell-utils";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type TimerWarningLevel = "none" | "five-minutes" | "one-minute";

export function timerWarningLevel(seconds: number): TimerWarningLevel {
  if (seconds <= 0) return "none";
  if (seconds <= 60) return "one-minute";
  if (seconds <= 300) return "five-minutes";
  return "none";
}

const WARNING_TEXT: Record<TimerWarningLevel, string> = {
  none: "",
  "five-minutes": "Còn dưới 5 phút",
  "one-minute": "Còn dưới 1 phút",
};

const TIMER_TONE: Record<TimerWarningLevel, { bgcolor: string; color: string }> = {
  none: { bgcolor: tk.statusTint.neutral.bg, color: tk.color.text },
  "five-minutes": { bgcolor: tk.statusTint.warning.bg, color: tk.statusTint.warning.color },
  "one-minute": { bgcolor: tk.color.danger, color: tk.color.surface },
};

/** Timer pill (qtimer). Time is plain text (not live: it would be read every second); only the threshold message is announced. */
export function PlayerTimerText({ seconds }: { seconds: number }) {
  const level = timerWarningLevel(seconds);
  return (
    <Box sx={{ alignItems: "center", borderRadius: `${tk.radius.chip}px`, display: "inline-flex", flexShrink: 0, gap: 0.75, height: 36, px: 1.5, ...TIMER_TONE[level] }}>
      <TimerRounded aria-hidden sx={{ fontSize: tk.size.iconSm }} />
      <Typography component="span" sx={{ color: "inherit", fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold" }} variant="body2">
        {formatTimer(seconds)}
      </Typography>
      <Box aria-live="polite" component="span" role="status" sx={visuallyHidden}>
        {WARNING_TEXT[level]}
      </Box>
    </Box>
  );
}

export type DraftSyncState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; savedAt: number }
  | { status: "local"; error?: string };

export function formatSavedTime(savedAt: number): string {
  return new Date(savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", hour12: false, minute: "2-digit" });
}

export function saveIndicatorText(sync: DraftSyncState, online: boolean): string | null {
  if (!online || sync.status === "local") return "Lưu trên máy, chờ mạng";
  if (sync.status === "saving") return "Đang lưu…";
  if (sync.status === "saved") return `Đã lưu ${formatSavedTime(sync.savedAt)}`;
  return null;
}

export function PlayerSaveIndicator({ online, sync }: { online: boolean; sync: DraftSyncState }) {
  const text = saveIndicatorText(sync, online);
  const Icon = !online || sync.status === "local" ? CloudOffRounded : sync.status === "saving" ? CloudSyncRounded : CloudDoneRounded;
  return (
    <Typography aria-live="polite" component="span" role="status" sx={{ alignItems: "center", color: tk.color.textMuted, display: "inline-flex", gap: 0.5, whiteSpace: "nowrap" }} variant="caption">
      {text ? <Icon aria-hidden sx={{ fontSize: tk.size.iconSm }} /> : null}
      {text}
    </Typography>
  );
}

export function PlayerOfflineBanner() {
  return (
    <Box
      aria-live="polite"
      role="status"
      sx={{ bgcolor: "warning.light", borderRadius: 1, color: "text.primary", mb: 2, px: 2, py: 1 }}
    >
      <Typography variant="body2">Bạn đang offline. Bài làm vẫn được lưu trên máy và sẽ đồng bộ khi có mạng.</Typography>
    </Box>
  );
}
