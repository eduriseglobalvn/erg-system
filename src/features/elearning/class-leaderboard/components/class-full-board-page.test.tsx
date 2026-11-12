import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MINH_ANH, renderWithQuery } from "@/features/elearning/student-tier/components/tier-fixtures";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassFullBoardPage } from "./class-full-board-page";

const api = vi.hoisted(() => ({ load: vi.fn(), loadMyTier: vi.fn() }));
vi.mock("@/features/elearning/class-leaderboard/api/class-leaderboard-api", async (original) => ({ ...(await original<object>()), loadStudentClassLeaderboard: api.load }));
vi.mock("@/features/elearning/student-tier/api/student-tier-api", async (original) => ({ ...(await original<object>()), loadMyTier: api.loadMyTier }));

const e = (rank: number, name: string, xp: number, tierKey: string, division: number | null, extra: Partial<ClassLeaderboardEntry> = {}) =>
  ({ rank, studentId: `s${rank}`, studentName: name, xp, streakDays: 3, rankChange: 0, isViewer: false, rankDelta: 0, submittedInPeriod: 2, xpToday: 0, tierKey, division, frameKey: tierKey, hidden: false, ...extra }) as ClassLeaderboardEntry;

const entries = [
  e(1, "Khánh Thy", 9420, "ct", null),
  e(7, "Nguyễn Minh Anh", 1240, "dong", 2, { isViewer: true, rankChange: 2 }),
  e(12, "Bạn", 310, "sat", 5, { hidden: true, frameKey: null }),
];

beforeEach(() => {
  api.loadMyTier.mockResolvedValue(MINH_ANH);
  api.load.mockResolvedValue({ classId: "c", className: "Lớp 7A", enabled: true, period: "COURSE", scope: "CLASS", periodEndsAt: "2026-11-16T00:00:00Z", viewerHidden: false, me: { rank: 7, size: 32, xp: 1240, gradeRank: 92, gradeSize: 128, xpToNextRank: null, nextRankName: null }, entries });
});

describe("ClassFullBoardPage (H14)", () => {
  it("groups the course board by tier and shows the viewer bar", async () => {
    renderWithQuery(<ClassFullBoardPage accountId="d1" classId="c" gradeLabel="Khối 7" />);
    expect(await screen.findByText("Bạn đang Đồng 2 · #92 / 128 khối 7 · hạng 7 lớp · 1.240 XP")).toBeTruthy();
    expect(screen.getByText("Mốc tuần này: Đồng 1 1.325 XP (+85) · Bạc 5 1.480 XP (+240)")).toBeTruthy();
    expect(await screen.findByText("Khánh Thy")).toBeTruthy();
    expect(screen.getAllByText("Chưa ai đạt — bạn sẽ là người đầu tiên?").length).toBeGreaterThan(0);
    const mine = document.querySelector("[aria-current]") as HTMLElement;
    expect(within(mine).getByText("Bạn")).toBeTruthy();
    expect(within(mine).getByLabelText("Lên 2 hạng")).toBeTruthy();
  });

  it("hides the name of a student who turned it off, and filters by search", async () => {
    renderWithQuery(<ClassFullBoardPage accountId="d2" classId="c" />);
    expect((await screen.findAllByText("Bạn ẩn tên")).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Tìm bạn"), { target: { value: "thy" } });
    expect(screen.getByText("Khánh Thy")).toBeTruthy();
    expect(screen.queryByText("Nguyễn Minh Anh")).toBeNull();
    expect(screen.getByText("Hiện 1 / 1 bạn")).toBeTruthy();
  });

  it("shows an error state", async () => {
    api.load.mockRejectedValue(new Error("boom"));
    renderWithQuery(<ClassFullBoardPage accountId="d3" classId="c" />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
