import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Page title 24/600 with a meta line, filters and the page actions on the right. */
export function QuestionBankPageHeader({
  actions,
  controls,
  meta,
  title,
}: {
  actions?: ReactNode;
  controls?: ReactNode;
  meta?: ReactNode;
  title: string;
}) {
  return (
    <Box
      component="header"
      sx={{ alignItems: { md: "flex-end" }, display: "flex", flexDirection: { xs: "column", md: "row" }, flexWrap: "wrap", gap: 2 }}
    >
      <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {meta ? (
          <Typography variant="body2" sx={{ color: t.color.textMuted, mt: 0.5 }}>
            {meta}
          </Typography>
        ) : null}
      </Box>
      {controls ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>{controls}</Box> : null}
      {actions ? <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>{actions}</Box> : null}
    </Box>
  );
}
