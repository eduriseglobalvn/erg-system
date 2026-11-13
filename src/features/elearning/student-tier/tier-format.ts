import { TIER_KEYS, type TierKey } from "@/domain/student-tier/tiers";

/** Server tier key -> TierKey; null for anything unknown. */
export function asTier(key: string | null | undefined): TierKey | null {
  return (TIER_KEYS as readonly string[]).includes(key ?? "") ? (key as TierKey) : null;
}

/** Rank 92 of 128 -> 72 ("top 72%"). */
export function topPercent(rank: number, size: number): number {
  return size > 0 ? Math.round((rank / size) * 100) : 0;
}

/** Hand-ins needed before a student is ranked (spec 5.6). */
export const MIN_SUBMISSIONS = 3;

/** "Nộp thêm 2 bài để được xếp bậc". */
export function submitMoreLabel(submittedCount: number): string {
  return `Nộp thêm ${Math.max(1, MIN_SUBMISSIONS - submittedCount)} bài để được xếp bậc`;
}

/** Monday of last week as yyyy-MM-dd (local zone), for the "Tuần trước" tier table. */
export function previousWeekStart(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) - 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** How far `xp` is from `from` to `to` (the two cutoffs), 0..1; 0 when the cutoffs are unknown or do not rise. */
export function cutoffProgress(xp: number, from: number | null | undefined, to: number): number {
  if (from == null || to <= from) return 0;
  return Math.min(1, Math.max(0, (xp - from) / (to - from)));
}

/** ISO instant a week ends (next Monday 00:00 local): the current week, or last week when `last`. Feeds `leaderboardWeekLabel`. */
export function weekEndsAt(last: boolean, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + (last ? 0 : 7));
  return date.toISOString();
}

/** School year of the frames earned now: the explicit one, else the year of the frame for the student's current tier. */
export function currentFrameYear(frames: ReadonlyArray<{ tierKey: string; schoolYear: string | null }>, tierKey: string | null | undefined, explicit?: string): string | undefined {
  return explicit ?? frames.find((f) => f.tierKey === tierKey)?.schoolYear ?? undefined;
}
