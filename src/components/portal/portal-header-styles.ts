import type { SxProps, Theme } from "@mui/material/styles";

export const HEADER_NETWORK_SHADOW =
  "rgba(0, 0, 0, 0.06) 0px 2px 1px -1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0";

export const HEADER_ICON_BUTTON_SX: SxProps<Theme> = {
  bgcolor: "transparent",
  border: 0,
  borderRadius: "10px",
  boxShadow: "none",
  color: "#6E6E73",
  height: 38,
  ml: 0.5,
  transition: "all 120ms cubic-bezier(0.16, 1, 0.3, 1)",
  width: 38,
  "&:active": {
    transform: "scale(0.92)",
    transition: "transform 80ms ease-out",
  },
  "&:hover": {
    bgcolor: "rgba(0, 0, 0, 0.05)",
    color: "#1D1D1F",
  },
};

export function portalHeaderAppBarSx(scrolled: boolean): SxProps<Theme> {
  return {
    backgroundImage: "none",
    bgcolor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "0 !important",
    borderBottom: scrolled
      ? "1px solid rgba(0, 0, 0, 0.09)"
      : "1px solid rgba(0, 0, 0, 0.06)",
    borderRadius: 0,
    boxShadow: scrolled ? "0 4px 16px rgba(0, 0, 0, 0.04)" : "none",
    color: "#1D1D1F",
    overflow: "hidden",
    transition:
      "box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms cubic-bezier(0.16, 1, 0.3, 1)",
    zIndex: 1200,
    "&::before": {
      background: "none",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "&::after": {
      background: "none",
      content: '""',
      inset: 0,
      opacity: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  };
}
