export const weekHeaderSx = { borderBottom: "1px solid #DADCE0", color: "#3C4043", fontSize: 11.5, fontWeight: 600, px: 1, py: 0.7, textAlign: "center" as const, textTransform: "uppercase" };
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
