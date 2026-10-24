import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type PortalHeaderIdentityProps = {
  centerName?: string;
  headerControls?: ReactNode;
  headerTrailingControls?: ReactNode;
  hideIdentity: boolean;
  portalName?: string;
  portalPlan?: string;
};

export function PortalHeaderIdentity({
  centerName,
  headerControls,
  headerTrailingControls,
  hideIdentity,
  portalName,
  portalPlan,
}: PortalHeaderIdentityProps) {
  if (hideIdentity && !headerControls) return null;
  const displayCenter = centerName || portalName || "ERG Education";
  const displayPlan = portalPlan ?? "ADVANCED";

  return (
    <Box sx={{ alignItems: "center", display: "flex", flex: "0 1 auto", gap: 0.75, minHeight: 32, minWidth: 0, overflow: "hidden", px: 0.5 }}>
      {headerControls ? (
        headerControls
      ) : !hideIdentity ? (
        <>
          <Box sx={{ alignItems: "center", bgcolor: "transparent", border: 0, borderRadius: 0, color: "#0F6CBD", display: "flex", fontSize: 9.5, fontWeight: 900, height: 24, justifyContent: "center", letterSpacing: 0, width: 28 }}>
            ERG
          </Box>
          <Typography noWrap sx={{ color: "#1C252E", fontSize: { xs: 12, sm: 13.5 }, fontWeight: 650, lineHeight: "20px", maxWidth: { xs: 150, sm: 280 } }}>
            {displayCenter}
          </Typography>
          {portalPlan !== "" ? (
            <Box component="span" sx={{ bgcolor: "rgba(0,184,217,0.12)", border: "1px solid rgba(0,184,217,0.14)", borderRadius: "6px", color: "#006C9C", display: { xs: "none", sm: "inline-flex" }, fontSize: 10.5, fontWeight: 800, height: 22, lineHeight: "20px", px: 0.85 }}>
              {displayPlan}
            </Box>
          ) : null}
        </>
      ) : null}
      {headerTrailingControls}
    </Box>
  );
}
