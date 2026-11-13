import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TIER_KEYS } from "@/domain/student-tier/tiers";
import type { MyFrames, MyTier, TierTableRow } from "@/features/elearning/student-tier/api/student-tier-api";

/** The design's sample student: Minh Anh, Đồng 2, 1.240 XP, #92 / 128 (canvas H15). */
export const MINH_ANH: MyTier = {
  tierKey: "dong",
  division: 2,
  gradeRank: 92,
  gradeSize: 128,
  courseXp: 1240,
  eligible: true,
  submittedCount: 9,
  protected: false,
  nextDivision: { tierKey: "dong", division: 1, minXp: 1325, studentsToPass: 3 },
  nextTier: { tierKey: "bac", division: 5, minXp: 1480, studentsToPass: 8 },
  pendingPromotion: null,
};

export const PROMOTION = { weekStart: "2026-11-16", fromKey: "dong", fromDivision: 1, toKey: "bac", toDivision: 5, studentsPassed: 11, gradePercentile: 63 } as const;

const SEATS = [7, 15, 22, 26, 25, 17, 12, 4];
const DONG_MIN = [905, 990, 1085, 1185, 1325];

export const TIER_TABLE: TierTableRow[] = TIER_KEYS.map((tierKey, i) => ({
  tierKey,
  share: "",
  seats: SEATS[i],
  divisions: tierKey === "ct"
    ? [{ division: null, rankFrom: 1, rankTo: 4, minXp: 8795 }]
    : [5, 4, 3, 2, 1].map((division, d) => ({
      division,
      rankFrom: tierKey === "dong" ? [103, 99, 95, 90, 85][d] : 1,
      rankTo: tierKey === "dong" ? [106, 102, 98, 94, 89][d] : 1,
      minXp: tierKey === "dong" ? DONG_MIN[d] : 100 * (i + 1) + d,
    })),
}));

/** Gỗ, Sắt and Đồng unlocked; Bạch kim earned in an earlier course; the rest locked. */
export const MY_FRAMES: MyFrames = {
  selected: "dong",
  frames: TIER_KEYS.map((tierKey) => ({
    tierKey,
    unlocked: ["go", "sat", "dong", "bk"].includes(tierKey),
    unlockedAt: null,
    schoolYear: tierKey === "bk" ? "hè 2026" : null,
    studentsToPass: tierKey === "bac" ? 8 : null,
  })),
};

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
