import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";

import { ERG_ASSETS } from "@/config/seo";
import type { PortalLoginCopy } from "@/platform/auth/components/portal-login-copy";
import { PortalMobileLoginShell } from "@/platform/auth/components/portal-mobile-login-shell";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { useIsMobile } from "@/hooks/use-mobile";

type AuthNotice = ReturnType<typeof useAuthSession>["notice"];

export function PortalLoginShell({ children, copy }: { children: ReactNode; copy: PortalLoginCopy }) {
  if (useIsMobile()) return <PortalMobileLoginShell copy={copy}>{children}</PortalMobileLoginShell>;
  return (
    <Box component="main" sx={{ backgroundImage: "url('https://media.erg.edu.vn/logo/bg.jpg')", backgroundPosition: "center", backgroundSize: "cover", bgcolor: "#dfeeff", color: "#1C252E", display: "grid", minHeight: "100vh", overflow: "hidden", px: { xs: 2, sm: 3 }, py: 3, position: "relative" }}>
      <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", inset: 0, pointerEvents: "none", position: "absolute" }} />
      <Box component="section" sx={{ display: "flex", flexDirection: "column", justifyContent: "center", mx: "auto", maxWidth: 460, position: "relative", width: "100%", zIndex: 10 }}>
        <Box sx={{ backdropFilter: "blur(24px)", bgcolor: "rgba(255,255,255,0.32)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 3, boxShadow: "0 30px 90px rgba(72,81,156,0.2)", p: { xs: 2.5, sm: 3.5 } }}>
          <Box component="header" sx={{ display: "grid", justifyItems: "center", mb: 3.5, textAlign: "center" }}>
            <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ filter: "drop-shadow(0 12px 26px rgba(72,81,156,0.16))", height: "auto", objectFit: "contain", width: 112 }} />
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export function NoticeBanner({ notice }: { notice: AuthNotice }) {
  if (!notice) return null;
  return (
    <Fade in>
      <Alert severity={notice.tone === "success" ? "success" : notice.tone === "error" ? "error" : "info"} sx={{ mb: 2.5, borderRadius: 1.5, fontSize: 14, "& .MuiAlert-icon": { fontSize: 20 }, ...(notice.tone === "success" && { bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#15803D", "& .MuiAlert-icon": { color: "#15803D" } }), ...(notice.tone === "error" && { bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#B91C1C", "& .MuiAlert-icon": { color: "#B91C1C" } }), ...(notice.tone === "info" && { bgcolor: "rgba(0,184,217,0.08)", border: "1px solid rgba(0,184,217,0.2)", color: "#007A8C", "& .MuiAlert-icon": { color: "#007A8C" } }) }}>
        {notice.message}
      </Alert>
    </Fade>
  );
}
