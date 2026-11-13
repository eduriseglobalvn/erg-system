import { describe, expect, it } from "vitest";

import { leaderboardClosesIn, leaderboardCountdown, leaderboardPeriodLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";

describe("leaderboard period", () => {
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
