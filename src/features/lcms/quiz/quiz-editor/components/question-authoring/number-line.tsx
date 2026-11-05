import Box from "@mui/material/Box";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { formatDecimal } from "./decimal-text";

const label = { typography: "caption", fontFamily: tokens.font.mono, fill: (theme: { palette: { text: { secondary: string } } }) => theme.palette.text.secondary };

/** The accepted range as a picture; percentages only, so the point stays round at any width. */
export function NumberLine({ value, tolerance, unit }: { value: number; tolerance: number; unit: string }) {
  if (!Number.isFinite(value)) return null;
  const tol = Number.isFinite(tolerance) && tolerance > 0 ? tolerance : 0;
  const suffix = unit ? ` ${unit}` : "";
  const name = tol > 0
    ? `Được tính đúng từ ${formatDecimal(value - tol)} đến ${formatDecimal(value + tol)}${suffix}`
    : `Chỉ tính đúng ${formatDecimal(value)}${suffix}`;
  return (
    <Box aria-label={name} component="svg" role="img" sx={{ display: "block", width: "100%", height: 46 }}>
      <Box component="line" sx={{ stroke: tokens.color.border, strokeWidth: 2 }} x1="0" x2="100%" y1="19" y2="19" />
      {tol > 0 && (
        <Box
          component="rect"
          height="12"
          rx="6"
          sx={{ fill: tokens.statusTint.success.bg, stroke: (t) => t.palette.success.main, strokeWidth: 1.5 }}
          width="12%"
          x="44%"
          y="13"
        />
      )}
      <Box component="circle" cx="50%" cy="19" r="8" sx={{ fill: (t) => t.palette.success.main, stroke: (t) => t.palette.background.paper, strokeWidth: 3 }} />
      {tol > 0 ? (
        <>
          <Box component="text" sx={label} textAnchor="end" x="44%" y="42">{formatDecimal(value - tol)}</Box>
          <Box component="text" sx={label} textAnchor="start" x="56%" y="42">{formatDecimal(value + tol)}</Box>
        </>
      ) : (
        <Box component="text" sx={label} textAnchor="middle" x="50%" y="42">{formatDecimal(value)}</Box>
      )}
    </Box>
  );
}
