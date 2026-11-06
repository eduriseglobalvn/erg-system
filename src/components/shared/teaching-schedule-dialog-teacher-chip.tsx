import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { getTeacherTone } from "./teaching-schedule-dialog-model";
import { scheduleSelectSlotProps, teacherChipDotSx, teacherChipSx } from "./teaching-schedule-dialog-styles";

export function teacherSelectSlotProps(teacherId: string, label: string, muted = false) {
  return {
    select: {
      ...scheduleSelectSlotProps.select,
      renderValue: () => <TeacherColorChip label={label} muted={muted} teacherId={teacherId || "none"} />,
    },
  };
}

export function TeacherColorChip({ label, muted = false, teacherId }: { label: string; muted?: boolean; teacherId: string }) {
  const tone = muted ? { bg: "#FAFAFC", border: "#D9E2EF", text: "#6E6E73" } : getTeacherTone(teacherId);

  return (
    <Tooltip arrow title={label}>
      <Box component="span" sx={teacherChipSx(tone, muted)} title={label}>
        <Box component="span" sx={teacherChipDotSx(tone.text)} />
        <Typography component="span" noWrap sx={{ color: tone.text, fontSize: 12.5, fontWeight: 850, minWidth: 0 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
