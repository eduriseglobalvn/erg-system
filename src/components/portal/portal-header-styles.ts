import type { SxProps, Theme } from "@mui/material/styles";

export const HEADER_NETWORK_SHADOW = "rgba(145, 158, 171, 0.2) 0px 2px 1px -1px, rgba(145, 158, 171, 0.14) 0px 1px 1px 0px, rgba(145, 158, 171, 0.12) 0px 1px 3px 0";

export const HEADER_ICON_BUTTON_SX: SxProps<Theme> = {
  bgcolor: "transparent", border: 0, borderRadius: "10px", boxShadow: "none", color: "#637381", height: 40, ml: 0.5, width: 40,
  "&:hover": { bgcolor: "rgba(145,158,171,0.08)", color: "#1C252E" },
};

export function portalHeaderAppBarSx(scrolled: boolean): SxProps<Theme> {
  return {
    backgroundImage: "none",
    bgcolor: "#FFFFFF",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    border: "0 !important", borderBottom: scrolled ? "1px solid rgba(145,158,171,0.14)" : "1px solid rgba(145,158,171,0.05)", borderRadius: 0,
    boxShadow: scrolled ? "0 4px 12px rgba(145,158,171,0.10)" : "none",
    color: "#1C252E", overflow: "hidden", transition: "box-shadow 180ms ease, border-color 180ms ease", zIndex: 1200,
    "&::before": { background: "none", content: '""', inset: 0, pointerEvents: "none", position: "absolute" },
    "&::after": { background: "none", content: '""', inset: 0, opacity: 0, pointerEvents: "none", position: "absolute" },
  };
}
