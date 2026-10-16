import type { ReactNode } from "react";
import MuiStack from "@mui/material/Stack";

export const MUI_PRIMARY = "#0F6CBD";
export const MUI_PRIMARY_DARK = "#0B4F8A";
export const MUI_RED = "#E31B3F";
export const MUI_NAVY = "#172033";
export const MUI_TEXT = "#172033";
export const MUI_MUTED = "#667085";
export const MUI_BORDER = "rgba(16, 24, 40, 0.1)";
export const MUI_DIVIDER = "rgba(16, 24, 40, 0.075)";
export const MUI_BG = "#F3F6FA";
export const MUI_SURFACE = "#FFFFFF";
export const MUI_CARD_SHADOW = "0 1px 2px rgba(16,24,40,0.045), 0 18px 44px rgba(16,24,40,0.055)";
export const LOGO_URL = "https://media.erg.edu.vn/logo/erg.png";

export const elevatedCardSx = {
  bgcolor: MUI_SURFACE,
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "14px",
  boxShadow: MUI_CARD_SHADOW,
};

export const elevatedPaperSx = {
  bgcolor: "#fff",
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "12px",
  boxShadow: "0 5px 18px rgba(16,32,51,0.045)",
};

export const primaryButtonSx = {
  bgcolor: MUI_PRIMARY,
  boxShadow: `inset 0 -2px 0 rgba(227,27,63,0.24), 0 1px 2px rgba(16,24,40,0.08), 0 12px 22px rgba(15,108,189,0.16)`,
  color: "#fff",
  fontWeight: 900,
  "&:hover": {
    bgcolor: MUI_PRIMARY_DARK,
    boxShadow: `inset 0 -2px 0 rgba(227,27,63,0.32), 0 1px 2px rgba(16,24,40,0.08), 0 14px 26px rgba(15,108,189,0.2)`,
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

