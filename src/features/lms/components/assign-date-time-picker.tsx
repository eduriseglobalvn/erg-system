import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type DateTimePickerPopoverProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
};

export function DateTimePickerPopover({ open, value, onChange, onClose }: DateTimePickerPopoverProps) {
  const parsedValue = useMemo(() => parseDateTimeValue(value), [value]);
  const [step, setStep] = useState<"date" | "time">("date");
  const [selectedDate, setSelectedDate] = useState<Date>(parsedValue.date);
  const [timeValue, setTimeValue] = useState(parsedValue.time);
  const [viewMonth, setViewMonth] = useState(parsedValue.date.getMonth());
  const [viewYear, setViewYear] = useState(parsedValue.date.getFullYear());

  useEffect(() => {
    if (!open) return;
    const nextValue = parseDateTimeValue(value);
    setStep("date");
    setSelectedDate(nextValue.date);
    setTimeValue(nextValue.time);
    setViewMonth(nextValue.date.getMonth());
    setViewYear(nextValue.date.getFullYear());
  }, [open, value]);

  if (!open) return null;

  const days = buildCalendarDays(viewYear, viewMonth);
  const selectedKey = dateKey(selectedDate);

  function moveMonth(offset: number) {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  }

  function selectDate(day: Date) {
    setSelectedDate(day);
    setStep("time");
  }

  function applyValue() {
    onChange(formatDateTimeValue(selectedDate, timeValue));
    onClose();
  }

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[320px] overflow-hidden rounded-lg border border-[#e0e4ea] bg-white text-slate-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setStep("date")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-semibold transition",
            step === "date" ? "bg-[#ebf3fc] text-[var(--erg-blue)]" : "text-slate-500 hover:bg-[#f3f4f6]",
          )}
        >
          1. Chọn ngày
        </button>
        <button
          type="button"
          onClick={() => setStep("time")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-semibold transition",
            step === "time" ? "bg-[#ebf3fc] text-[var(--erg-blue)]" : "text-slate-500 hover:bg-[#f3f4f6]",
          )}
        >
          2. Chọn giờ
        </button>
      </div>

      {step === "date" ? (
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => moveMonth(-1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-[#f3f4f6]">
              ⬹
            </button>
            <div className="text-sm font-semibold text-slate-800">
              Tháng {viewMonth + 1}/{viewYear}
            </div>
            <button type="button" onClick={() => moveMonth(1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-[#f3f4f6]">
              ⬺
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) =>
              day ? (
                <button
                  key={dateKey(day)}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "grid h-9 place-items-center rounded-md text-xs font-semibold transition",
                    dateKey(day) === selectedKey
                      ? "bg-[var(--erg-blue)] text-white"
                      : "text-slate-600 hover:bg-[#ebf3fc] hover:text-[var(--erg-blue)]",
                  )}
                >
                  {day.getDate()}
                </button>
              ) : (
                <span key={`blank-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-lg bg-[#fafbfc] px-4 py-3 text-center">
            <div className="text-[10px] font-semibold text-slate-500">Ngày đã chọn</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{formatDateOnlyValue(selectedDate)}</div>
          </div>
          <label className="mt-4 grid gap-2">
            <span className="text-[10px] font-semibold text-slate-500">Giờ làm bài</span>
            <input
              type="time"
              step={1}
              value={timeValue}
              onChange={(event) => setTimeValue(normalizeTimeValue(event.target.value))}
              className="h-10 rounded-md border border-[#d1d1d1] bg-white px-4 text-center text-base font-semibold text-slate-800 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setStep("date")} className="h-9 rounded-md border border-[#d1d1d1] px-4 text-xs font-semibold text-slate-600 hover:bg-[#f3f4f6]">
              Chọn lại ngày
            </button>
            <button type="button" onClick={applyValue} className="h-9 rounded-md bg-[var(--erg-blue)] px-5 text-xs font-semibold text-white hover:bg-[var(--erg-blue-hover)]">
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseDateTimeValue(value: string) {
  const matched = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!matched) {
    return { date: new Date(), time: "00:00:00" };
  }

  const [, day, month, year, hour, minute, second = "00"] = matched;
  return {
    date: new Date(Number(year), Number(month) - 1, Number(day)),
    time: `${hour}:${minute}:${second}`,
  };
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = Array.from({ length: startOffset }, () => null);

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatDateTimeValue(date: Date, time: string) {
  return `${formatDateOnlyValue(date)} ${normalizeTimeValue(time)}`;
}

function formatDateOnlyValue(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function normalizeTimeValue(value: string) {
  const [hour = "00", minute = "00", second = "00"] = value.split(":");
  return `${pad2(Number(hour))}:${pad2(Number(minute))}:${pad2(Number(second))}`;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
