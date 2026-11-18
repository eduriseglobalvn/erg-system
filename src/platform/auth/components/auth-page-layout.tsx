import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ERG_ASSETS } from "@/config/seo";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Single backdrop for every auth screen: the ERG brand artwork (owner asked for it back on 18/11), page colour while it loads. */
export function AuthPageBackdrop({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        backgroundColor: t.color.surfaceSubtle,
        backgroundImage: "url('https://media.erg.edu.vn/logo/bg.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        display: "grid",
        minHeight: "100svh",
        overflowX: "hidden",
        px: 2,
        py: 3,
      }}
    >
      {children}
    </Box>
  );
}

/** Login card: 1px border only, no shadow (card rule in CLAUDE.md). */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Box
      component="section"
      sx={{
        alignSelf: "center",
        bgcolor: "background.paper",
        border: 1,
        borderColor: t.color.border,
        borderRadius: `${t.radius.shell}px`,
        justifySelf: "center",
        maxWidth: 420,
        p: { xs: 3, sm: 4 },
        width: "100%",
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, mb: 3 }}>
        <Box alt="" component="img" src={ERG_ASSETS.logo} sx={{ height: 40, objectFit: "contain", width: 40 }} />
        <Box>
          <Typography component="p" variant="subtitle2">ERG EduRise Global</Typography>
          <Typography color="text.secondary" component="p" variant="caption">Hệ thống học tập và giảng dạy</Typography>
        </Box>
      </Box>
      {children}
    </Box>
  );
}
