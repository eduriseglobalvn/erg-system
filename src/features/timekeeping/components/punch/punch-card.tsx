import Box, { type BoxProps } from "@mui/material/Box";
import type { ReactNode } from "react";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export type TkTone = keyof typeof ergEnterpriseTokens.statusTint;

/** Bordered card (no shadow), as the design system asks. */
export function PunchCard({ sx, ...props }: BoxProps) {
  return (
    <Box
      sx={[
        { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, p: 2, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}

type CardRowProps = BoxProps & { icon?: ReactNode; trailing?: ReactNode };

/** Row of a padding-less card: leading icon, content, trailing slot, hairline between rows (the canvas `.li`). */
export function CardRow({ icon, children, trailing, sx, ...props }: CardRowProps) {
  return (
    <Box
      sx={[
        { alignItems: "center", borderColor: "divider", display: "flex", gap: 1.5, minHeight: 52, px: 2, py: 1.25, "[data-card-row] + &": { borderTop: 1, borderColor: "divider" } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      data-card-row=""
      {...props}
    >
      {icon ? <Box aria-hidden sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>{icon}</Box> : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      {trailing}
    </Box>
  );
}

/** Rounded square behind an icon, tinted by tone (the canvas `.ico`); `small` is 32px. */
export function IconTile({ tone = "info", small, children }: { tone?: TkTone; small?: boolean; children: ReactNode }) {
  const tint = ergEnterpriseTokens.statusTint[tone];
  const { radius, size } = ergEnterpriseTokens;
  return (
    <Box
      aria-hidden
      sx={{
        alignItems: "center",
        bgcolor: tint.bg,
        borderRadius: `${small ? radius.sm : radius.control}px`,
        color: tint.dot,
        display: "flex",
        flexShrink: 0,
        height: small ? 32 : 40,
        justifyContent: "center",
        width: small ? 32 : 40,
        "& svg": { fontSize: small ? size.iconMd : size.iconLg },
      }}
    >
      {children}
    </Box>
  );
}
