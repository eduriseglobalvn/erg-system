import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { ErgTierFrame } from "@/components/erg-mui/erg-tier";
import { formatViNumber } from "@/domain/student-tier/tiers";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { StreakDays, medalColor } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { asTier } from "@/features/elearning/student-tier/tier-format";

const t = ergEnterpriseTokens;
const NEAR_XP = 50;
const BADGE = { 1: "Huy hiệu Vàng", 2: "Huy hiệu Bạc", 3: "Huy hiệu Đồng" } as const;
// Second, first, third from left to right; front-face heights follow the design (web 104/140/84, phone 64/90/48).
const PLACES = [
  { index: 1, front: { xs: 64, md: 104 }, avatar: { xs: 54, md: 72 } },
  { index: 0, front: { xs: 90, md: 140 }, avatar: { xs: 70, md: 96 } },
  { index: 2, front: { xs: 48, md: 84 }, avatar: { xs: 54, md: 72 } },
] as const;

function Note({ entry, next }: { entry: ClassLeaderboardEntry; next?: ClassLeaderboardEntry }) {
  if (entry.rank === 1) return entry.streakDays ? <StreakDays days={entry.streakDays} /> : null;
  if (entry.rank === 2 && (entry.xpToday ?? 0) > 0) {
    return (
      <Box component="span" sx={{ alignItems: "center", bgcolor: t.statusTint.success.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.success.color, display: "inline-flex", px: 1, typography: "caption" }}>
        <ArrowUpwardRoundedIcon sx={{ fontSize: t.size.iconSm }} />{`+${formatViNumber(entry.xpToday ?? 0)} hôm nay`}
      </Box>
    );
  }
  if (entry.rank === 3 && next && entry.xp - next.xp < NEAR_XP) {
    return <Box component="span" sx={{ bgcolor: t.statusTint.warning.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.warning.color, px: 1, typography: "caption" }}>Sắp bị vượt</Box>;
  }
  return null;
}

/** Gold, silver and bronze for the top three ranked students on a 3D podium (design H08 / H03b). */
export function LeaderboardPodium({ entries }: { entries: readonly ClassLeaderboardEntry[] }) {
  const top = entries.filter((entry) => entry.rank != null && entry.rank <= 3).slice(0, 3);
  if (!top.length) return null;
  const fourth = entries.find((entry) => entry.rank === 4);
  return (
    <Box data-design="H08.podium" sx={{ alignItems: "end", display: "grid", gap: { xs: 1, md: 2 }, gridTemplateColumns: "1fr 1.15fr 1fr", maxWidth: 660, mx: "auto", width: "100%" }}>
      {PLACES.map(({ index, front, avatar }) => {
        const entry = top[index];
        if (!entry) return <Box key={index} />;
        const color = medalColor(entry.rank) ?? t.color.border;
        const name = entry.studentName || "Học sinh";
        const first = entry.rank === 1;
        const initials = (
          <Avatar sx={{ bgcolor: alpha(color, 0.16), boxShadow: `0 0 0 3px ${color}`, color: "text.primary", height: avatar, typography: first ? "h3" : "h5", width: avatar }}>{getInitials(name)}</Avatar>
        );
        return (
          <Box key={entry.studentId} sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
            {first ? <WorkspacePremiumRoundedIcon sx={{ color: t.medal.gold, height: 40, width: 40 }} /> : (
              <Box aria-hidden sx={{ background: `linear-gradient(${alpha(color, 0.7)}, ${color})`, borderRadius: "50%", boxShadow: `0 4px 0 ${alpha(color, 0.5)}`, color: t.color.surface, display: "grid", height: 28, placeItems: "center", typography: "caption", width: 28 }}>{entry.rank}</Box>
            )}
            <Box sx={{ mb: 0.5 }}>{entry.frameKey ? <ErgTierFrame tier={asTier(entry.frameKey)} size={avatar.md}>{initials}</ErgTierFrame> : initials}</Box>
            <Typography noWrap variant="subtitle2" sx={{ color: entry.isViewer ? "primary.main" : "text.primary", maxWidth: "100%" }}>{name}</Typography>
            <Typography component="p" variant={first ? "h3" : "h5"}>{formatViNumber(entry.xp)}<Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>XP</Typography></Typography>
            <Note entry={entry} next={fourth} />
            <Box sx={{ mt: 1, position: "relative", width: "100%" }}>
              <Box aria-hidden sx={{ background: alpha(color, 0.12), height: 30, transform: "perspective(380px) rotateX(52deg)", transformOrigin: "bottom", width: "100%" }} />
              <Box
                sx={{
                  alignItems: "center",
                  background: `linear-gradient(${alpha(color, 0.12)}, ${alpha(color, 0.3)})`,
                  color,
                  display: "flex",
                  flexDirection: "column",
                  height: front,
                  justifyContent: "center",
                  typography: "h2",
                }}
              >
                {entry.rank}
                <Typography variant="caption" sx={{ bgcolor: alpha(t.color.surface, 0.7), borderRadius: `${t.radius.chip}px`, color: "text.primary", display: { xs: "none", md: "block" }, px: 1 }}>{BADGE[entry.rank as 1 | 2 | 3]}</Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
