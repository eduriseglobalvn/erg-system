import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Canvas `.card`: 1px border, no shadow. */
export const mobileCardSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px` } as const;

/** Canvas `.li`: one setting row inside a `p0` card. */
export const mobileRowSx = {
  alignItems: "center",
  display: "flex",
  gap: 1.5,
  minHeight: 60,
  px: 2,
  py: 1.5,
} as const;

/** Canvas `.fld` with its `N · Tiêu đề` label (N8). */
export function MobileFormSection({ children, hint, number, title }: { children: ReactNode; hint?: string; number: number; title: string }) {
  const id = `assign-section-${number}`;
  return (
    <Box aria-labelledby={id} component="section" sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      <Typography color="text.secondary" component="h2" id={id} variant="subtitle2">{`${number} · ${title}`}</Typography>
      {children}
      {hint ? <Typography color="text.secondary" variant="caption">{hint}</Typography> : null}
    </Box>
  );
}

export function MobileRowText({ meta, title }: { meta?: string; title: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: "fontWeightBold" }} variant="body2">{title}</Typography>
      {meta ? <Typography color="text.secondary" component="div" variant="caption">{meta}</Typography> : null}
    </Box>
  );
}
