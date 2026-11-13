import type { LeaderboardPeriod } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";

export const LEADERBOARD_PERIODS: readonly LeaderboardPeriod[] = ["WEEK", "MONTH", "COURSE"];

/** "Tuần này" / "Tháng 11" / "Học kỳ I" — term I runs 1 Sep – 15 Jan, as on the backend. */
export function leaderboardPeriodLabel(period: LeaderboardPeriod, now = new Date()) {
  if (period === "WEEK") return "Tuần này";
  if (period === "COURSE") return "Cả khóa học";
  const month = now.getMonth() + 1;
  if (period === "MONTH") return `Tháng ${month}`;
  return month >= 9 || (month === 1 && now.getDate() < 16) ? "Học kỳ I" : "Học kỳ II";
}

/** Days, hours and minutes left until the board closes; null when the date is unreadable or already past. */
export function leaderboardCountdown(endsAt: string, now = new Date()) {
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const minutes = Math.floor(ms / 60_000);
  return { days: Math.floor(minutes / 1440), hours: Math.floor(minutes / 60) % 24, minutes: minutes % 60 };
}

/** "Chốt sau 2 ngày 14 giờ" until the period's board closes; "" when the date is unreadable. */
export function leaderboardClosesIn(endsAt: string, now = new Date()) {
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (Number.isNaN(ms)) return "";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "Sắp chốt bảng";
  const days = Math.floor(hours / 24);
  return days ? `Chốt sau ${days} ngày ${hours % 24} giờ` : `Chốt sau ${hours} giờ`;
}
