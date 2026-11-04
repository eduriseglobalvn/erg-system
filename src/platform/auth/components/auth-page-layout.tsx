import type { ReactNode } from "react";
import Box from "@mui/material/Box";

import { ERG_ASSETS } from "@/config/seo";

/** Single login backdrop for every auth screen: the ERG brand artwork (same look as before the 7.5 pass). */
export function AuthPageBackdrop({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        backgroundColor: "primary.light",
        backgroundImage: "url('https://media.erg.edu.vn/logo/bg.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        display: "grid",
        minHeight: "100svh",
        overflowX: "hidden",
        position: "relative",
        px: 2,
        py: 3,
      }}
    >
      <Box aria-hidden sx={{ bgcolor: "rgba(255,255,255,0.1)", inset: 0, pointerEvents: "none", position: "absolute" }} />
      <Box sx={{ display: "grid", position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

/** Frosted login card with the ERG logo (restored glass look); fields inside stay solid for legibility. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Box
      component="section"
      sx={{
        alignSelf: "center",
        backdropFilter: "blur(24px)",
        bgcolor: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: 3,
        boxShadow: "0 30px 90px rgba(72,81,156,0.2)",
        justifySelf: "center",
        maxWidth: 440,
        p: { xs: 3, sm: 4 },
        width: "100%",
      }}
    >
      <Box sx={{ display: "grid", justifyItems: "center", mb: 3 }}>
        <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ filter: "drop-shadow(0 12px 26px rgba(72,81,156,0.16))", height: "auto", objectFit: "contain", width: 112 }} />
      </Box>
      {children}
    </Box>
  );
}
