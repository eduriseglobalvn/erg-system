export const toolbarIconButtonSx = { border: "1px solid transparent", borderRadius: "50%", color: "#3C4043", height: 36, width: 36, "&:hover": { backgroundColor: "#F1F3F4" } };
export const todayButtonSx = {
  borderColor: "#DADCE0",
  borderRadius: "999px",
  color: "#202124",
  fontSize: 13.5,
  fontWeight: 600,
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
  color: "#1D1D1F",
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
  "&:focus-visible": { boxShadow: "0 0 0 3px rgba(0, 113, 227,0.18)" },
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
  "&:focus-visible": { boxShadow: "inset 0 0 0 2px #0071E3" },
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
  fontWeight: 600,
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
