import Box from "@mui/material/Box";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { lagChipText } from "../domain/class-log-copy";

/** «6A6 chậm 2 tiết so với PPCT» — the class with the biggest lag this week. */
export function LagChip({ chip }: { chip: { className: string; lag: number } }) {
  return (
    <Box
      sx={{
        alignItems: "center", bgcolor: t.classLog.late.bg, borderRadius: `${t.radius.chip}px`, color: t.classLog.late.color,
        display: "flex", fontSize: t.type.label.fontSize, gap: 1, height: 28, ml: "auto", px: 1.25,
      }}
    >
      <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>{lagChipText(chip)}</Box>
    </Box>
  );
}
