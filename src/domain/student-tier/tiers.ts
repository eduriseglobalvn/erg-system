// Student tiers (design H15-H18). Seat counts shown in the UI come from the server; only labels live here.
export const TIER_KEYS = ["go", "sat", "dong", "bac", "vang", "bk", "kc", "ct"] as const;
export type TierKey = (typeof TIER_KEYS)[number];

export const TIER_NAMES: Record<TierKey, string> = {
  go: "Gỗ",
  sat: "Sắt",
  dong: "Đồng",
  bac: "Bạc",
  vang: "Vàng",
  bk: "Bạch kim",
  kc: "Kim cương",
  ct: "Cao thủ",
};

// Share of the grade, from the top (spec 5.3).
export const TIER_BANDS: Record<TierKey, string> = {
  go: "6% cuối",
  sat: "Top 82–94%",
  dong: "Top 65–82%",
  bac: "Top 45–65%",
  vang: "Top 25–45%",
  bk: "Top 12–25%",
  kc: "Top 3–12%",
  ct: "Top 3%",
};

/** "Đồng 2"; Cao thủ has no divisions. */
export function tierLabel(key: TierKey, division?: number | null): string {
  return key === "ct" || division == null ? TIER_NAMES[key] : `${TIER_NAMES[key]} ${division}`;
}

const vi = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
/** 1240 -> "1.240", 7.25 -> "7,25", 6.8 -> "6,8". */
export function formatViNumber(n: number): string {
  return vi.format(n);
}
/** Score on the 10 scale from the raw score: 72.5/100 -> "7,25". */
export function scoreOutOf10(score: number, maxScore: number): string {
  return formatViNumber(Math.round((score / maxScore) * 1000) / 100);
}
