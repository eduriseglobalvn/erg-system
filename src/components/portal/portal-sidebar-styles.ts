import {
  PORTAL_SIDEBAR_MOTION_MS,
  PORTAL_SIDEBAR_TRANSITION,
} from "./portal-sidebar-motion";

export const NAV_BLUE = "#0F6CBD";
export const NAV_RED = "#F35C6B";
export const NAV_ITEM_COLOR = "#425264";
export const NAV_TEXT_COLOR = "#1C252E";
export const NAV_MUTED_COLOR = "#667789";
export const NAV_PRIMARY = "#3659BB";
export const NAV_SURFACE_BG = "rgba(250,252,255,0.985)";
export const NAV_SUBTLE_GLASS_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%), linear-gradient(135deg, rgba(56,145,246,0.08) 0%, rgba(109,115,226,0.08) 52%, rgba(244,103,121,0.07) 100%)";
export const NAV_PREVIEW_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 100%), linear-gradient(135deg, rgba(15,108,189,0.06) 0%, rgba(103,111,225,0.05) 48%, rgba(243,92,107,0.045) 100%)";
export const NAV_HOVER_BG = `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 100%), linear-gradient(135deg, color-mix(in srgb, ${NAV_BLUE} 7%, transparent) 0%, rgba(110,116,225,0.07) 50%, color-mix(in srgb, ${NAV_RED} 6%, transparent) 100%)`;
export const NAV_ACTIVE_BG = `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.84) 100%), linear-gradient(135deg, color-mix(in srgb, ${NAV_BLUE} 17%, transparent) 0%, rgba(102,111,225,0.16) 48%, color-mix(in srgb, ${NAV_RED} 14%, transparent) 100%)`;
export const NAV_ACTIVE_BORDER = "rgba(108, 122, 205, 0.22)";
export const NAV_PREVIEW_BORDER = "rgba(145,158,171,0.18)";
export const NAV_ACTIVE_SHADOW =
  "inset 0 1px 0 rgba(255,255,255,0.84), 0 8px 18px rgba(94, 108, 187, 0.1)";
export const NAV_PANEL_BG = `radial-gradient(136% 118% at 0% 0%, color-mix(in srgb, ${NAV_BLUE} 8%, transparent) 0%, rgba(15,108,189,0.03) 16%, rgba(15,108,189,0) 44%), radial-gradient(120% 116% at 100% 10%, color-mix(in srgb, ${NAV_RED} 7%, transparent) 0%, rgba(243,92,107,0.025) 16%, rgba(243,92,107,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.992) 0%, rgba(250,251,254,0.99) 54%, rgba(247,249,253,0.992) 100%)`;
export const NAV_PANEL_BORDER = "rgba(136, 145, 188, 0.16)";
export const NAV_PANEL_SHADOW =
  "10px 0 24px rgba(115, 126, 173, 0.08), inset -1px 0 0 rgba(255,255,255,0.7), inset 0 1px 0 rgba(255,255,255,0.84)";
export const NAV_BUTTON_BG = NAV_SUBTLE_GLASS_BG;

export const SIDEBAR_MOTION_MS = PORTAL_SIDEBAR_MOTION_MS;
export const SIDEBAR_MOTION_CURVE = PORTAL_SIDEBAR_TRANSITION;
export const SIDEBAR_FADE_EASING = "180ms cubic-bezier(0.32, 0.72, 0, 1)";
export const SUBMENU_MOTION_EASING = "240ms cubic-bezier(0.24, 0.9, 0.32, 1)";
export const SUBMENU_DISCLOSURE_TRANSITION =
  "220ms cubic-bezier(0.22, 1, 0.36, 1)";
export const TREE_CONNECTOR_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23efefef' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 50% 50% / 100% no-repeat";

export const COLLAPSED_LABELS: Record<string, string> = {
  "Lịch toàn trung tâm": "Lịch toàn tr...",
  "Bài tập & tài liệu": "Bài tập & tài...",
  "Quản lý học liệu": "Quản lý...",
};
