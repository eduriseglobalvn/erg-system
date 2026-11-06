import dayjs from "dayjs";
import "dayjs/locale/vi";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

/** dd/MM/yyyy date field (native type=date follows the browser locale and shows mm/dd). Value is yyyy-MM-dd. */
export function AttendanceDateField({
  maxDate,
  minHeight,
  onChange,
  value,
}: {
  maxDate: string;
  minHeight?: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <DatePicker
        format="DD/MM/YYYY"
        maxDate={dayjs(maxDate)}
        onChange={(next) => {
          if (next?.isValid()) onChange(next.format("YYYY-MM-DD"));
        }}
        slotProps={{
          textField: {
            label: "Ngày điểm danh",
            size: "small",
            sx: { minWidth: 150, "& .MuiInputBase-root": { minHeight } },
          },
        }}
        value={dayjs(value)}
      />
    </LocalizationProvider>
  );
}
