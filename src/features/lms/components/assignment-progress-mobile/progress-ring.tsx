import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const SIZE = 76;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Canvas `.ring`: submitted share as an SVG arc (conic-gradient is not needed, works on Safari 15). */
export function ProgressRing({ percent }: { percent: number }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <Box
      aria-label={`Đã nộp ${value}%`}
      role="img"
      sx={{ display: "grid", flexShrink: 0, height: SIZE, placeItems: "center", position: "relative", width: SIZE }}
    >
      <Box component="svg" height={SIZE} sx={{ inset: 0, position: "absolute", transform: "rotate(-90deg)" }} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE}>
        <circle cx={SIZE / 2} cy={SIZE / 2} fill="none" r={RADIUS} stroke={t.color.divider} strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          stroke={t.color.primary}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
          strokeLinecap={value ? "round" : "butt"}
          strokeWidth={STROKE}
        />
      </Box>
      <Typography aria-hidden component="span" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold" }} variant="subtitle1">
        {value}%
      </Typography>
    </Box>
  );
}
