import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTierChip, ErgTierFrame } from "@/components/erg-mui/erg-tier";
import { formatViNumber, tierLabel } from "@/domain/student-tier/tiers";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { asTier } from "@/features/elearning/student-tier/tier-format";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

/** XP the viewer still needs to pass the student one place above; null for rank 1 or when nobody is above. */
export function xpToNextRank(entries: readonly ClassLeaderboardEntry[]): number | null {
  const me = entries.find((entry) => entry.isViewer && entry.rank != null);
  if (!me || me.rank == null || me.rank <= 1) return null;
  const above = entries.find((entry) => entry.rank === me.rank! - 1);
  return above ? Math.max(1, above.xp - me.xp) : null;
}

type Grade = { label: string; rank: number | null; size: number };

function MeAvatar({ me, size }: { me: ClassLeaderboardEntry; size: number }) {
  const avatar = <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", height: size, typography: size > 44 ? "h5" : "caption", width: size }}>{getInitials(me.studentName || "Học sinh")}</Avatar>;
  const tier = asTier(me.frameKey) ?? asTier(me.tierKey);
  return tier ? <ErgTierFrame tier={tier} size={size}>{avatar}</ErgTierFrame> : avatar;
}

function Delta({ change, long }: { change: number; long: boolean }) {
  const up = change > 0;
  const tint = up ? t.statusTint.success : t.statusTint.error;
  const Icon = up ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
  const text = long ? `${up ? "Lên" : "Xuống"} ${Math.abs(change)} hạng so với hôm qua` : String(Math.abs(change));
  return (
    <Box component="span" aria-label={`${up ? "Lên" : "Xuống"} ${Math.abs(change)} hạng`} sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: `${t.radius.chip}px`, color: tint.color, display: "inline-flex", flexShrink: 0, gap: 0.25, height: 24, px: 1.25, typography: "caption", whiteSpace: "nowrap" }}>
      <Icon sx={{ fontSize: t.size.iconSm }} />{text}
    </Box>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 0.25 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography component="span" variant="h4" sx={{ alignItems: "center", display: "inline-flex", fontVariantNumeric: "tabular-nums", gap: 0.5 }}>{children}</Typography>
    </Box>
  );
}

const goToMe = () => document.querySelector('[role="listitem"][aria-current="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });

/** "Thứ hạng của bạn lúc này" (design H08 / H03b): avatar, rank, board size, change since yesterday, XP, grade rank and XP to the podium. */
export function ViewerRankStrip({ entries, label, grade }: { entries: readonly ClassLeaderboardEntry[]; label: string; grade?: Grade }) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const me = entries.find((entry) => entry.isViewer && entry.rank != null);
  if (!me || me.rank == null) return null;
  const size = entries.filter((entry) => entry.rank != null).length;
  const third = entries.find((entry) => entry.rank === 3);
  const toPodium = me.rank > 3 && third ? Math.max(1, third.xp - me.xp) : null;
  const tier = asTier(me.tierKey);
  const sx = {
    alignItems: "center",
    background: `linear-gradient(90deg, ${t.color.primarySofter}, ${t.color.surface} 70%)`,
    border: 1,
    borderColor: t.color.primarySoft,
    borderRadius: `${t.radius.card}px`,
    display: "flex",
    flexWrap: "wrap",
    gap: phone ? 1.5 : 2.5,
    px: phone ? 1.75 : 2.5,
    py: phone ? 1.5 : 1.75,
  } as const;
  if (phone) {
    return (
      <Box aria-label="Thứ hạng của bạn lúc này" role="region" sx={{ ...sx, flexWrap: "nowrap" }}>
        <MeAvatar me={me} size={40} />
        <Box sx={{ display: "grid", flex: 1, gap: 0.25, minWidth: 0 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Thứ hạng tuần</Typography>
            {tier ? <ErgTierChip tier={tier}>{tierLabel(tier, me.division)}</ErgTierChip> : null}
          </Box>
          <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
            <Typography component="span" variant="h2" sx={{ color: "primary.main", fontVariantNumeric: "tabular-nums" }}>{`#${me.rank}`}</Typography>
            <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>{`/ ${size}${grade?.rank != null ? ` · ${grade.label} #${grade.rank}` : ""}`}</Typography>
          </Box>
        </Box>
        {me.rankChange ? <Delta change={me.rankChange} long={false} /> : null}
      </Box>
    );
  }
  return (
    <Box aria-label="Thứ hạng của bạn lúc này" role="region" sx={sx}>
      <MeAvatar me={me} size={52} />
      <Box sx={{ display: "grid", gap: 0.25 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Thứ hạng của bạn lúc này</Typography>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <Typography component="span" sx={{ ...t.type.ringRank, color: "primary.main", fontVariantNumeric: "tabular-nums" }}>{`#${me.rank}`}</Typography>
          <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>{`/ ${size} bạn ${label}`}</Typography>
          {me.rankChange ? <Delta change={me.rankChange} long /> : null}
        </Box>
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 2.5, ml: "auto" }}>
        <Stat label="XP tuần"><BoltRoundedIcon sx={{ color: "primary.main", fontSize: t.size.iconSm }} />{formatViNumber(me.xp)}</Stat>
        {grade?.rank != null ? <Stat label={grade.label}>{`#${grade.rank}`}<Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>{`/ ${grade.size}`}</Typography></Stat> : null}
        {toPodium != null ? <Stat label="Lên top 3">{`còn ${formatViNumber(toPodium)} XP`}</Stat> : null}
        <ErgButton leadingIcon={<MyLocationRoundedIcon />} size="small" variant="outlined" onClick={goToMe}>Tới chỗ của tôi</ErgButton>
      </Box>
    </Box>
  );
}
