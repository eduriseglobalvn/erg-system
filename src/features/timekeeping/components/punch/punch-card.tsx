import Box, { type BoxProps } from "@mui/material/Box";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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
