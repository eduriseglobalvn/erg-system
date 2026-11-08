import type { ReactNode } from "react";
import FlagIcon from "@mui/icons-material/Flag";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { formatShortDateTimeVi } from "@/features/lms/api/lms-date-label";
import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { MobileFormSection, MobileRowText, mobileCardSx, mobileRowSx } from "@/features/lms/components/assign-homework-mobile/mobile-form-section";
import { parseAssignDateTime } from "@/features/lms/components/assign-homework-recipient";
import { AssignQuizThemeSlot } from "@/features/lms/components/assign-quiz-theme-slot";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** N8 section 3: open time and due time (canvas `.grid2` of `.inp`). */
export function ScheduleSection({ model: m }: { model: AssignHomeworkController }) {
  const field = (kind: "start" | "end", label: string, icon: ReactNode, value: string, onChange: (value: string) => void) => (
    <Box sx={{ minWidth: 0, position: "relative" }}>
      <ButtonBase
        aria-label={`${label}: ${formatShortDateTimeVi(parseAssignDateTime(value)) || value}`}
        onClick={() => m.setOpenDatePicker(m.openDatePicker === kind ? null : kind)}
        sx={{ alignItems: "center", bgcolor: "background.paper", border: 1, borderColor: t.color.borderStrong, borderRadius: `${t.radius.control}px`, color: "text.primary", display: "flex", gap: 1, height: t.size.controlLg, justifyContent: "flex-start", px: 1.75, width: "100%" }}
      >
        <Box aria-hidden sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
        <Typography noWrap sx={{ fontVariantNumeric: "tabular-nums" }} variant="body2">{formatShortDateTimeVi(parseAssignDateTime(value)) || value}</Typography>
      </ButtonBase>
      <DateTimePickerPopover onChange={onChange} onClose={() => m.setOpenDatePicker(null)} open={m.openDatePicker === kind} value={value} />
    </Box>
  );

  return (
    <MobileFormSection number={3} title="Thời gian">
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {field("start", "Mở bài", <PlayCircleIcon fontSize="small" />, m.startDate, m.setStartDate)}
        {field("end", "Hạn nộp", <FlagIcon fontSize="small" />, m.endDate, m.setEndDate)}
      </Box>
    </MobileFormSection>
  );
}

const unitSlot = (unit: string) => ({
  input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
});

/** N8 section 4: quiz theme row plus the attempt and duration limits the API accepts. */
export function OptionsSection({ model: m }: { model: AssignHomeworkController }) {
  return (
    <MobileFormSection number={4} title="Cách làm bài">
      <Box sx={{ ...mobileCardSx, overflow: "hidden" }}>
        <Box sx={{ "&:empty": { display: "none" }, borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
          <AssignQuizThemeSlot selectedQuizIds={m.selectedResourceIds} />
        </Box>
        <Box sx={mobileRowSx}>
          <MobileRowText title="Số lần làm" />
          <ErgTextField
            onChange={(event) => m.setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
            size="small"
            slotProps={{ ...unitSlot("lần"), htmlInput: { "aria-label": "Số lần làm", max: 20, min: 1 } }}
            sx={{ width: 112 }}
            type="number"
            value={m.attemptLimit}
          />
        </Box>
        <Box sx={{ ...mobileRowSx, borderTop: 1, borderColor: "divider" }}>
          <MobileRowText title="Thời gian làm tối đa" />
          <ErgTextField
            onChange={(event) => m.setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
            size="small"
            slotProps={{ ...unitSlot("phút"), htmlInput: { "aria-label": "Thời gian làm tối đa", max: 240, min: 1 } }}
            sx={{ width: 112 }}
            type="number"
            value={m.maxDurationMinutes}
          />
        </Box>
      </Box>
    </MobileFormSection>
  );
}
