import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { formatViNumber } from "@/domain/student-tier/tiers";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

/** XP the viewer still needs to pass the student one place above; null for rank 1 or when nobody is above. */
export function xpToNextRank(entries: readonly ClassLeaderboardEntry[]): number | null {
  const me = entries.find((entry) => entry.isViewer && entry.rank != null);
  if (!me || me.rank == null || me.rank <= 1) return null;
  const above = entries.find((entry) => entry.rank === me.rank! - 1);
  return above ? Math.max(1, above.xp - me.xp) : null;
}

/** "Thứ hạng của bạn lúc này" (design H08): rank, board size, change since yesterday and XP to the next place. */
export function ViewerRankStrip({ entries, label }: { entries: readonly ClassLeaderboardEntry[]; label: string }) {
  const me = entries.find((entry) => entry.isViewer && entry.rank != null);
  if (!me || me.rank == null) return null;
  const size = entries.filter((entry) => entry.rank != null).length;
  const gap = xpToNextRank(entries);
  return (
    <Box
      aria-label="Thứ hạng của bạn lúc này"
      role="region"
      sx={{
        alignItems: "center",
        background: `linear-gradient(90deg, ${t.color.primarySofter}, ${t.color.surface} 70%)`,
        border: 1,
        borderColor: t.color.primarySoft,
        borderRadius: `${t.radius.card}px`,
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        px: 2.5,
        py: 1.75,
      }}
    >
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
        <Typography component="span" variant="h4" sx={{ color: "primary.main", fontVariantNumeric: "tabular-nums" }}>{`#${me.rank}`}</Typography>
        <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>{`/ ${size} bạn ${label}`}</Typography>
      </Box>
      {me.rankChange ? (
        <Box
          component="span"
          sx={{ alignItems: "center", bgcolor: t.statusTint.info.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.info.color, display: "inline-flex", height: 24, px: 1, typography: "caption" }}
        >
          {me.rankChange > 0 ? <ArrowUpwardRoundedIcon sx={{ fontSize: t.size.iconSm }} /> : null}
          {me.rankChange > 0 ? `Lên ${me.rankChange} hạng` : `Xuống ${-me.rankChange} hạng`}
        </Box>
      ) : null}
      <Box sx={{ alignItems: "center", display: "flex", gap: 2.5, ml: "auto" }}>
        <Typography component="span" variant="body2" sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
          <BoltRoundedIcon sx={{ color: "primary.main", fontSize: t.size.iconSm }} />
          {`${formatViNumber(me.xp)} XP`}
        </Typography>
        {gap != null ? <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>{`Còn ${formatViNumber(gap)} XP lên hạng ${me.rank - 1}`}</Typography> : null}
      </Box>
    </Box>
  );
}
