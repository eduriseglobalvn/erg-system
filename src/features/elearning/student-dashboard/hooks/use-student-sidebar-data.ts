import { useQuery } from "@tanstack/react-query";

import { TIER_KEYS, type TierKey } from "@/domain/student-tier/tiers";
import { classLeaderboardKeys, loadStudentClassLeaderboard } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { loadMyTier, studentTierKeys } from "@/features/elearning/student-tier/api/student-tier-api";

export type StudentSidebarData = {
  tier: TierKey | null;
  division: number | null;
  /** Course XP ("1.240 XP"); null hides the chip. */
  xp: number | null;
  streakDays: number | null;
  /** Weekly class rank for the "Thi đua" badge. */
  rank: number | null;
  className: string;
  /** Next streak length to show in the reminder; null while today's streak is already kept. */
  streakNudge: number | null;
};

/** Reminder is for a live streak (>= 1) with no XP earned yet today. */
export function streakNudge(streakDays: number | null, xpToday: number | null): number | null {
  return streakDays !== null && streakDays >= 1 && xpToday === 0 ? streakDays + 1 : null;
}

const isTierKey = (key: string | null): key is TierKey => TIER_KEYS.some((k) => k === key);

/** Tier, XP, streak and weekly rank for the student sidebar and dock. Every part degrades to null when its query is off or fails. */
export function useStudentSidebarData({ accountId, classId, leaderboardEnabled }: { accountId: string | undefined; classId: string; leaderboardEnabled: boolean }): StudentSidebarData {
  const tier = useQuery({ enabled: Boolean(accountId), queryFn: ({ signal }) => loadMyTier(signal), queryKey: studentTierKeys.mine(accountId ?? ""), retry: false });
  const board = useQuery({
    enabled: leaderboardEnabled,
    queryFn: ({ signal }) => loadStudentClassLeaderboard(classId, "WEEK", "CLASS", signal),
    queryKey: classLeaderboardKeys.student(accountId ?? "", classId, "WEEK", "CLASS"),
    retry: false,
  });
  const viewer = board.data?.enabled ? board.data.entries.find((entry) => entry.isViewer) : undefined;
  const key = tier.data?.tierKey ?? null;
  const streakDays = viewer ? viewer.streakDays : null;
  return {
    className: board.data?.enabled ? (board.data.className ?? "") : "",
    division: tier.data?.division ?? null,
    rank: board.data?.enabled ? (board.data.me?.rank ?? null) : null,
    streakDays,
    streakNudge: streakNudge(streakDays, viewer ? viewer.xpToday : null),
    tier: isTierKey(key) ? key : null,
    xp: tier.data ? tier.data.courseXp : null,
  };
}
