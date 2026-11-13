import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgTierChip, ErgTierFrame } from "@/components/erg-mui/erg-tier";
import { formatViNumber, tierLabel } from "@/domain/student-tier/tiers";
import { asTier } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

const t = ergEnterpriseTokens;

export function medalColor(rank: number | null | undefined) {
  return rank === 1 ? t.medal.gold : rank === 2 ? t.medal.silver : rank === 3 ? t.medal.bronze : undefined;
}

export function StreakDays({ days }: { days: number }) {
  if (!days) return <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
  return (
    <Stack component="span" direction="row" spacing={0.25} sx={{ alignItems: "center", color: t.color.warning, display: "inline-flex" }}>
      <LocalFireDepartmentRoundedIcon fontSize="small" />
      <Typography component="span" variant="body2" sx={{ color: "text.primary" }}>{`${days} ngày`}</Typography>
    </Stack>
  );
}

/** Up/down versus the previous period; "—" when there is nothing to compare. */
export function RankChange({ change }: { change: number | null | undefined }) {
  if (!change) return <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
  const up = change > 0;
  return (
    <Stack
      aria-label={up ? `Lên ${change} hạng` : `Xuống ${-change} hạng`}
      component="span"
      direction="row"
      sx={{ alignItems: "center", color: up ? "success.main" : "error.main", display: "inline-flex" }}
    >
      {up ? <ArrowUpwardRoundedIcon fontSize="small" /> : <ArrowDownwardRoundedIcon fontSize="small" />}
      <Typography component="span" variant="body2" sx={{ color: "inherit" }}>{Math.abs(change)}</Typography>
    </Stack>
  );
}

const COLUMNS = { xs: "32px 36px 40px minmax(0,1fr) 56px", md: "36px 44px 40px minmax(0,1.2fr) minmax(0,1.6fr) 64px" } as const;
const cell = { display: { xs: "none", md: "block" } } as const;

/** Dashed line above the first row outside the podium: how much XP it takes to get on it. */
function TopThreeLine({ xp }: { xp: number }) {
  return (
    <Box aria-hidden sx={{ alignItems: "center", color: "text.secondary", display: "flex", gap: 1.5, px: 2, py: 1, typography: "caption" }}>
      <span>{`Cần ${formatViNumber(xp)} XP để vào top 3`}</span>
      <Box sx={{ borderTop: `1px dashed ${t.color.borderStrong}`, flex: 1 }} />
    </Box>
  );
}

function BoardRow({ entry, top }: { entry: ClassLeaderboardEntry; top: number }) {
  const name = entry.studentName || "Học sinh";
  const medal = medalColor(entry.rank);
  const tier = asTier(entry.tierKey);
  return (
    <Box
      aria-current={entry.isViewer ? "true" : undefined}
      role="listitem"
      sx={{ alignItems: "center", bgcolor: entry.isViewer ? t.color.primarySofter : "transparent", borderLeft: `4px solid ${entry.isViewer ? t.color.primary : "transparent"}`, borderTop: 1, borderColor: t.color.divider, display: "grid", gap: 1.25, gridTemplateColumns: COLUMNS, minHeight: 56, px: 1.5, py: 0.75 }}
    >
      <Box sx={{ bgcolor: entry.isViewer ? "primary.main" : medal ?? t.color.surfaceSubtle, borderRadius: "50%", color: entry.isViewer || medal ? "primary.contrastText" : "text.secondary", display: "grid", height: 32, placeItems: "center", typography: "caption", width: 32 }}>{entry.rank ?? "—"}</Box>
      <RankChange change={entry.rankChange} />
      <ErgTierFrame tier={asTier(entry.frameKey)} size={32}>
        <Avatar sx={{ bgcolor: entry.isViewer ? "primary.main" : t.color.surfaceSubtle, color: entry.isViewer ? "primary.contrastText" : "text.secondary", height: 32, typography: "caption", width: 32 }}>{getInitials(name)}</Avatar>
      </ErgTierFrame>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <Typography noWrap variant="subtitle2" sx={{ color: entry.isViewer ? "primary.main" : "text.primary" }}>{name}</Typography>
          {entry.isViewer ? <Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", px: 0.75, typography: "caption" }}>Bạn</Box> : null}
          {tier ? <ErgTierChip tier={tier}>{tierLabel(tier, entry.division)}</ErgTierChip> : null}
        </Stack>
        <StreakDays days={entry.streakDays} />
      </Box>
      <Box aria-hidden sx={{ ...cell, bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, height: 8, overflow: "hidden" }}>
        <Box sx={{ bgcolor: entry.isViewer ? "primary.main" : t.color.primarySoft, height: "100%", width: `${top > 0 ? Math.max(2, Math.round((entry.xp / top) * 100)) : 0}%` }} />
      </Box>
      <Typography variant="subtitle2" sx={{ textAlign: "right" }}>{formatViNumber(entry.xp)}</Typography>
    </Box>
  );
}

/**
 * XP board (design H08): rank, change, avatar in tier frame, name with tier chip and streak, XP bar relative to rank 1, XP.
 * `total` is the full class size when `entries` is only a slice; it feeds the "Hiện N / M bạn" footer.
 */
export function ClassLeaderboardTable({ entries, total }: { entries: readonly ClassLeaderboardEntry[]; total?: number }) {
  const top = entries.reduce((max, entry) => Math.max(max, entry.xp), 0);
  const viewerRank = entries.find((entry) => entry.isViewer)?.rank;
  const thirdXp = entries.find((entry) => entry.rank === 3)?.xp;
  const lineAt = viewerRank != null && viewerRank > 3 && thirdXp != null ? entries.findIndex((entry) => entry.rank != null && entry.rank > 3) : -1;
  return (
    <Box aria-label="Bảng thi đua" role="list" sx={{ bgcolor: "background.paper", border: 1, borderColor: t.color.divider, borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      {entries.map((entry, index) => (
        <div key={entry.studentId || index}>
          {index === lineAt && thirdXp != null ? <TopThreeLine xp={thirdXp} /> : null}
          <BoardRow entry={entry} top={top} />
        </div>
      ))}
      <Box sx={{ borderTop: 1, borderColor: t.color.divider, color: "text.secondary", px: 2, py: 1.25, typography: "caption" }}>{`Hiện ${entries.length} / ${Math.max(total ?? 0, entries.length)} bạn`}</Box>
    </Box>
  );
}
