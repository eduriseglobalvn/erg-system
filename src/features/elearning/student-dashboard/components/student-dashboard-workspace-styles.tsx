import type { ReactNode } from "react";
import MuiStack from "@mui/material/Stack";

export const MUI_PRIMARY = "#2563EB";
export const MUI_PRIMARY_DARK = "#1D4ED8";
export const MUI_RED = "#E31B3F";
export const MUI_NAVY = "#0F172A";
export const MUI_TEXT = "#0F172A";
export const MUI_MUTED = "#64748B";
export const MUI_BORDER = "rgba(226, 232, 240, 0.8)";
export const MUI_DIVIDER = "rgba(226, 232, 240, 0.6)";
export const MUI_BG = "#F4F6FA";
export const MUI_SURFACE = "#FFFFFF";
export const MUI_CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.03), 0 10px 24px rgba(0,0,0,0.04)";
export const LOGO_URL = "https://media.erg.edu.vn/logo/erg.png";

export const elevatedCardSx = {
  bgcolor: MUI_SURFACE,
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "16px",
  boxShadow: MUI_CARD_SHADOW,
};

export const elevatedPaperSx = {
  bgcolor: "#fff",
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "16px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
};

export const primaryButtonSx = {
  bgcolor: MUI_PRIMARY,
  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
  color: "#fff",
  fontWeight: 700,
  borderRadius: "10px",
  textTransform: "none",
  "&:hover": {
    bgcolor: MUI_PRIMARY_DARK,
    boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
  },
};

export function Stack({
  alignItems,
  justifyContent,
  sx,
  ...props
}: {
  alignItems?: unknown;
  children?: ReactNode;
  direction?: unknown;
  justifyContent?: unknown;
  spacing?: unknown;
  sx?: unknown;
  [key: string]: unknown;
}) {
  const layoutSx = {
    ...(alignItems !== undefined ? { alignItems } : {}),
    ...(justifyContent !== undefined ? { justifyContent } : {}),
  };

  return (
    <MuiStack
      {...(props as Record<string, unknown>)}
      sx={[Object.keys(layoutSx).length ? layoutSx : null, sx].filter(Boolean) as never}
    />
  );
}
