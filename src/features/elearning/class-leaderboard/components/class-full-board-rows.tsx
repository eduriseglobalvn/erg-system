import type { RefObject } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgTierChip, ErgTierEmblem } from "@/components/erg-mui/erg-tier";
import { TIER_BANDS, TIER_KEYS, TIER_NAMES, formatViNumber, tierLabel } from "@/domain/student-tier/tiers";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { RankChange, StreakDays, medalColor } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { TierAvatar } from "@/features/elearning/student-tier/components/tier-parts";
import { asTier } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const HIDDEN_NAME = "Bạn ẩn tên";
export const COLUMNS = { xs: "32px minmax(0,1fr) 64px", md: "56px 48px minmax(0,1.4fr) 140px 120px minmax(0,1.2fr) 90px" } as const;

type RowProps = { entry: ClassLeaderboardEntry; course: boolean; phone?: boolean; top: number; viewerRef: RefObject<HTMLDivElement | null> };

export function Row({ entry, course, phone = false, top, viewerRef }: RowProps) {
  const hidden = entry.hidden === true && !entry.isViewer;
  const tier = asTier(entry.tierKey);
  const name = hidden ? HIDDEN_NAME : entry.studentName || "Học sinh";
  const medal = course ? undefined : medalColor(entry.rank);
  const chip = tier ? <ErgTierChip tier={tier}>{tierLabel(tier, entry.division)}</ErgTierChip> : null;
  return (
    <Box
      aria-current={entry.isViewer ? "true" : undefined}
      data-design={entry.isViewer ? "H14.myRow" : undefined}
      ref={entry.isViewer ? viewerRef : undefined}
      sx={{ alignItems: "center", bgcolor: entry.isViewer ? t.color.primarySofter : "transparent", borderLeft: entry.isViewer ? `4px solid ${t.color.primary}` : "4px solid transparent", borderTop: 1, borderColor: t.color.divider, display: "grid", gap: { xs: 1.25, md: 1.5 }, gridTemplateColumns: COLUMNS, minHeight: { xs: 62, md: 56 }, pl: { xs: 1.25, md: 2 }, pr: 2, py: 0.75 }}
    >
      <Box sx={{ alignItems: "center", bgcolor: entry.isViewer ? "primary.main" : medal ?? t.color.surfaceSubtle, borderRadius: "50%", color: entry.isViewer || medal ? "primary.contrastText" : "text.secondary", display: "grid", height: 32, placeItems: "center", typography: "caption", width: 32 }}>{entry.rank ?? "—"}</Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}><RankChange change={entry.rankChange} /></Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minWidth: 0 }}>
        {hidden ? (
          <Box aria-hidden sx={{ alignItems: "center", border: `1px dashed ${t.color.borderStrong}`, borderRadius: "50%", color: "text.secondary", display: "grid", flexShrink: 0, height: 32, placeItems: "center", width: 32 }}>?</Box>
        ) : <TierAvatar name={name} tier={asTier(entry.frameKey)} size={phone ? 36 : 30} muted={!entry.isViewer} />}
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap variant="subtitle2" sx={{ color: entry.isViewer ? "primary.main" : "text.primary", fontStyle: hidden ? "italic" : "normal" }}>
            {name}
            {entry.isViewer ? <Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", ml: 1, px: 0.75, typography: "caption" }}>Bạn</Box> : null}
          </Typography>
          {course ? <Box sx={{ display: { md: "none" } }}>{chip}</Box> : null}
        </Box>
      </Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}>{course ? chip : <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${entry.submittedInPeriod ?? 0} bài`}</Typography>}</Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}><StreakDays days={entry.streakDays} /></Box>
      <Box aria-hidden sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, display: { xs: "none", md: "block" }, height: 8, overflow: "hidden" }}>
        <Box sx={{ bgcolor: entry.isViewer ? "primary.main" : t.color.primarySoft, height: "100%", width: `${top > 0 ? Math.max(2, Math.round((entry.xp / top) * 100)) : 0}%` }} />
      </Box>
      <Typography variant="subtitle2" sx={{ textAlign: "right" }}>{formatViNumber(entry.xp)}</Typography>
    </Box>
  );
}

export function GroupHeader({ tierKey, count }: { tierKey: (typeof TIER_KEYS)[number]; count: number }) {
  return (
    <Box sx={{ alignItems: "center", bgcolor: t.color.surfaceMuted, borderTop: 1, borderColor: t.color.divider, display: "flex", gap: 1.5, px: 2, py: 0.75 }}>
      <ErgTierEmblem tier={tierKey} size={26} />
      <Typography variant="subtitle2">{TIER_NAMES[tierKey]}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: { xs: "none", md: "block" }, flex: 1, textAlign: "center" }}>{`${TIER_BANDS[tierKey]} khối`}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", ml: { xs: "auto", md: 0 } }}>{count ? `${count} bạn` : "Chưa ai đạt — bạn sẽ là người đầu tiên?"}</Typography>
    </Box>
  );
}

