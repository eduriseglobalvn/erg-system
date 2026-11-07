import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import type { SendMode } from "../model/campaign-form-schema";

type Props = {
  error?: string;
  mode: SendMode;
  onModeChange: (mode: SendMode) => void;
  onScheduledAtChange: (value: string) => void;
  scheduledAt: string;
};

const LOCAL_INPUT = "YYYY-MM-DDTHH:mm";

/** "Gửi ngay" or "Hẹn giờ" (24-hour, device local time, up to 30 days ahead). */
export function CampaignScheduleField({ error, mode, onModeChange, onScheduledAtChange, scheduledAt }: Props) {
  // dayjs reads an offset-less "YYYY-MM-DDTHH:mm" as local time with its own parser (no Date string parsing).
  const value = scheduledAt ? dayjs(scheduledAt) : null;
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend" id="campaign-send-mode" sx={{ typography: "subtitle2", color: "text.primary" }}>Thời điểm gửi</FormLabel>
      <RadioGroup aria-labelledby="campaign-send-mode" onChange={(_, next) => onModeChange(next as SendMode)} row value={mode}>
        <FormControlLabel control={<Radio />} label="Gửi ngay" value="now" />
        <FormControlLabel control={<Radio />} label="Hẹn giờ" value="schedule" />
      </RadioGroup>
      {mode === "schedule" ? (
        <LocalizationProvider adapterLocale="vi" dateAdapter={AdapterDayjs}>
          <DateTimePicker
            ampm={false}
            disablePast
            format="HH:mm · DD/MM/YYYY"
            label="Ngày giờ gửi"
            maxDateTime={dayjs().add(30, "day")}
            onChange={(next) => onScheduledAtChange(next?.isValid() ? next.format(LOCAL_INPUT) : "")}
            slotProps={{ textField: { error: Boolean(error), fullWidth: true, helperText: error } }}
            value={value}
          />
        </LocalizationProvider>
      ) : null}
    </FormControl>
  );
}
