import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import { hk } from "@/features/games/hack/hack-tokens";

const c = hk.color;

/** Top strip of the teacher projector screens: cells on the left, controls on the right. */
export function HostBar({ cells, children }: { cells: ReactNode[]; children?: ReactNode }) {
  return (
    <Box sx={{ position: "relative", display: "flex", alignItems: "stretch", bgcolor: c.panel, borderBottom: `1px solid ${c.border}`, fontSize: hk.fs[14], fontWeight: hk.font.weightBold }}>
      {cells.map((cell, index) => (
        <Box key={index} sx={{ padding: "12px 18px", borderRight: `1px solid ${c.border}`, color: index === 0 ? c.green : undefined }}>{cell}</Box>
      ))}
      <Box sx={{ flex: 1 }} />
      {children}
    </Box>
  );
}
