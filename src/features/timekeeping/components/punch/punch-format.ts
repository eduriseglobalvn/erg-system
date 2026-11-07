const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** HH:mm:ss, 24 hours. */
export const hms = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** "Thứ Sáu, 06/11/2026". */
export const weekdayDateVi = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

/** "yyyy-MM" period key of the month the server clock is in. */
export const periodOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** "07:30:00" -> "07:30"; also accepts an ISO date-time; "" when missing. */
export function hhmm(value: string | null | undefined): string {
  if (!value) return "";
  const time = /^(\d{2}):(\d{2})/.exec(value);
  if (time) return `${time[1]}:${time[2]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "11:30" minus `min` minutes, wrapped inside the day. */
export function minusMinutes(time: string, min: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (((h * 60 + m - min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
