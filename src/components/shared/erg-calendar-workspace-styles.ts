import type { ErgCalendarResolvedTone, ErgCalendarTone } from "./erg-calendar-types";

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
  alignItems: { xs: "stretch", xl: "center" },
  display: "grid",
  gap: 0.9,
  gridTemplateColumns: { xs: "1fr", xl: "minmax(390px, 1fr) auto auto" },
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
    fontWeight: 650,
    minHeight: 38,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#DADCE0",
  },
  "& .MuiSelect-select": {
    py: "8px",
  },
};
export const toolbarIconButtonSx = { border: "1px solid transparent", borderRadius: "50%", color: "#3C4043", height: 36, width: 36, "&:hover": { backgroundColor: "#F1F3F4" } };
export const todayButtonSx = {
  borderColor: "#DADCE0",
  borderRadius: "999px",
  color: "#202124",
  fontSize: 13.5,
  fontWeight: 650,
  minHeight: 40,
  minWidth: 96,
  px: 2.15,
  textTransform: "none",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "#F8F9FA",
    borderColor: "#C7C9CC",
  },
};
export const calendarMonthDisclosureSx = {
  backgroundColor: "transparent !important",
  borderRadius: "999px",
  color: "#172033",
  fontSize: 15,
  fontWeight: 900,
  justifyContent: "flex-start",
  minHeight: 44,
  minWidth: 0,
  px: 1,
  textTransform: "none",
  whiteSpace: "nowrap",
  "& .MuiButton-endIcon": { ml: 0.25 },
  "&:hover": { backgroundColor: "#F1F5F9 !important" },
  "&:focus-visible": { boxShadow: "0 0 0 3px rgba(15,108,189,0.18)" },
};
export const mobileScopeDrawerPaperSx = {
  border: "1px solid #D9E2EF",
  borderBottom: 0,
  borderRadius: "22px 22px 0 0",
  boxShadow: "0 -18px 50px rgba(15,23,42,0.18)",
  maxHeight: "min(72dvh, 620px)",
  overflow: "hidden",
};
export const mobileScopeOptionSx = {
  borderRadius: "12px",
  minHeight: 52,
  px: 1.25,
  "&.Mui-selected": { backgroundColor: "#EEF6FF" },
  "&.Mui-selected:hover": { backgroundColor: "#E2EFFF" },
  "&:focus-visible": { boxShadow: "inset 0 0 0 2px #0F6CBD" },
};
export const mobileMiniCalendarPanelSx = {
  backgroundColor: "#FFFFFF",
  borderBottom: "1px solid #E3E8F0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.045)",
  display: "flex",
  justifyContent: "center",
  minWidth: 0,
  overflow: "hidden",
  pb: 0.55,
  px: 0.75,
};
export const sidebarCreateButtonSx = {
  alignSelf: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: "18px",
  boxShadow: "0 1px 2px rgba(60,64,67,0.22), 0 1px 3px 1px rgba(60,64,67,0.12)",
  color: "#202124",
  fontSize: 14,
  fontWeight: 650,
  mb: 1,
  minHeight: 44,
  minWidth: 136,
  px: 2,
  textTransform: "none",
  "& .MuiButton-startIcon": {
    color: "#202124",
    mr: 1.1,
  },
  "&:hover": {
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 5px rgba(60,64,67,0.26), 0 2px 8px 2px rgba(60,64,67,0.12)",
  },
};
export const miniCalendarListSx = {
  maxHeight: { xs: 116, xl: "max(150px, calc(100dvh - 470px))" },
  minHeight: 0,
  overflowY: "auto",
  pr: 0.25,
  scrollbarColor: "#B8C4D6 transparent",
  scrollbarWidth: "thin",
  "&::-webkit-scrollbar": {
    width: 8,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#B8C4D6",
    border: "2px solid transparent",
    borderRadius: "999px",
    backgroundClip: "content-box",
  },
};
export const laneSummaryRowSx = (checked: boolean) => ({
  alignItems: "center",
  backgroundColor: "transparent",
  border: "1px solid transparent",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  gap: 0.45,
  minHeight: 30,
  opacity: checked ? 1 : 0.58,
  px: 0.25,
  transition: "background-color 160ms ease, border-color 160ms ease, opacity 160ms ease",
  "&:hover": {
    backgroundColor: "rgba(15,23,42,0.035)",
  },
});
export const calendarCheckboxSx = (color: string) => ({
  color,
  m: 0,
  p: 0.25,
  "&.Mui-checked": {
    color,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
});
export const weekHeaderSx = { borderBottom: "1px solid #DADCE0", color: "#3C4043", fontSize: 11.5, fontWeight: 650, px: 1, py: 0.7, textAlign: "center" as const, textTransform: "uppercase" };
export const weekTimeGridShellSx = {
  display: "grid",
  flex: "1 1 0",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  height: "auto",
  minHeight: 0,
  overflow: "hidden",
};
export const weekTimeHeaderSx = {
  display: "grid",
  gridTemplateColumns: "58px repeat(7, minmax(0, 1fr))",
  minHeight: 74,
};
export const weekTimeDayHeaderSx = {
  alignItems: "center",
  borderBottom: "1px solid #DADCE0",
  borderLeft: "1px solid #DADCE0",
  display: "grid",
  gap: 0.45,
  justifyItems: "center",
  pb: 0.65,
  pt: 0.75,
};
export const timeZoneCellSx = {
  alignItems: "end",
  borderBottom: "1px solid #DADCE0",
  color: "#3C4043",
  display: "flex",
  fontSize: 11,
  justifyContent: "center",
  pb: 0.65,
};
export const weekDateButtonSx = (isToday: boolean) => ({
  backgroundColor: isToday ? "#1A73E8" : "transparent",
  borderRadius: "50%",
  color: isToday ? "#FFFFFF" : "#3C4043",
  fontSize: 24,
  fontWeight: 400,
  height: 40,
  minWidth: 40,
  p: 0,
  "&:hover": {
    backgroundColor: isToday ? "#1765C1" : "#F1F3F4",
  },
});
export const allDayRowSx = {
  display: "grid",
  gridTemplateColumns: "58px repeat(7, minmax(0, 1fr))",
  minHeight: 38,
};
export const dayAllDayRowSx = {
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  minHeight: 34,
};
export const allDayCellSx = {
  borderBottom: "1px solid #DADCE0",
  borderLeft: "1px solid #DADCE0",
  minHeight: 34,
  minWidth: 0,
  p: 0.35,
};
export const timeGutterSx = {
  borderBottom: "1px solid #DADCE0",
};
export const timeGridScrollSx = {
  minHeight: 0,
  overscrollBehavior: "contain",
  overflowX: "hidden",
  overflowY: "auto",
  scrollbarColor: "#C4C7C5 transparent",
  scrollbarWidth: "thin",
  scrollBehavior: "smooth",
  "&::-webkit-scrollbar": {
    width: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundClip: "content-box",
    backgroundColor: "#C4C7C5",
    border: "3px solid transparent",
    borderRadius: "999px",
  },
};
export const weekHourRowSx = {
  display: "grid",
  gridTemplateColumns: "58px repeat(7, minmax(0, 1fr))",
  minHeight: 52,
};
export const dayHourRowSx = {
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  minHeight: 52,
};
export const timeLabelSx = {
  borderBottom: "1px solid #DADCE0",
  color: "#3C4043",
  fontSize: 11,
  lineHeight: "14px",
  pr: 0.75,
  pt: 0.15,
  textAlign: "right",
};
export const timeSlotCellSx = {
  borderBottom: "1px solid #DADCE0",
  borderLeft: "1px solid #DADCE0",
  minHeight: 52,
  minWidth: 0,
  p: 0.35,
};
export const dayTimeGridShellSx = {
  display: "grid",
  flex: "1 1 0",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  height: "auto",
  minHeight: 0,
  overflow: "hidden",
};
export const dayHeaderSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  minHeight: 52,
};
export const dayEmptyOverlaySx = {
  border: "1px dashed #DADCE0",
  borderRadius: "16px",
  color: "#5F6368",
  fontSize: 13,
  m: 1.5,
  p: 2,
};
export const scheduleAgendaShellSx = {
  backgroundColor: { xs: "#FBFCFE", xl: "#FFFFFF" },
  flex: 1,
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  px: { xs: 1, xl: 1.8 },
  py: { xs: 1.2, xl: 1.6 },
  scrollbarColor: "#C4C7C5 transparent",
  scrollbarWidth: "thin",
  scrollBehavior: "smooth",
  "&::-webkit-scrollbar": {
    width: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundClip: "content-box",
    backgroundColor: "#C4C7C5",
    border: "3px solid transparent",
    borderRadius: "999px",
  },
};
export const scheduleDayGroupSx = {
  borderBottom: "1px solid #EEF2F6",
  pb: 1.4,
  "& + &": {
    pt: 1.35,
  },
};
export const mobileScheduleGroupSx = {
  alignItems: "start",
  borderBottom: "1px solid #EEF2F6",
  display: "grid",
  gap: 1,
  gridTemplateColumns: "54px minmax(0, 1fr)",
  pb: 1.15,
  "& + &": { pt: 1.15 },
};
export const mobileScheduleDateRailSx = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  gap: 0.35,
  pt: 0.2,
};
export const mobileScheduleDateCircleSx = (isToday: boolean) => ({
  alignItems: "center",
  backgroundColor: isToday ? "#0F6CBD" : "transparent",
  borderRadius: "50%",
  color: isToday ? "#FFFFFF" : "#172033",
  display: "inline-flex",
  fontSize: 20,
  fontWeight: isToday ? 850 : 650,
  height: 38,
  justifyContent: "center",
  width: 38,
});
export const mobileScheduleCardSx = (tone: ErgCalendarResolvedTone) => ({
  backgroundColor: softenColor(tone.border, 0.18),
  border: `1px solid ${softenColor(tone.border, 0.22)}`,
  borderLeft: `4px solid ${tone.border}`,
  borderRadius: "12px",
  cursor: "pointer",
  minHeight: 68,
  minWidth: 0,
  outline: "none",
  px: 1.15,
  py: 0.9,
  transition: "background-color 140ms ease, box-shadow 140ms ease",
  "&:hover": { backgroundColor: softenColor(tone.border, 0.24) },
  "&:focus-visible": { boxShadow: `0 0 0 3px ${softenColor(tone.border, 0.2)}` },
});
export const scheduleDateHeaderSx = {
  alignItems: "center",
  display: "grid",
  gap: 1,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  minHeight: 34,
  pb: 0.65,
};
export const scheduleDateDotSx = {
  backgroundColor: "#98A2B3",
  borderRadius: "50%",
  height: 5,
  width: 5,
};
export const scheduleRowSx = {
  alignItems: "stretch",
  display: "grid",
  gap: { xs: 0.9, xl: 1.4 },
  gridTemplateColumns: { xs: "72px minmax(0, 1fr)", xl: "140px minmax(0, 1fr)" },
};
export const scheduleTimeSx = {
  color: "#64748B",
  fontSize: 12.5,
  fontWeight: 650,
  lineHeight: "18px",
  pt: 0.95,
  whiteSpace: "nowrap",
};
export const scheduleEmptySx = {
  alignItems: "center",
  color: "#667085",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: 1,
  height: "100%",
  justifyContent: "center",
  minHeight: 260,
};
export const scheduleStatusIconSx = (tone: ErgCalendarResolvedTone) => ({
  alignItems: "center",
  backgroundColor: "#2F36D3",
  borderRadius: "50%",
  color: "#FFB800",
  display: "inline-flex",
  flexShrink: 0,
  height: 22,
  justifyContent: "center",
  mt: 0.1,
  width: 22,
  "& svg": {
    filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.16))",
  },
  "&:hover": {
    backgroundColor: tone.border,
    color: "#FFFFFF",
  },
});
export const scheduleCardSx = (tone: ErgCalendarResolvedTone) => ({
  alignItems: "flex-start",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E6EAF0",
  borderLeft: `3px solid ${tone.border}`,
  borderRadius: "8px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
  cursor: "pointer",
  display: "flex",
  gap: 1.25,
  justifyContent: "space-between",
  minHeight: { xs: 76, xl: 82 },
  minWidth: 0,
  outline: "none",
  px: { xs: 1, xl: 1.15 },
  py: { xs: 0.85, xl: 1 },
  transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
  "&:focus-visible": {
    boxShadow: `0 0 0 3px ${softenColor(tone.border, 0.16)}, 0 1px 2px rgba(15,23,42,0.08)`,
  },
  "&:hover": {
    backgroundColor: "#FBFCFE",
    borderColor: "#D9E2EF",
    boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
    transform: "translateY(-1px)",
  },
});
export const viewToggleSx = {
  backgroundColor: "#F4F7FA",
  borderRadius: "999px",
  flexShrink: 0,
  overflow: "hidden",
  p: 0.375,
  "& .MuiToggleButtonGroup-grouped": { border: 0, borderRadius: "999px !important", color: "#5F6368", fontWeight: 650, minHeight: 36, px: { xs: 0.85, xl: 1.05 }, textTransform: "none", whiteSpace: "nowrap" },
  "& .Mui-selected": { backgroundColor: "#DCEBFF !important", color: "#202124 !important" },
};
export const miniCalendarSx = {
  alignSelf: "center",
  backgroundColor: "transparent",
  border: "0",
  borderRadius: "0",
  boxShadow: "none",
  boxSizing: "border-box",
  height: { xs: 196, xl: 224 },
  maxWidth: { xs: 280, xl: 236 },
  mx: "auto",
  overflow: "hidden",
  px: 0.2,
  py: 0.25,
  width: "100%",
  "& .MuiPickersCalendarHeader-root": { borderBottom: "0", mb: 0.15, minHeight: 28, mx: 0, pb: 0.2, pt: 0, px: 0 },
  "& .MuiPickersCalendarHeader-label": { color: "#202124", fontSize: 12.5, fontWeight: 700 },
  "& .MuiPickersCalendarHeader-switchViewButton": { height: 24, width: 24 },
  "& .MuiDayCalendar-root": { overflow: "visible", width: "100%" },
  "& .MuiDayCalendar-header": { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center", minWidth: 0, mx: 0 },
  "& .MuiDayCalendar-monthContainer": { overflow: "visible", rowGap: 0.1 },
  "& .MuiDayCalendar-slideTransition": { minHeight: { xs: 150, xl: 176 }, overflow: "visible", width: "100%" },
  "& .MuiDayCalendar-weekContainer": { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center", mt: 0.05, overflow: "visible" },
  "& .MuiDayCalendar-weekDayLabel": { color: "#8A94A6", fontSize: 10, fontWeight: 850, height: 20, m: 0, textTransform: "uppercase", width: 28 },
  "& .MuiPickersArrowSwitcher-button": { backgroundColor: "transparent", border: 0, borderRadius: "999px", color: "#3C4043", height: 26, width: 26 },
  "& .MuiPickersDay-root": { borderRadius: "50%", color: "#202124", fontSize: 11.25, fontWeight: 500, height: { xs: 25, xl: 27 }, m: 0, maxWidth: { xs: 25, xl: 27 }, minWidth: { xs: "25px", xl: "27px" }, transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease", width: { xs: 25, xl: 27 } },
};

export function eventChipSx(compact: boolean, tone: { background: string; border: string; text: string }) {
  return {
    backgroundColor: compact ? softenColor(tone.border, 0.14) : softenColor(tone.background, 0.52),
    border: compact ? "0" : `1px solid ${softenColor(tone.border, 0.2)}`,
    borderLeft: compact ? "0" : `4px solid ${softenColor(tone.border, 0.62)}`,
    borderRadius: compact ? "6px" : "10px",
    color: compact ? "#202124" : tone.text,
    cursor: "pointer",
    minHeight: compact ? 22 : 76,
    outline: "none",
    px: compact ? 0.7 : 1.15,
    py: compact ? 0.2 : 1,
    transition: "background-color 140ms ease, box-shadow 140ms ease, filter 140ms ease",
    "&:focus-visible": {
      boxShadow: `0 0 0 3px ${softenColor(tone.border, 0.14)}, 0 0 0 1px ${softenColor(tone.border, 0.4)}`,
    },
    "&:hover": {
      backgroundColor: compact ? softenColor(tone.border, 0.2) : softenColor(tone.background, 0.66),
      boxShadow: compact ? "none" : "0 2px 6px rgba(60,64,67,0.16)",
      filter: "saturate(1.02)",
    },
  };
}

export function softenColor(color: string, alpha: number) {
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!hexMatch) return normalized;

  const value = hexMatch[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export const eventDetailPaperSx = {
  border: "1px solid rgba(217,226,239,0.92)",
  borderRadius: "18px",
  boxShadow: "0 22px 70px rgba(15,23,42,0.18)",
  overflow: "hidden",
};

export function eventDetailHeaderSx(tone: ErgCalendarTone) {
  const color = toneMap[tone].border;
  return {
    alignItems: "flex-start",
    background: `linear-gradient(135deg, ${color} 0%, #6C63FF 100%)`,
    display: "flex",
    gap: 2,
    justifyContent: "space-between",
    px: 2,
    py: 1.65,
  };
}

export function miniPickerDaySx(isSelected: boolean, isToday: boolean, outsideCurrentMonth: boolean) {
  return {
    backgroundColor: isSelected ? "#D2E3FC" : isToday ? "#E8F0FE" : "transparent",
    border: "1px solid transparent",
    borderRadius: "50%",
    boxShadow: "none",
    color: isSelected ? "#1967D2" : isToday ? "#1967D2" : outsideCurrentMonth ? "#9AA0A6" : "#202124",
    fontSize: 11.25,
    fontWeight: isSelected || isToday ? 700 : 500,
    height: 27,
    lineHeight: "27px",
    transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
    width: 27,
    "&:hover": { backgroundColor: isSelected ? "#D2E3FC" : "#EEF2F7" },
  };
}

export function miniEventDotSx(isSelected: boolean, isToday: boolean) {
  return {
    backgroundColor: isSelected ? "#696CFF" : isToday ? "#696CFF" : "#A7B0FF",
    borderRadius: "50%",
    bottom: 3,
    boxShadow: isSelected ? "0 0 0 2px #EEF4FF" : "none",
    height: 4,
    left: "50%",
    position: "absolute",
    transform: "translateX(-50%)",
    width: 4,
  };
}

export function calendarDayCellSx(isCurrentMonth: boolean, isSelected: boolean) {
  return {
    backgroundColor: isCurrentMonth ? "#FFFFFF" : "#F8FAFD",
    borderBottom: "1px solid #DDE3EA",
    borderRight: "1px solid #DDE3EA",
    boxShadow: isSelected ? "inset 0 0 0 1.5px #1A73E8" : "none",
    cursor: "pointer",
    minHeight: 0,
    p: 0.65,
    position: "relative",
    transition: "background-color 140ms ease, box-shadow 140ms ease",
    zIndex: isSelected ? 1 : "auto",
    "&:hover": { backgroundColor: isCurrentMonth ? "#FAFBFD" : "#F3F6FA" },
  };
}

export function calendarDayNumberSx(isToday: boolean, isSelected: boolean, isCurrentMonth: boolean) {
  return {
    alignItems: "center",
    backgroundColor: isToday ? "#1A73E8" : "transparent",
    borderRadius: "999px",
    color: isToday ? "#FFFFFF" : isCurrentMonth ? "#202124" : "#9AA0A6",
    display: "inline-flex",
    fontSize: 12.5,
    fontWeight: isToday || isSelected ? 700 : 500,
    height: 24,
    justifyContent: "center",
    width: 24,
  };
}
