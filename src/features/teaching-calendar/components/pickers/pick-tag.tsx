import Box from "@mui/material/Box";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

const TONES = {
  busy: { bg: scheduleTokens.clash.bg, color: scheduleTokens.clash.text },
  free: { bg: scheduleTokens.tones.green.background, color: scheduleTokens.tones.green.text },
  leave: { bg: scheduleTokens.neutral.bg, color: scheduleTokens.neutral.text },
  travel: { bg: scheduleTokens.clash.bg, color: scheduleTokens.clash.text },
} as const;

/** Tag trang thai o dong picker: Trống / Bận / Không kịp di chuyển / Nghỉ. */
export function PickTag({ label, tone }: { label: string; tone: keyof typeof TONES }) {
  return (
    <Box component="span" sx={{ bgcolor: TONES[tone].bg, borderRadius: "999px", color: TONES[tone].color, flexShrink: 0, height: 18, px: 1, ...ergEnterpriseTokens.type.microStrong, lineHeight: "18px", whiteSpace: "nowrap" }}>
      {label}
    </Box>
  );
}
