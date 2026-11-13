import { describe, expect, it } from "vitest";

import { LEADERBOARD_PERIODS, TEACHER_LEADERBOARD_PERIODS, leaderboardClosesIn, leaderboardCountdown, leaderboardPeriodLabel, leaderboardWeekLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";

describe("leaderboard period", () => {
  it("keeps TERM on the teacher board and COURSE on the student board", () => {
    expect(TEACHER_LEADERBOARD_PERIODS).toEqual(["WEEK", "MONTH", "TERM"]);
    expect(LEADERBOARD_PERIODS).toEqual(["WEEK", "MONTH", "COURSE"]);
  });

  it("names the period like the design", () => {
    const nov = new Date(2026, 10, 12, 9);
    expect(leaderboardPeriodLabel("WEEK", nov)).toBe("Tuần này");
    expect(leaderboardPeriodLabel("MONTH", nov)).toBe("Tháng 11");
    expect(leaderboardPeriodLabel("COURSE", nov)).toBe("Cả khóa học");
    expect(leaderboardPeriodLabel("TERM", nov)).toBe("Học kỳ I");
    expect(leaderboardPeriodLabel("TERM", new Date(2027, 0, 15))).toBe("Học kỳ I");
    expect(leaderboardPeriodLabel("TERM", new Date(2027, 0, 16))).toBe("Học kỳ II");
  });

  it("counts down to the close", () => {
    const now = new Date("2026-11-12T10:00:00Z");
    expect(leaderboardClosesIn("2026-11-15T00:00:00Z", now)).toBe("Chốt sau 2 ngày 14 giờ");
    expect(leaderboardClosesIn("2026-11-12T15:30:00Z", now)).toBe("Chốt sau 5 giờ");
    expect(leaderboardClosesIn("2026-11-12T10:20:00Z", now)).toBe("Sắp chốt bảng");
    expect(leaderboardClosesIn("not a date", now)).toBe("");
  });

  it("splits the time left into days, hours and minutes", () => {
    const now = new Date("2026-11-12T10:00:00Z");
    expect(leaderboardCountdown("2026-11-15T00:32:00Z", now)).toEqual({ days: 2, hours: 14, minutes: 32 });
    expect(leaderboardCountdown("2026-11-11T00:00:00Z", now)).toBeNull();
  });
});

describe("leaderboardWeekLabel", () => {
  it("labels the ISO week ending at the next Monday", () => {
    expect(leaderboardWeekLabel("2026-11-16T00:00:00")).toBe("Tuần 46 · 09/11 – 15/11");
    expect(leaderboardWeekLabel("nope")).toBe("");
  });
});
