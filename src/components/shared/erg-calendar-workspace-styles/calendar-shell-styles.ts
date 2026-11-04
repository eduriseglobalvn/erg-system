import type { ErgCalendarTone } from "../erg-calendar-types";

export const weekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const toneMap: Record<ErgCalendarTone, { background: string; border: string; text: string }> = {
  blue: { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  green: { background: "#CEEAD6", border: "#188038", text: "#137333" },
  indigo: { background: "#E6EAFF", border: "#5B64D8", text: "#3942A0" },
  purple: { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  orange: { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
  pink: { background: "#FFE7F1", border: "#D95D91", text: "#9A2456" },
  red: { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
  teal: { background: "#DDF4F2", border: "#0A6B6F", text: "#075D61" },
};

export const surfaceSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #DADCE0",
  borderRadius: "24px",
  boxShadow: "none",
};
export const CALENDAR_SHELL_HEIGHT = "calc(100dvh - 122px)";

export const calendarToolbarGridSx = {
  alignItems: { xs: "stretch", md: "center" },
  display: "grid",
  gap: 0.9,
  // one row from md: date nav | filter popover | view switch
  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto auto" },
};

export const calendarWorkspaceSx = {
  backgroundColor: { xs: "#F3F6FB", xl: "#FFFFFF" },
  border: { xs: 0, xl: "1px solid #E3E8F0" },
  borderRadius: { xs: 0, xl: "18px" },
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px rgba(15,23,42,0.035)",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateRows: { xs: "auto auto", xl: "auto minmax(0, 1fr)" },
  gap: 0,
  height: { xs: "auto", xl: CALENDAR_SHELL_HEIGHT },
  minHeight: { xs: 0, xl: 0 },
  minWidth: 0,
  overflow: { xs: "visible", xl: "hidden" },
  p: { xs: 0, xl: 0.85 },
};

export const calendarToolbarShellSx = {
  backgroundColor: "rgba(255,255,255,0.98)",
  borderBottom: "1px solid #EEF2F6",
  borderRadius: { xs: "0 0 16px 16px", xl: 0 },
  boxShadow: { xs: "0 4px 14px rgba(15,23,42,0.06)", xl: "none" },
  mb: 0.85,
  pb: { xs: 0.7, xl: 0.8 },
  position: { xs: "sticky", xl: "static" },
  px: { xs: 0.1, xl: 0.25 },
  pt: { xs: 0.1, xl: 0 },
  top: { xs: 0, xl: "auto" },
  zIndex: { xs: 4, xl: "auto" },
};

export const calendarToolbarDateSx = {
  alignItems: "center",
  flexWrap: "nowrap",
  gap: 0.75,
  justifyContent: { xs: "flex-start", xl: "flex-start" },
  minWidth: 0,
};

export const calendarToolbarLaneSx = {
  alignItems: "center",
  display: "flex",
  flexWrap: "nowrap",
  gap: 1,
  justifyContent: { xs: "flex-start", xl: "center" },
  minWidth: 0,
  overflowX: { xs: "auto", xl: "visible" },
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
};

export const calendarToolbarActionsSx = {
  alignItems: "center",
  display: "flex",
  flexWrap: "nowrap",
  gap: 1,
  justifyContent: { xs: "flex-start", xl: "flex-end" },
  minWidth: 0,
  overflowX: { xs: "auto", xl: "visible" },
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
};

export const calendarBodyGridSx = {
  alignItems: "stretch",
  display: "grid",
  gap: 0.85,
  gridTemplateColumns: { xs: "1fr", xl: "268px minmax(0, 1fr)" },
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflow: { xs: "visible", xl: "hidden" },
};

export const calendarSidebarStickySx = {
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  position: { xl: "sticky" },
  top: { xl: 96 },
};

export const calendarMainColumnSx = {
  display: "flex",
  flexDirection: "column",
  gap: 0.85,
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
};

export const calendarSidebarSx = {
  backgroundColor: "#FBFCFE",
  border: "1px solid #EEF2F6",
  borderRadius: "14px",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
  height: { xs: "auto", xl: "100%" },
  minHeight: 0,
  overflow: "hidden",
  maxHeight: { xs: 352, xl: "none" },
  p: { xs: 0.75, xl: "10px 12px 10px 10px" },
};

export const calendarBoardShellSx = {
  ...surfaceSx,
  borderColor: "#D9E2EF",
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.035)",
  display: "flex",
  flex: { xs: "0 0 auto", xl: "1 1 0" },
  flexDirection: "column",
  height: { xs: "min(640px, calc(100dvh - 260px))", xl: "100%" },
  minHeight: 0,
  overflow: "hidden",
};

export const laneButtonSx = (active: boolean) => ({
  backgroundColor: active ? "#EEF5FF" : "transparent",
  border: `1px solid ${active ? "#CFE2FF" : "transparent"}`,
  borderRadius: "999px",
  color: active ? "#202124" : "#5F6368",
  fontSize: 13.25,
  fontWeight: active ? 700 : 500,
  minHeight: 36,
  px: 1.35,
  textTransform: "none",
  "&:hover": { backgroundColor: active ? "#E2EFFF" : "#F5F7FA" },
});

export const laneToolbarSx = {
  backgroundColor: "#F4F7FA",
  borderRadius: "999px",
  flexWrap: "nowrap",
  flexShrink: 0,
  gap: 0.25,
  overflowX: "auto",
  p: 0.375,
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
};
export const scopeSelectSlotSx = (hidden: boolean) => ({
  display: { xs: hidden ? "none" : "block", sm: "block" },
  flexShrink: 0,
  minWidth: { xs: 180, sm: 198 },
  pointerEvents: hidden ? "none" : "auto",
  visibility: hidden ? "hidden" : "visible",
});
export const scopeSelectSx = {
  minWidth: { xs: "100%", sm: 190 },
  "& .MuiInputBase-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "999px",
    color: "#202124",
    fontSize: 13,
    fontWeight: 600,
    minHeight: 38,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#DADCE0",
  },
  "& .MuiSelect-select": {
    py: "8px",
  },
};
