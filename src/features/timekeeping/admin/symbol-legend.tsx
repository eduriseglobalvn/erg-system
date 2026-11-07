import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { codeMeta } from "../model/day-codes";

const CODES = ["X", "M", "½", "P", "Ô", "CT", "KC", "KP", "L"];

/** "Chú thích ký hiệu": each symbol next to its meaning. */
export function SymbolLegend() {
  return (
    <Box aria-label="Chú thích ký hiệu" component="ul" sx={{ display: "flex", flexWrap: "wrap", gap: 2, listStyle: "none", m: 0, p: 0 }}>
      {CODES.map((code) => {
        const meta = codeMeta(code);
        if (!meta) return null;
        const tint = t.statusTint[meta.tone];
        return (
          <Box component="li" key={code} sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Box aria-hidden component="span" sx={{ bgcolor: tint.bg, borderRadius: `${t.radius.xs}px`, color: tint.color, minWidth: 28, px: 0.5, textAlign: "center" }}>{code}</Box>
            <Typography color="text.secondary" variant="caption">{meta.label}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
