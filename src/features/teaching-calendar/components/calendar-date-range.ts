import dayjs from "dayjs";

export type CalendarRangeMode = "day" | "week" | "month";

export function createInitialCalendarRange(mode: CalendarRangeMode) {
  const today = dayjs();
  const mondayOffset = (today.day() + 6) % 7;
  const from = mode === "month"
    ? today.startOf("month")
    : mode === "week"
      ? today.subtract(mondayOffset, "day")
      : today;
  const to = mode === "month"
    ? today.endOf("month")
    : mode === "week"
      ? from.add(6, "day")
      : today;

  return {
    from: from.format("YYYY-MM-DD"),
    initialDate: today.format("YYYY-MM-DD"),
    to: to.format("YYYY-MM-DD"),
  };
}
