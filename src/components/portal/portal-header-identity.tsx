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
  if (hideIdentity) return null;
  const displayCenter = centerName || portalName || "ERG Education";
  const displayPlan = portalPlan ?? "ADVANCED";

  return (
    <Box sx={{ alignItems: "center", display: "flex", flex: "0 1 auto", gap: 0.75, minHeight: 40, minWidth: 0, overflow: "hidden", px: 0.5 }}>
      {headerControls ? null : (
        <Box sx={{ alignItems: "center", bgcolor: "transparent", border: 0, borderRadius: 0, color: "#0F6CBD", display: "flex", fontSize: 9.5, fontWeight: 900, height: 26, justifyContent: "center", letterSpacing: 0, width: 30 }}>
          ERG
        </Box>
      )}
      {headerControls ?? (
        <Typography noWrap sx={{ color: "#1C252E", fontSize: { xs: 12, sm: 14 }, fontWeight: 600, lineHeight: "22px", maxWidth: { xs: 150, sm: 280 } }}>
          {displayCenter}
        </Typography>
      )}
      {portalPlan !== "" ? (
        <Box component="span" sx={{ bgcolor: "rgba(0,184,217,0.12)", border: "1px solid rgba(0,184,217,0.14)", borderRadius: "10px", color: "#006C9C", display: { xs: "none", sm: "inline-flex" }, fontSize: 11.5, fontWeight: 850, height: 28, lineHeight: "26px", px: 1.35 }}>
          {displayPlan}
        </Box>
      ) : null}
      {headerTrailingControls}
    </Box>
  );
}
