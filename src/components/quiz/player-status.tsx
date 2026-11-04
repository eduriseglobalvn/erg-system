import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { formatTimer } from "@/components/quiz/player-shell-utils";

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

/** Time is plain text (not live: it would be read every second); only the threshold message is announced. */
export function PlayerTimerText({ seconds }: { seconds: number }) {
  const level = timerWarningLevel(seconds);
  const color = level === "one-minute" ? "error.main" : level === "five-minutes" ? "warning.dark" : "text.primary";
  return (
    <Box sx={{ alignItems: "flex-start", display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
      <Typography component="span" sx={{ color, fontVariantNumeric: "tabular-nums" }} variant="subtitle1">
        {formatTimer(seconds)}
      </Typography>
      <Typography aria-live="polite" component="span" role="status" sx={{ color }} variant="caption">
        {WARNING_TEXT[level]}
      </Typography>
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
  return (
    <Typography aria-live="polite" color="text.secondary" component="span" role="status" variant="caption">
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
