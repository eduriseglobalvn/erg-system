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
