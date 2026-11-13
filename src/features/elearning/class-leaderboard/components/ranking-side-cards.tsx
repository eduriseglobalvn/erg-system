import type { ReactNode } from "react";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { formatViNumber } from "@/domain/student-tier/tiers";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { chaseOf } from "@/features/elearning/class-leaderboard/components/chase-strip";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const STREAK_BONUS_DAYS = 7;

const cardSx = { bgcolor: t.color.surface, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, overflow: "hidden" } as const;

function CardHead({ title, note, overline }: { title: string; note?: string; overline?: boolean }) {
  return (
    <Box sx={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", px: 2.5, pb: 1, pt: 2 }}>
      <Typography component="h2" variant={overline ? "overline" : "h5"} sx={overline ? { color: "text.secondary" } : undefined}>{title}</Typography>
      {note ? <Typography variant="caption" sx={{ color: "text.secondary" }}>{note}</Typography> : null}
    </Box>
  );
}

function Tile({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  return (
    <Box sx={{ bgcolor: t.color.surfaceMuted, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "grid", gap: 0.25, px: 1.5, py: 1.25 }}>
      <Typography component="span" variant="h4" sx={{ alignItems: "center", display: "flex", fontVariantNumeric: "tabular-nums", gap: 0.5 }}>{icon}{value}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
    </Box>
  );
}

/** "Vị trí của bạn" (design H08): rank ring towards rank 3, the gap line and three small stats. Null while the viewer is unranked. */
export function RankPositionCard({ entries, size, periodWord }: { entries: readonly ClassLeaderboardEntry[]; size: number; periodWord: string }) {
  const chase = chaseOf(entries);
  if (!chase) return null;
  const { me } = chase;
  const ratio = chase.kind === "chase" ? chase.ratio : 1;
  const heading = chase.kind === "chase" ? `Còn ${formatViNumber(chase.gap)} XP lên hạng 3` : me.rank === 1 ? "Bạn đang dẫn đầu" : `Bạn đang giữ hạng ${me.rank}`;
  const detail = chase.kind === "chase"
    ? `${formatViNumber(me.xp)} / ${formatViNumber(chase.third.xp)} XP · làm thêm 1 bài là vượt ${chase.third.studentName || "bạn đứng hạng 3"}`
    : `${formatViNumber(me.xp)} XP ${periodWord}`;
  return (
    <Box component="section" data-design="H08.position" sx={cardSx}>
      <CardHead overline title="Vị trí của bạn" />
      <Box sx={{ display: "grid", gap: 2, px: 2.5, pb: 2.5 }}>
        {me.rankChange && me.rankChange > 0 ? (
          <Box component="span" sx={{ alignItems: "center", alignSelf: "start", bgcolor: t.statusTint.success.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.success.color, display: "inline-flex", height: 24, justifySelf: "start", px: 1, typography: "caption" }}>
            <ArrowUpwardRoundedIcon sx={{ fontSize: t.size.iconSm }} />{`Lên ${me.rankChange} hạng`}
          </Box>
        ) : null}
        <Box sx={{ alignItems: "center", display: "flex", gap: 2 }}>
          <Box aria-hidden data-design="H08.ring" sx={{ alignItems: "center", background: `conic-gradient(${t.color.primary} 0 ${Math.round(ratio * 360)}deg, ${t.color.divider} 0)`, borderRadius: "50%", display: "grid", flexShrink: 0, height: 96, placeItems: "center", width: 96 }}>
            <Box sx={{ alignItems: "center", bgcolor: t.color.surface, borderRadius: "50%", display: "grid", height: 78, placeItems: "center", textAlign: "center", width: 78 }}>
              <Box>
                <Typography component="div" sx={{ ...t.type.ringRank, fontVariantNumeric: "tabular-nums" }}>{`#${me.rank}`}</Typography>
                <Typography component="div" variant="caption" sx={{ color: "text.secondary" }}>{`/ ${size}`}</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="p" variant="h3">{heading}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{detail}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <Tile icon={<BoltRoundedIcon color="primary" fontSize="small" />} label={`XP ${periodWord}`} value={formatViNumber(me.xp)} />
          <Tile icon={<LocalFireDepartmentRoundedIcon sx={{ color: t.podium.fire }} fontSize="small" />} label="ngày chuỗi" value={String(me.streakDays)} />
          <Tile label="thưởng chuỗi" value={me.streakDays >= STREAK_BONUS_DAYS ? "×1,2" : "×1"} />
        </Box>
      </Box>
    </Box>
  );
}

export type EarnXpItem = { id: string; title: string; subtitle: string; xp: number };

/** "Kiếm XP ngay" (design H08): up to three open assignments with their XP and an outlined start button. */
export function EarnXpCard({ items, gap, onStart }: { items: readonly EarnXpItem[]; /** XP missing for the podium; the first item says whether it is enough. */ gap?: number; onStart?: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <Box component="section" data-design="H08.earn" sx={cardSx}>
      <CardHead title="Kiếm XP ngay" note={`${items.length} bài đang mở`} />
      {items.slice(0, 3).map((item, index) => (
        <Box key={item.id} sx={{ alignItems: "center", bgcolor: index === 0 ? t.color.primarySofter : "transparent", display: "flex", gap: 1.5, px: 2.5, py: 1.5 }}>
          <Box aria-hidden sx={{ alignItems: "center", bgcolor: index === 0 ? "primary.main" : t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: index === 0 ? "primary.contrastText" : "primary.main", display: "grid", flexShrink: 0, height: 34, placeItems: "center", width: 34 }}><AssignmentOutlinedIcon fontSize="small" /></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">{item.title}</Typography>
            <Typography noWrap variant="caption" sx={{ color: index === 0 ? "primary.main" : "text.secondary", display: "block" }}>
              {index === 0 && gap != null && item.xp >= gap ? `Đủ để lên bục · ${item.subtitle}` : item.subtitle}
            </Typography>
          </Box>
          <Box component="span" sx={{ bgcolor: t.statusTint.info.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.info.color, px: 1, typography: "caption", whiteSpace: "nowrap" }}>{`+${formatViNumber(item.xp)} XP`}</Box>
          <ErgButton size="small" variant="outlined" onClick={() => onStart?.(item.id)}>{index === 0 ? "Làm ngay" : "Làm"}</ErgButton>
        </Box>
      ))}
    </Box>
  );
}

const REWARDS = [
  { title: "Top 3 tuần", note: "Hạng 1–3", icon: WorkspacePremiumRoundedIcon, tint: t.statusTint.warning, color: t.medal.gold },
  { title: "Bền bỉ", note: "Chuỗi 7 ngày", icon: LocalFireDepartmentRoundedIcon, tint: t.statusTint.warning, color: t.podium.fire },
  { title: "Bứt phá", note: "Lên 3 hạng", icon: TrendingUpRoundedIcon, tint: t.statusTint.success, color: t.color.success },
] as const;

/** "Phần thưởng tuần này" (design H08): the three weekly badges and the XP rules line. */
export function WeekRewardsCard() {
  return (
    <Box component="section" data-design="H08.rewards" sx={cardSx}>
      <CardHead title="Phần thưởng tuần này" note="Trao lúc chốt bảng" />
      <Box sx={{ display: "grid", gap: 1.5, px: 2.5, pb: 2.5 }}>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {REWARDS.map(({ title, note, icon: Icon, tint, color }) => (
            <Box key={title} sx={{ alignItems: "center", border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "grid", gap: 0.5, justifyItems: "center", px: 0.75, py: 1.5, textAlign: "center" }}>
              <Box aria-hidden sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: "50%", color, display: "grid", height: 48, placeItems: "center", width: 48 }}><Icon /></Box>
              <Typography variant="caption" sx={{ color: "text.primary", fontWeight: "fontWeightMedium" }}>{title}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{note}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ alignItems: "flex-start", color: "text.secondary", display: "flex", gap: 1 }}>
          <InfoOutlinedIcon sx={{ fontSize: t.size.iconSm, mt: 0.25 }} />
          <Typography variant="caption" sx={{ flex: 1 }}>XP: hoàn thành bài +10–40 · nộp trước hạn +10 · chuỗi ≥ 7 ngày ×1,2. Không hiện điểm số của ai.</Typography>
        </Box>
      </Box>
    </Box>
  );
}
