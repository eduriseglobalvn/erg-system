import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import {
  PORTAL_SIDEBAR_MOTION_MS,
  PORTAL_SIDEBAR_TRANSITION,
} from "./portal-sidebar-motion";

export const NAV_BLUE = ergEnterpriseTokens.color.primary;
export const NAV_RED = ergEnterpriseTokens.color.danger;
export const NAV_ITEM_COLOR = "#4B5563";
export const NAV_TEXT_COLOR = ergEnterpriseTokens.color.text;
export const NAV_MUTED_COLOR = ergEnterpriseTokens.color.textMuted;
export const NAV_PRIMARY = ergEnterpriseTokens.color.primary;

// Apple Translucent Vibrancy Material (Emil Kowalski's apple-design specs)
export const NAV_SURFACE_BG = "rgba(248, 249, 252, 0.88)";
export const NAV_SUBTLE_GLASS_BG = "rgba(255, 255, 255, 0.75)";
export const NAV_PREVIEW_BG = "rgba(0, 0, 0, 0.03)";
export const NAV_HOVER_BG = "rgba(0, 0, 0, 0.045)";
export const NAV_ACTIVE_BG = ergEnterpriseTokens.color.primarySoft;
export const NAV_ACTIVE_BORDER = alpha(ergEnterpriseTokens.color.primary, 0.22);
export const NAV_PREVIEW_BORDER = "rgba(0, 0, 0, 0.06)";
export const NAV_ACTIVE_SHADOW =
  `0 1px 2px ${alpha(ergEnterpriseTokens.color.primary, 0.08)}, inset 0 1px 0 rgba(255, 255, 255, 0.6)`;
export const NAV_PANEL_BG = "rgba(248, 249, 252, 0.88)";
export const NAV_PANEL_BORDER = "rgba(0, 0, 0, 0.08)";
export const NAV_PANEL_SHADOW =
  "inset -1px 0 0 rgba(255, 255, 255, 0.75), 4px 0 16px rgba(0, 0, 0, 0.02)";
export const NAV_BUTTON_BG = "rgba(255, 255, 255, 0.88)";

export const SIDEBAR_MOTION_MS = PORTAL_SIDEBAR_MOTION_MS;
export const SIDEBAR_MOTION_CURVE = PORTAL_SIDEBAR_TRANSITION;
// Apple spring response 0.3-0.4, critically damped (damping 1.0)
export const SIDEBAR_FADE_EASING = "160ms cubic-bezier(0.16, 1, 0.3, 1)";
export const SUBMENU_MOTION_EASING = "220ms cubic-bezier(0.16, 1, 0.3, 1)";
export const SUBMENU_DISCLOSURE_TRANSITION =
  "200ms cubic-bezier(0.16, 1, 0.3, 1)";
export const TREE_CONNECTOR_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\") 50% 50% / 100% no-repeat";

export const COLLAPSED_LABELS: Record<string, string> = {
  "Lịch toàn trung tâm": "Lịch toàn tr...",
  "Bài tập & tài liệu": "Bài tập & tài...",
  "Quản lý học liệu": "Quản lý...",
};
