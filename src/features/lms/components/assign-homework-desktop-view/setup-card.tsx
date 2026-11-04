import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { parseAssignDateTime } from "@/features/lms/components/assign-homework-recipient";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

const ASSIGN_DATE_FORMAT = "DD/MM/YYYY HH:mm:ss";

function toPickerValue(value: string): Dayjs | null {
  const iso = parseAssignDateTime(value);
  return iso ? dayjs(iso) : null;
}

export function AssignHomeworkSetupCard({ model }: { model: AssignHomeworkController }) {
  const {
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    targetType,
    setTargetType,
    attemptLimit,
    setAttemptLimit,
    maxDurationMinutes,
    setMaxDurationMinutes,
    selectedStudentIds,
  } = model;
  const pickerSlot = { textField: { size: "small" as const, fullWidth: true } };

  return (
    <Box
      component="section"
      sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, flexShrink: 0, p: 3 }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography component="h2" variant="subtitle1">Thiết lập giao bài</Typography>
        <Typography color="text.secondary" variant="body2">{selectedStudentIds.size} học sinh đã chọn</Typography>
      </Box>
      <LocalizationProvider adapterLocale="vi" dateAdapter={AdapterDayjs}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
          <ErgSelect
            label="Đối tượng giao bài"
            onChange={(event) => setTargetType(event.target.value as "grade" | "class" | "group")}
            options={[
              { label: "Giao theo khối", value: "grade" },
              { label: "Giao theo lớp", value: "class" },
              { label: "Giao theo nhóm học tập", value: "group" },
            ]}
            size="small"
            value={targetType}
          />
          <ErgTextField
            label="Tên bài tập"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nhập tên bài tập..."
            required
            size="small"
            value={title}
          />
          <ErgTextField
            label="Số lần làm"
            onChange={(event) => setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
            size="small"
            slotProps={{ htmlInput: { max: 20, min: 1 }, input: { endAdornment: <InputAdornment position="end">lần</InputAdornment> } }}
            type="number"
            value={attemptLimit}
          />
          <ErgTextField
            label="Thời gian tối đa"
            onChange={(event) => setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
            size="small"
            slotProps={{ htmlInput: { max: 240, min: 1 }, input: { endAdornment: <InputAdornment position="end">phút</InputAdornment> } }}
            type="number"
            value={maxDurationMinutes}
          />
          <DateTimePicker
            ampm={false}
            format="DD/MM/YYYY HH:mm"
            label="Ngày bắt đầu"
            onChange={(next) => next?.isValid() && setStartDate(next.format(ASSIGN_DATE_FORMAT))}
            slotProps={pickerSlot}
            value={toPickerValue(startDate)}
          />
          <DateTimePicker
            ampm={false}
            format="DD/MM/YYYY HH:mm"
            label="Ngày kết thúc"
            minDateTime={toPickerValue(startDate) ?? undefined}
            onChange={(next) => next?.isValid() && setEndDate(next.format(ASSIGN_DATE_FORMAT))}
            slotProps={pickerSlot}
            value={toPickerValue(endDate)}
          />
        </Box>
      </LocalizationProvider>
    </Box>
  );
}
