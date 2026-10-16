import { getTeacherTone } from "./teaching-schedule-dialog-model";

export const primaryActionSx = {
  borderRadius: "12px",
  boxShadow: "none",
  fontWeight: 800,
  minHeight: 38,
  px: 2,
  textTransform: "none",
};

export const secondaryActionSx = {
  borderColor: "#D9E2EF",
  borderRadius: "12px",
  color: "#253041",
  fontWeight: 800,
  minHeight: 38,
  px: 2,
  textTransform: "none",
};

export const scheduleSelectSlotProps = {
  select: {
    MenuProps: {
      sx: { zIndex: 3400 },
    },
  },
};

export const teachingDialogPaperSx = {
  borderRadius: "22px",
  boxShadow: "0 28px 90px rgba(15,23,42,0.22)",
  maxHeight: "calc(100vh - 48px)",
  maxWidth: "calc(100vw - 32px)",
  overflow: "hidden",
  width: "min(1660px, calc(100vw - 32px))",
};

export const teachingDialogTitleSx = {
  backgroundColor: "#FFFFFF",
  borderBottom: "1px solid rgba(217,226,239,0.58)",
  pb: 1.05,
  pt: 1.35,
};

export const teachingDialogTitleTextSx = {
  color: "#172033",
  fontSize: { xs: 20, md: 23 },
  fontWeight: 950,
  lineHeight: 1.25,
  textAlign: "center",
};

export const teachingDialogContentSx = {
  backgroundColor: "#FBFCFE",
  minWidth: 0,
  px: { xs: 1.25, md: 1.7 },
  pt: 1.35,
};

export const bulkScheduleLayoutSx = {
  display: "grid",
  gap: 1,
  minWidth: 0,
};

export const scheduleSettingsBarSx = {
  backgroundColor: "#F7F9FC",
  border: "1px solid #E3EAF3",
  borderRadius: "16px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
  minWidth: 0,
  px: { xs: 1, md: 1.15 },
  py: 1.1,
};

export const scheduleSectionSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E3EAF3",
  borderRadius: "14px",
  minWidth: 0,
  p: 0.95,
};

export const scheduleSectionTitleSx = {
  color: "#172033",
  fontSize: 14,
  fontWeight: 900,
  mb: 0.55,
};

export const schedulePreviewPanelSx = (tone: { background: string; border: string }) => ({
  backgroundColor: tone.background,
  border: `1px solid ${tone.border}`,
  borderRadius: "14px",
  minWidth: 0,
  p: 1.1,
});

export const schedulePreviewIconSx = (tone: { icon: string; text: string }) => ({
  alignItems: "center",
  backgroundColor: tone.icon,
  borderRadius: "10px",
  color: tone.text,
  display: "flex",
  flexShrink: 0,
  height: 32,
  justifyContent: "center",
  width: 32,
});

export const schedulePreviewListSx = {
  maxHeight: 158,
  mt: 1,
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

export const previewIssueRowSx = {
  backgroundColor: "rgba(255,255,255,0.74)",
  border: "1px solid rgba(217,226,239,0.72)",
  borderRadius: "10px",
  display: "grid",
  gap: 0.35,
  gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
  minWidth: 0,
  px: 0.9,
  py: 0.7,
};

export const commonSettingsGridSx = {
  display: "grid",
  alignItems: "center",
  gap: 1,
  gridTemplateColumns: {
    xs: "1fr",
    md: "minmax(260px, 1fr) minmax(168px, 0.52fr) minmax(168px, 0.52fr)",
    xl: "minmax(320px, 1.25fr) minmax(178px, 0.42fr) minmax(178px, 0.42fr) minmax(300px, 0.9fr)",
  },
  minWidth: 0,
  "& .MuiInputBase-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    minHeight: 42,
    transition: "border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
  },
  "& .MuiInputBase-root.Mui-focused": {
    boxShadow: "0 0 0 3px rgba(15,108,189,0.08)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D9E2EF",
  },
  "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#B9C7DA",
  },
  "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0F6CBD",
    borderWidth: 1,
  },
  "& .MuiInputLabel-root": {
    backgroundColor: "#F7F9FC",
    color: "#536176",
    fontSize: 11.5,
    fontWeight: 800,
    lineHeight: 1.2,
    px: 0.55,
    transform: "translate(12px, -8px) scale(0.84)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#0F6CBD",
  },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    color: "#172033",
    fontSize: 13.5,
    fontWeight: 750,
    px: 1.45,
    py: "10px",
  },
  "& input[type='date']": {
    fontVariantNumeric: "tabular-nums",
  },
};

export const excelTableShellSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #C9D4E3",
  borderRadius: "7px",
  boxSizing: "border-box",
  maxHeight: "min(48vh, 460px)",
  minWidth: 0,
  overflow: "auto",
  scrollbarColor: "#B8C4D6 transparent",
  scrollbarWidth: "thin",
  width: "100%",
  "&::-webkit-scrollbar": {
    height: 10,
    width: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#B8C4D6",
    border: "2px solid #FFFFFF",
    borderRadius: "999px",
  },
};

export const excelGridColumns = "80px 72px 64px 64px 132px 108px 96px 132px 108px 154px 154px minmax(180px, 1fr) 52px";
export const excelGridMinWidth = 1384;

