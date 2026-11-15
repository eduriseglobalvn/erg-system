import Box from "@mui/material/Box";

import { scheduleTokens } from "../shared/schedule-cell-sx";

const TONES = {
  busy: { bg: scheduleTokens.clash.bg, color: scheduleTokens.clash.text },
  free: { bg: scheduleTokens.published.bg, color: scheduleTokens.published.text },
  leave: { bg: scheduleTokens.neutral.bg, color: scheduleTokens.neutral.text },
  travel: { bg: scheduleTokens.warn.bg, color: scheduleTokens.warn.text },
} as const;

/** Tag trang thai o dong picker: Trống / Bận / Không kịp di chuyển / Nghỉ. */
export function PickTag({ label, tone }: { label: string; tone: keyof typeof TONES }) {
  return (
    <Box component="span" sx={{ bgcolor: TONES[tone].bg, borderRadius: "999px", color: TONES[tone].color, flexShrink: 0, px: 1, py: 0.25, typography: "caption", whiteSpace: "nowrap" }}>
      {label}
    </Box>
  );
}
