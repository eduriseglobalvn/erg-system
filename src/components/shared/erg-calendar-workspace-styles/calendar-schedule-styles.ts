import type { ErgCalendarResolvedTone } from "../erg-calendar-types";
import { softenColor } from "./calendar-event-styles";

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
  backgroundColor: isToday ? "#0071E3" : "transparent",
  borderRadius: "50%",
  color: isToday ? "#FFFFFF" : "#1D1D1F",
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
  fontWeight: 600,
  lineHeight: "18px",
  pt: 0.95,
  whiteSpace: "nowrap",
};
export const scheduleEmptySx = {
  alignItems: "center",
  color: "#6E6E73",
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
  "& .MuiToggleButtonGroup-grouped": { border: 0, borderRadius: "999px !important", color: "#5F6368", fontWeight: 600, minHeight: { xs: 44, md: 36 }, px: { xs: 0.85, xl: 1.05 }, textTransform: "none", whiteSpace: "nowrap" },
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
  "& .MuiPickersCalendarHeader-label": { color: "#202124", fontSize: 12.5, fontWeight: 600 },
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