export const excelGridHeaderSx = {
  alignItems: "center",
  backgroundColor: "#F4F7FB",
  borderBottom: "1px solid #C9D4E3",
  color: "#536176",
  display: "grid",
  fontSize: 11.5,
  fontWeight: 900,
  gap: 0,
  gridTemplateColumns: excelGridColumns,
  minWidth: excelGridMinWidth,
  px: 0,
  py: 0,
  position: "sticky",
  top: 0,
  textTransform: "uppercase",
  zIndex: 4,
  "& .MuiTypography-root": {
    alignItems: "center",
    borderRight: "1px solid #E2E8F0",
    display: "flex",
    fontSize: 11,
    fontWeight: 950,
    height: 30,
    justifyContent: "center",
    lineHeight: 1.2,
    px: 1,
    textAlign: "center",
  },
  "& .MuiTypography-root:last-of-type": {
    borderRight: 0,
  },
};

export function excelGridRowSx(isExpandedNote: boolean, teacherId: string) {
  const tone = getTeacherTone(teacherId);

  return {
  alignItems: "center",
  backgroundColor: tone.bg,
  borderBottom: `1px solid ${tone.border}`,
  borderLeft: `4px solid ${tone.text}`,
  boxSizing: "border-box",
  display: "grid",
  gap: 0,
  gridTemplateColumns: excelGridColumns,
  minHeight: isExpandedNote ? 96 : 40,
  minWidth: excelGridMinWidth,
  px: 0,
  py: 0,
  transition: "border-color 160ms ease, background-color 160ms ease",
  "& > *": {
    borderRight: `1px solid ${tone.border}`,
    boxSizing: "border-box",
    height: isExpandedNote ? 96 : 40,
    minWidth: 0,
  },
  "& > *:last-child": {
    borderRight: 0,
  },
  "& .MuiInputBase-root": {
    backgroundColor: "transparent",
    borderRadius: 0,
    height: isExpandedNote ? 96 : 40,
    minHeight: isExpandedNote ? 96 : 40,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 0,
    paddingRight: 0,
  },
  "& .MuiSelect-icon": {
    fontSize: 19,
    right: 3,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "0 !important",
  },
  "& .MuiInputBase-root.Mui-focused": {
    backgroundColor: "rgba(255,255,255,0.86)",
    boxShadow: "inset 0 0 0 2px #2F80ED",
  },
  "& .MuiInputBase-input": {
    color: "#172033",
    fontSize: 13,
    fontWeight: 650,
    lineHeight: "20px",
    overflow: "hidden",
    px: 1,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& .MuiSelect-select": {
    fontSize: "13px !important",
    fontWeight: "650 !important",
    minHeight: "20px !important",
    paddingRight: "22px !important",
    py: "9px !important",
  },
  "&:hover": {
    backgroundColor: tone.bg,
    filter: "saturate(1.06)",
  },
  };
}

export const deleteRowButtonSx = {
  border: "1px solid transparent",
  borderRadius: "6px",
  color: "#D93025",
  height: 28,
  width: 28,
  "&:hover": {
    backgroundColor: "#FFECEC",
    borderColor: "#FFC9C9",
  },
};

export const excelActionCellSx = {
  alignItems: "center",
  backgroundColor: "#FCFDFE",
  display: "flex",
  height: 40,
  justifyContent: "center",
};

export const timeRangeCellSx = {
  alignItems: "center",
  display: "grid",
  gap: 0,
  gridTemplateColumns: "1fr auto 1fr",
  height: 40,
  minWidth: 0,
  px: 0,
  "& > .MuiTypography-root": {
    borderLeft: "1px solid #E6ECF4",
    borderRight: "1px solid #E6ECF4",
    display: "grid",
    height: 40,
    placeItems: "center",
  },
  "& .MuiInputBase-input": {
    fontVariantNumeric: "tabular-nums",
    textAlign: "center",
  },
};

export function teacherChipSx(tone: { bg: string; border: string; text: string }, muted: boolean) {
  return {
    alignItems: "center",
    backgroundColor: tone.bg,
    border: `1px solid ${tone.border}`,
    borderRadius: "999px",
    boxSizing: "border-box",
    display: "inline-flex",
    gap: 0.65,
    height: 26,
    maxWidth: "100%",
    minWidth: 0,
    opacity: muted ? 0.82 : 1,
    px: 0.8,
    verticalAlign: "middle",
    width: "100%",
  };
}

export const teacherChipDotSx = (color: string) => ({
  backgroundColor: color,
  borderRadius: "50%",
  boxShadow: "0 0 0 2px rgba(255,255,255,0.9)",
  flexShrink: 0,
  height: 7,
  width: 7,
});

export function noteFieldSx(expanded: boolean) {
  return {
    alignSelf: "stretch",
    backgroundColor: expanded ? "#FBFDFF" : "transparent",
    position: "relative",
    zIndex: expanded ? 2 : 1,
    "& .MuiInputBase-root": {
      alignItems: expanded ? "flex-start" : "center",
      height: expanded ? "100%" : 40,
      minHeight: expanded ? 96 : 40,
    },
    "& textarea": {
      lineHeight: "20px",
      overflow: expanded ? "auto" : "hidden !important",
      resize: expanded ? "vertical" : "none",
      whiteSpace: expanded ? "pre-wrap" : "nowrap",
    },
    "& textarea:not(:focus)": {
      textOverflow: "ellipsis",
    },
  };
}
