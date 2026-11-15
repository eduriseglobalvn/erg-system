import Box from "@mui/material/Box";

import { conflictLines } from "@/features/teaching-calendar/domain/conflict-copy";
import type { PreviewState } from "@/features/teaching-calendar/domain/slot-change-model";
import type { ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

const { radius, type } = ergEnterpriseTokens;

const TONES = {
  blocked: scheduleTokens.clash,
  idle: scheduleTokens.neutral,
  ok: { bg: scheduleTokens.tones.green.background, text: scheduleTokens.tones.green.text },
  warn: scheduleTokens.warn,
} as const;

/** Cau xung dot cho dong xem truoc: «Q.Vương đang dạy 8A2 …» + goi y sua neu BE co `fix`. */
function conflictText(conflict: ScheduleConflict) {
  const lines = conflictLines(conflict);
  return [lines.otherLine || conflict.message, lines.fixLine].filter(Boolean).join(" · ");
}

type Props = { error?: string; loading?: boolean; state: PreviewState; title?: string };

/** Dong xem truoc dryRun (role=status): «Hết trùng giờ — 6 tiết sẽ đổi.» hoac danh sach xung dot. */
export function ChangePreview({ error, loading, state, title }: Props) {
  if (error) return <Box role="alert" sx={{ bgcolor: scheduleTokens.clash.bg, borderRadius: `${radius.control}px`, color: scheduleTokens.clash.text, px: 1.25, py: 1, ...type.note }}>{error}</Box>;
  if (loading) return <Box role="status" sx={{ bgcolor: scheduleTokens.neutral.bg, borderRadius: `${radius.control}px`, color: scheduleTokens.neutral.text, px: 1.25, py: 1, ...type.note }}>Đang kiểm tra trùng giờ…</Box>;
  if (state.kind === "idle") return null;
  const tone = TONES[state.kind];
  const head = state.kind === "ok" ? "Hết trùng giờ" : state.kind === "blocked" ? "Trùng giờ" : "Lưu ý";
  return (
    <Box role="status" sx={{ bgcolor: tone.bg, borderRadius: `${radius.control}px`, color: tone.text, px: 1.25, py: 1, ...type.note }}>
      <Box component="strong" sx={type.label}>{title ?? head}</Box> — {state.text}
      {state.kind !== "ok" ? state.conflicts.map((conflict) => <Box key={conflict.id} sx={{ mt: 0.5 }}>• {conflictText(conflict)}</Box>) : null}
    </Box>
  );
}
