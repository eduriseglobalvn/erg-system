import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ViewerRankStrip, xpToNextRank } from "./viewer-rank-strip";

const e = (rank: number, xp: number, isViewer = false, rankChange = 0) =>
  ({ rank, xp, isViewer, rankChange, studentId: `s${rank}`, studentName: `HS ${rank}`, streakDays: 0 }) as ClassLeaderboardEntry;
const board = [e(1, 520), e(2, 410), e(3, 420), e(4, 380, true, 2)];

describe("ViewerRankStrip", () => {
  it("shows rank, size, change and the gap to the next place", () => {
    render(<ViewerRankStrip entries={board} label="lớp 7A" />);
    expect(screen.getByText("#4")).toBeTruthy();
    expect(screen.getByText("/ 4 bạn lớp 7A")).toBeTruthy();
    expect(screen.getByText("Lên 2 hạng")).toBeTruthy();
    expect(screen.getByText("Còn 41 XP lên hạng 3")).toBeTruthy();
  });
  it("renders nothing for a hidden or unranked viewer", () => {
    const { container } = render(<ViewerRankStrip entries={[e(1, 5)]} label="lớp 7A" />);
    expect(container.firstChild).toBeNull();
  });
  it("has no gap for rank 1", () => {
    expect(xpToNextRank([e(1, 9, true)])).toBeNull();
  });
});
