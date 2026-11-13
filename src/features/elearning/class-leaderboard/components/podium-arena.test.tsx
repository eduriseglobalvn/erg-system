import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { PodiumArena } from "./podium-arena";
import { ChaseStrip, chaseOf } from "./chase-strip";
import { EarnXpCard, RankPositionCard, WeekRewardsCard } from "./ranking-side-cards";

const e = (rank: number, xp: number, name: string, isViewer = false): ClassLeaderboardEntry =>
  ({ rank, xp, isViewer, rankChange: isViewer ? 2 : 0, studentId: `s${rank}`, studentName: name, streakDays: isViewer ? 12 : 3, xpToday: 0 }) as ClassLeaderboardEntry;
const chasing = [e(1, 512, "Khánh Thy"), e(2, 486, "Đức Huy"), e(3, 420, "Gia Bảo"), e(4, 380, "Minh Anh", true)];
const holding = [e(1, 512, "Khánh Thy"), e(2, 486, "Đức Huy", true), e(3, 420, "Gia Bảo"), e(4, 380, "Thảo Linh")];
const contained = () => document.body.querySelectorAll(".MuiButton-contained").length;

describe("PodiumArena (H08 / H03b)", () => {
  it("draws rays and confetti and the chase strip with one contained button", () => {
    const onStart = vi.fn();
    render(<PodiumArena entries={chasing} subtitle="sub" title="Top 3 tuần này" onStart={onStart} />);
    expect(document.querySelector("[data-design='H08.rays']")).toBeTruthy();
    expect(document.querySelectorAll("[data-design='H08.confetti']").length).toBe(6);
    expect(screen.getByText("Bạn đang #4 · 380 XP")).toBeTruthy();
    expect(screen.getByText("40 XP")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Đã có 380 trên 420 XP để lên hạng 3" })).toBeTruthy();
    expect(contained()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /Làm 1 bài để lên bục/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("renders the compact chase card with 380 / 420 and one contained button", () => {
    render(<ChaseStrip compact entries={chasing} onStart={vi.fn()} />);
    expect(screen.getByText("Còn 40 XP là lên bục")).toBeTruthy();
    expect(screen.getByText("380 / 420")).toBeTruthy();
    expect(contained()).toBe(1);
  });

  it("says how far ahead of rank 4 a podium viewer is", () => {
    render(<PodiumArena entries={holding} subtitle="sub" title="Top 3" onStart={vi.fn()} />);
    expect(screen.getByText("Giữ vị trí: hơn hạng 4 106 XP")).toBeTruthy();
    expect(screen.queryByRole("img", { name: /để lên hạng 3/ })).toBeNull();
  });

  it("shows no strip for an unranked viewer", () => {
    expect(chaseOf(chasing.map((x) => ({ ...x, isViewer: false })))).toBeNull();
  });
});

describe("ranking side cards (H08)", () => {
  it("shows the position ring, gap line and stats", () => {
    render(<RankPositionCard entries={chasing} periodWord="tuần" size={32} />);
    expect(screen.getByText("Còn 40 XP lên hạng 3")).toBeTruthy();
    expect(screen.getByText("380 / 420 XP · làm thêm 1 bài là vượt Gia Bảo")).toBeTruthy();
    expect(screen.getByText("Lên 2 hạng")).toBeTruthy();
    expect(screen.getByText("×1,2")).toBeTruthy();
    expect((document.querySelector("[data-design='H08.ring']") as HTMLElement)).toBeTruthy();
  });

  it("lists open assignments with outlined buttons, and hides when none", () => {
    const onStart = vi.fn();
    const items = [{ id: "a1", title: "Luyện tập", subtitle: "Toán · hôm nay", xp: 50 }, { id: "a2", title: "Trắc nghiệm", subtitle: "Văn", xp: 40 }];
    const { rerender } = render(<EarnXpCard gap={40} items={items} onStart={onStart} />);
    expect(screen.getByText("2 bài đang mở")).toBeTruthy();
    expect(screen.getByText("Đủ để lên bục · Toán · hôm nay")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Làm ngay" }));
    expect(onStart).toHaveBeenCalledWith("a1");
    expect(contained()).toBe(0);
    rerender(<EarnXpCard items={[]} />);
    expect(screen.queryByText("Kiếm XP ngay")).toBeNull();
  });

  it("lists the three weekly badges", () => {
    render(<WeekRewardsCard />);
    for (const name of ["Top 3 tuần", "Bền bỉ", "Bứt phá"]) expect(screen.getByText(name)).toBeTruthy();
  });
});
