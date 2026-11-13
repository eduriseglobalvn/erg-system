import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassLeaderboardTable } from "./class-leaderboard-table";

const e = (rank: number, name: string, xp: number, extra: Partial<ClassLeaderboardEntry> = {}) =>
  ({ rank, studentId: `s${rank}`, studentName: name, xp, streakDays: 2, rankChange: 0, isViewer: false, tierKey: null, division: null, frameKey: null, hidden: false, ...extra }) as ClassLeaderboardEntry;

describe("ClassLeaderboardTable", () => {
  it("lists every entry by default and shows no tier chip on the rows", () => {
    render(<ClassLeaderboardTable entries={[e(1, "An", 500, { tierKey: "dong", division: 2, frameKey: "dong" }), e(2, "Bình", 400)]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText(/^Đồng/)).toBeNull();
  });

  it("skips the podium ranks, titles the card and offers Xem cả lớp", () => {
    const onOpenAll = vi.fn();
    const entries = [e(1, "A", 520), e(2, "B", 410), e(3, "C", 420), e(4, "Minh Anh", 380, { isViewer: true })];
    render(<ClassLeaderboardTable entries={entries} skipPodium total={32} onOpenAll={onOpenAll} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Bảng xếp hạng")).toBeTruthy();
    expect(screen.getByText("Hiện 4 / 32 bạn")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xem cả lớp" }));
    expect(onOpenAll).toHaveBeenCalled();
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
