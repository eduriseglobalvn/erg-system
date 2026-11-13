import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";

import { formatViNumber } from "@/domain/student-tier/tiers";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { medalColor } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

const t = ergEnterpriseTokens;
const NEAR_XP = 50;
const STREAK_BONUS_DAYS = 7;
const BADGE = { 1: "Huy hiệu Vàng", 2: "Huy hiệu Bạc", 3: "Huy hiệu Đồng" } as const;
// Second, first, third from left to right; sizes follow the design (web / phone): front face, avatar, rank coin.
const PLACES = [
  { index: 1, front: { xs: 64, md: 104 }, avatar: { xs: 54, md: 72 } },
  { index: 0, front: { xs: 90, md: 140 }, avatar: { xs: 70, md: 96 } },
  { index: 2, front: { xs: 48, md: 84 }, avatar: { xs: 54, md: 72 } },
] as const;

const pill = { alignItems: "center", borderRadius: `${t.radius.chip}px`, display: "inline-flex", height: 22, px: 1, typography: "caption" } as const;

function Note({ entry, next }: { entry: ClassLeaderboardEntry; next?: ClassLeaderboardEntry }) {
  if (entry.rank === 1) {
    if (!entry.streakDays) return null;
    return (
      <Box component="span" sx={{ alignItems: "center", color: "text.secondary", display: "inline-flex", gap: 0.25, typography: "caption" }}>
        <LocalFireDepartmentRoundedIcon sx={{ color: t.podium.fire, fontSize: t.size.iconSm }} />{`${entry.streakDays} ngày${entry.streakDays >= STREAK_BONUS_DAYS ? " · ×1,2" : ""}`}
      </Box>
    );
  }
  if (entry.rank === 2 && (entry.xpToday ?? 0) > 0) {
    return <Box component="span" sx={{ ...pill, bgcolor: t.statusTint.success.bg, color: t.statusTint.success.color, gap: 0.25 }}><ArrowUpwardRoundedIcon sx={{ fontSize: t.size.iconSm }} />{`+${formatViNumber(entry.xpToday ?? 0)} hôm nay`}</Box>;
  }
  if (entry.rank === 3 && next && entry.xp - next.xp < NEAR_XP) {
    return <Box component="span" sx={{ ...pill, bgcolor: t.statusTint.warning.bg, color: t.statusTint.warning.color }}>Sắp bị vượt</Box>;
  }
  return null;
}

/** Gold, silver and bronze for the top three ranked students on a 3D podium (design H08 / H03b); the phone drops XP suffix, chips and badge names. */
export function LeaderboardPodium({ entries }: { entries: readonly ClassLeaderboardEntry[] }) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const top = entries.filter((entry) => entry.rank != null && entry.rank <= 3).slice(0, 3);
  if (!top.length) return null;
  const fourth = entries.find((entry) => entry.rank === 4);
  return (
    <Box data-design="H08.podium" sx={{ alignItems: "end", display: "grid", gap: { xs: 0.75, md: 1.25 }, gridTemplateColumns: "1fr 1.15fr 1fr", maxWidth: 660, mx: "auto", pt: 1, width: "100%" }}>
      {PLACES.map(({ index, front, avatar }) => {
        const entry = top[index];
        if (!entry) return <Box key={index} />;
        const color = medalColor(entry.rank) ?? t.color.border;
        const name = entry.studentName || "Học sinh";
        const first = entry.rank === 1;
        const look = t.podium.ranks[(entry.rank ?? 1) - 1];
        const coin = phone ? 28 : 40;
        return (
          <Box key={entry.studentId} sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, textAlign: "center" }}>
            {first ? <WorkspacePremiumRoundedIcon sx={{ color: t.medal.gold, filter: `drop-shadow(0 3px 0 ${alpha(color, 0.6)})`, height: { xs: 30, md: 40 }, mb: "-4px", position: "relative", width: { xs: 30, md: 40 }, zIndex: 1 }} /> : (
              <Box aria-hidden sx={{ background: `radial-gradient(circle at 32% 28%, ${t.color.surface} 0, ${alpha(color, 0.5)} 38%, ${color} 100%)`, borderRadius: "50%", boxShadow: `0 ${phone ? 3 : 4}px 0 ${alpha(color, 0.75)}`, color: t.color.surface, display: "grid", height: coin, mb: phone ? 0.75 : 1.25, placeItems: "center", typography: phone ? "caption" : "h5", width: coin }}>{entry.rank}</Box>
            )}
            <Avatar sx={{ bgcolor: alpha(color, 0.16), border: `${phone ? 2 : first ? 4 : 3}px solid ${t.color.surface}`, boxShadow: `0 0 0 ${phone ? 2 : first ? 4 : 3}px ${color}${first ? `, 0 0 0 ${phone ? 8 : 12}px ${alpha(t.podium.confetti.gold, 0.22)}` : ""}`, boxSizing: "border-box", color: look.ink, height: avatar, typography: first ? "h3" : "h5", width: avatar }}>{getInitials(name)}</Avatar>
            <Typography noWrap variant={phone ? "subtitle2" : first ? "h5" : "h6"} sx={{ color: entry.isViewer ? "primary.main" : "text.primary", maxWidth: "100%", mt: phone ? 0.75 : 1.25 }}>{name}</Typography>
            <Typography component="p" variant={phone ? "h5" : first ? "h1" : "h2"} sx={{ fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{formatViNumber(entry.xp)}{phone ? null : <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.25 }}>XP</Typography>}</Typography>
            {phone ? null : <Note entry={entry} next={fourth} />}
            <Box sx={{ mt: phone ? 1 : 1.5, width: "100%" }}>
              <Box aria-hidden sx={{ background: look.lid, borderRadius: "6px 6px 0 0", height: phone ? 20 : 30, mb: "-1px", mx: phone ? 0.5 : 0.75, transform: `perspective(${phone ? 260 : 380}px) rotateX(52deg)`, transformOrigin: "bottom" }} />
              <Box sx={{ alignItems: "center", background: look.face, borderRadius: "0 0 4px 4px", boxShadow: `inset 0 -10px 18px ${alpha(t.color.text, 0.06)}`, color: look.ink, display: "flex", flexDirection: "column", gap: 1, height: front, pt: phone ? 1 : 1.75, ...(phone ? { typography: "h1" } : t.type.display) }}>
                {entry.rank}
                {phone ? null : <Box component="span" sx={{ alignItems: "center", bgcolor: alpha(t.color.surface, 0.8), borderRadius: `${t.radius.chip}px`, display: "inline-flex", gap: 0.5, height: 24, px: 1.25, typography: "caption" }}><MilitaryTechRoundedIcon sx={{ fontSize: t.size.iconSm }} />{BADGE[entry.rank as 1 | 2 | 3]}</Box>}
              </Box>
              <Box aria-hidden sx={{ background: `radial-gradient(ellipse, ${alpha(t.color.text, 0.14)}, ${alpha(t.color.text, 0)} 70%)`, borderRadius: "50%", height: phone ? 10 : 16, mt: "-2px", mx: "auto", width: "96%" }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
