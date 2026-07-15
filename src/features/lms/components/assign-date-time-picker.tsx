import { useEffect, useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

type DateTimePickerPopoverProps = { open: boolean; value: string; onChange: (value: string) => void; onClose: () => void; mode?: "date-time" | "date" };

export function DateTimePickerPopover({ open, value, onChange, onClose, mode = "date-time" }: DateTimePickerPopoverProps) {
  const parsedValue = useMemo(() => parseDateTimeValue(value), [value]);
  const [step, setStep] = useState<"date" | "time">("date");
  const [selectedDate, setSelectedDate] = useState(parsedValue.date);
  const [timeValue, setTimeValue] = useState(parsedValue.time);
  const [viewMonth, setViewMonth] = useState(parsedValue.date.getMonth());
  const [viewYear, setViewYear] = useState(parsedValue.date.getFullYear());
  useEffect(() => {
    if (!open) return;
    const next = parseDateTimeValue(value);
    setStep("date"); setSelectedDate(next.date); setTimeValue(next.time); setViewMonth(next.date.getMonth()); setViewYear(next.date.getFullYear());
  }, [open, value]);
  if (!open) return null;
  const days = buildCalendarDays(viewYear, viewMonth);
  const selectedKey = dateKey(selectedDate);
  const moveMonth = (offset: number) => { const next = new Date(viewYear, viewMonth + offset, 1); setViewMonth(next.getMonth()); setViewYear(next.getFullYear()); };
  const selectDate = (day: Date) => { setSelectedDate(day); if (mode === "date") { onChange(formatDateOnlyValue(day)); onClose(); } else setStep("time"); };
  const applyValue = () => { onChange(mode === "date" ? formatDateOnlyValue(selectedDate) : formatDateTimeValue(selectedDate, timeValue)); onClose(); };
  return (
    <Box sx={{ position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 50, width: 320, overflow: "hidden", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", color: "text.primary", boxShadow: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
        <Button size="small" onClick={() => setStep("date")} sx={{ bgcolor: step === "date" ? "primary.light" : "transparent", color: step === "date" ? "primary.main" : "text.secondary", fontSize: 13, fontWeight: 600, textTransform: "none" }}>1. Chọn ngày</Button>
        {mode === "date-time" && <Button size="small" onClick={() => setStep("time")} sx={{ bgcolor: step === "time" ? "primary.light" : "transparent", color: step === "time" ? "primary.main" : "text.secondary", fontSize: 13, fontWeight: 600, textTransform: "none" }}>2. Chọn giờ</Button>}
      </Stack>
      {step === "date" ? (
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <IconButton size="small" onClick={() => moveMonth(-1)} aria-label="Tháng trước"><ChevronLeftIcon fontSize="small" /></IconButton>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Tháng {viewMonth + 1}/{viewYear}</Typography>
            <IconButton size="small" onClick={() => moveMonth(1)} aria-label="Tháng sau"><ChevronRightIcon fontSize="small" /></IconButton>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, textAlign: "center" }}>
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <Typography key={day} sx={{ py: 0.5, color: "text.secondary", fontSize: 13, fontWeight: 700 }}>{day}</Typography>)}
            {days.map((day, index) => day ? <Button key={dateKey(day)} onClick={() => selectDate(day)} sx={{ minWidth: 0, height: 36, borderRadius: 1, bgcolor: dateKey(day) === selectedKey ? "primary.main" : "transparent", color: dateKey(day) === selectedKey ? "common.white" : "text.secondary", fontSize: 13, fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: dateKey(day) === selectedKey ? "primary.dark" : "primary.light" } }}>{day.getDate()}</Button> : <Box key={`blank-${index}`} />)}
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Box sx={{ borderRadius: 1, bgcolor: "grey.50", px: 2, py: 1.5, textAlign: "center" }}><Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700 }}>Ngày đã chọn</Typography><Typography sx={{ mt: 0.5, fontSize: 14, fontWeight: 600 }}>{formatDateOnlyValue(selectedDate)}</Typography></Box>
          <TextField label="Giờ làm bài" type="time" fullWidth value={timeValue} onChange={(event) => setTimeValue(normalizeTimeValue(event.target.value))} slotProps={{ inputLabel: { shrink: true } }} sx={{ mt: 2, "& input": { textAlign: "center", fontWeight: 700 } }} />
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}><Button size="small" variant="outlined" onClick={() => setStep("date")} sx={{ textTransform: "none", fontWeight: 600 }}>Chọn lại ngày</Button><Button size="small" variant="contained" onClick={applyValue} sx={{ textTransform: "none", fontWeight: 700 }}>Áp dụng</Button></Stack>
        </Box>
      )}
    </Box>
  );
}

function parseDateTimeValue(value: string) { const matched = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/); if (!matched) return { date: new Date(), time: "00:00:00" }; const [, day, month, year, hour = "00", minute = "00", second = "00"] = matched; return { date: new Date(Number(year), Number(month) - 1, Number(day)), time: `${hour}:${minute}:${second}` }; }
function buildCalendarDays(year: number, month: number) { const firstDay = new Date(year, month, 1); const days: Array<Date | null> = Array.from({ length: (firstDay.getDay() + 6) % 7 }, () => null); for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day += 1) days.push(new Date(year, month, day)); return days; }
function formatDateTimeValue(date: Date, time: string) { return `${formatDateOnlyValue(date)} ${normalizeTimeValue(time)}`; }
function formatDateOnlyValue(date: Date) { return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`; }
function normalizeTimeValue(value: string) { const [hour = "00", minute = "00", second = "00"] = value.split(":"); return `${pad2(Number(hour))}:${pad2(Number(minute))}:${pad2(Number(second))}`; }
function dateKey(date: Date) { return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`; }
function pad2(value: number) { return String(value).padStart(2, "0"); }
