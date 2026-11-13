import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { streakNudge, useStudentSidebarData } from "@/features/elearning/student-dashboard/hooks/use-student-sidebar-data";

const api = vi.hoisted(() => ({ board: vi.fn(), tier: vi.fn() }));
vi.mock("@/features/elearning/class-leaderboard/api/class-leaderboard-api", async (original) => ({ ...(await original<object>()), loadStudentClassLeaderboard: api.board }));
vi.mock("@/features/elearning/student-tier/api/student-tier-api", async (original) => ({ ...(await original<object>()), loadMyTier: api.tier }));

it("nudges only a live streak with no XP yet today", () => {
  expect(streakNudge(12, 0)).toBe(13);
  expect(streakNudge(12, 30)).toBeNull();
  expect(streakNudge(0, 0)).toBeNull();
  expect(streakNudge(null, null)).toBeNull();
});

it("fetches class, streak and rank itself as soon as the profile enables the leaderboard", async () => {
  api.tier.mockResolvedValue({ tierKey: "dong", division: 2, courseXp: 1240 });
  api.board.mockResolvedValue({ enabled: true, className: "7A", me: { rank: 4 }, entries: [{ isViewer: true, streakDays: 12, xpToday: 0 }] });
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  const { result } = renderHook(() => useStudentSidebarData({ accountId: "a1", classId: "class-7a", leaderboardEnabled: true }), { wrapper });
  await waitFor(() => expect(result.current.className).toBe("7A"));
  expect(result.current).toMatchObject({ rank: 4, streakDays: 12, streakNudge: 13, tier: "dong", xp: 1240 });
  expect(api.board).toHaveBeenCalledWith("class-7a", "WEEK", "CLASS", expect.anything());
});
