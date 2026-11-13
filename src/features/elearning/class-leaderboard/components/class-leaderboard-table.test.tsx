import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassLeaderboardTable } from "./class-leaderboard-table";

const e = (rank: number, name: string, xp: number, extra: Partial<ClassLeaderboardEntry> = {}) =>
  ({ rank, studentId: `s${rank}`, studentName: name, xp, streakDays: 2, rankChange: 0, isViewer: false, tierKey: null, division: null, frameKey: null, hidden: false, ...extra }) as ClassLeaderboardEntry;

describe("ClassLeaderboardTable", () => {
  it("shows the tier chip only for students that have a tier", () => {
    render(<ClassLeaderboardTable entries={[e(1, "An", 500, { tierKey: "dong", division: 2, frameKey: "dong" }), e(2, "Bình", 400)]} />);
    expect(screen.getByText("Đồng 2")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByText(/^Đồng/)).toHaveLength(1);
  });

  it("draws the dashed top-3 line before the viewer's rows and a real footer count", () => {
    const entries = [e(1, "A", 520), e(2, "B", 410), e(3, "C", 420), e(4, "Minh Anh", 380, { isViewer: true, rankChange: 2 })];
    render(<ClassLeaderboardTable entries={entries} total={32} />);
    expect(screen.getByText("Cần 420 XP để vào top 3")).toBeTruthy();
    expect(screen.getByText("Hiện 4 / 32 bạn")).toBeTruthy();
    const me = document.querySelector("[aria-current]") as HTMLElement;
    expect(within(me).getByText("Bạn")).toBeTruthy();
    expect(within(me).getByLabelText("Lên 2 hạng")).toBeTruthy();
  });
});
