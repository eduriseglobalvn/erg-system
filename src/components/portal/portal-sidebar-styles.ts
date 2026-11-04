import { alpha, lighten } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { PORTAL_SIDEBAR_TRANSITION } from "./portal-sidebar-motion";

export const NAV_PRIMARY = ergEnterpriseTokens.color.primary;
export const NAV_ON_PRIMARY = ergEnterpriseTokens.color.surface;
export const NAV_BORDER = ergEnterpriseTokens.color.border;
export const NAV_ACTIVE_GRADIENT = `linear-gradient(135deg, ${NAV_PRIMARY} 0%, ${lighten(NAV_PRIMARY, 0.28)} 100%)`;
export const NAV_ACTIVE_SHADOW = `0 8px 18px ${alpha(NAV_PRIMARY, 0.35)}`;
export const NAV_HOVER_BG = alpha(NAV_PRIMARY, 0.08);
export const NAV_CARD_SHADOW = "0 10px 30px rgba(15, 23, 42, 0.08)";
export const NAV_RAISED_SHADOW = "0 6px 16px rgba(15, 23, 42, 0.08)";

export const NAV_CARD_RADIUS = "20px";
export const NAV_RAISED_RADIUS = "14px";
export const NAV_ITEM_RADIUS = "12px";
export const NAV_ITEM_HEIGHT = 44;
export const NAV_CHILD_HEIGHT = 40;
export const NAV_TILE_SIZE = 40;
export const NAV_ICON_SIZE = 20;
export const NAV_CHILD_ICON_SIZE = 16;
// Open branch card = 1px border + 6px padding around its rows.
export const NAV_BRANCH_INSET = 7;
export const NAV_PADDING = 12;
// Typography scale of the sidebar (px); weights follow the theme (500 / 600).
export const NAV_FS = { caption: 12, label: 14, title: 16 } as const;
export const NAV_FW = { medium: 500, semi: 600 } as const;

export const NAV_EASE = PORTAL_SIDEBAR_TRANSITION;
export const NAV_TRANSITION = `background-color ${NAV_EASE}, color ${NAV_EASE}, box-shadow ${NAV_EASE}`;
export const REDUCED_MOTION = { "@media (prefers-reduced-motion: reduce)": { transition: "none" } } as const;

/** Gradient square used for the brand tile and workspace icons. */
export const gradientTileSx = (size: number): SxProps<Theme> => ({
  alignItems: "center",
  background: NAV_ACTIVE_GRADIENT,
  borderRadius: NAV_ITEM_RADIUS,
  boxShadow: NAV_ACTIVE_SHADOW,
  color: NAV_ON_PRIMARY,
  display: "flex",
  flexShrink: 0,
  height: size,
  justifyContent: "center",
  width: size,
});

/** White inner card used for an open branch and for collapsed flyouts. */
export const raisedCardSx = {
  bgcolor: "background.paper",
  border: `1px solid ${NAV_BORDER}`,
  borderRadius: NAV_RAISED_RADIUS,
  boxShadow: NAV_RAISED_SHADOW,
  p: "6px",
} as const;

/**
 * Shared row/button look: gradient pill when active, primary tint on hover.
 * `bar` (px) adds the 4px accent bar on the card's far-left edge for an active row.
 */
export function navRowSx(
  active: boolean,
  { bar, height = NAV_ITEM_HEIGHT, open = false }: { bar?: number; height?: number; open?: boolean } = {},
) {
  const tinted = { bgcolor: NAV_HOVER_BG, color: NAV_PRIMARY };
  return {
    alignItems: "center",
    background: active ? NAV_ACTIVE_GRADIENT : "transparent",
    borderRadius: NAV_ITEM_RADIUS,
    boxShadow: active ? NAV_ACTIVE_SHADOW : "none",
    color: active ? NAV_ON_PRIMARY : "text.primary",
    display: "flex",
    height,
    minHeight: height,
    overflow: "visible",
    position: "relative",
    px: "12px",
    transition: NAV_TRANSITION,
    width: "100%",
    ...(open && !active ? { color: NAV_PRIMARY } : {}),
    "&:hover": active ? { background: NAV_ACTIVE_GRADIENT } : tinted,
    "&.Mui-focusVisible": { outline: `2px solid ${alpha(NAV_PRIMARY, 0.5)}`, outlineOffset: 2 },
    "& .MuiSvgIcon-root": { color: "currentColor" },
    ...(active && bar !== undefined
      ? {
          "&::before": {
            background: NAV_PRIMARY,
            borderRadius: "0 4px 4px 0",
            content: '""',
            height: 24,
            left: -bar,
            position: "absolute",
            top: (height - 24) / 2,
            width: 4,
          },
        }
      : {}),
    ...REDUCED_MOTION,
  } as const;
}
