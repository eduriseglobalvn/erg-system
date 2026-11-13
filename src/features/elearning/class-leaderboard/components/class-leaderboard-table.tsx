import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTierFrame } from "@/components/erg-mui/erg-tier";
import { formatViNumber } from "@/domain/student-tier/tiers";
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

const COLUMNS = "36px 44px 40px minmax(0,1.2fr) minmax(0,1.6fr) 64px";
const PHONE_ROWS = 5;
const WEB_ROWS = 10;

/** Dashed line above the first row outside the podium: how much XP it takes to get on it. */
function TopThreeLine({ xp }: { xp: number }) {
  return (
    <Box aria-hidden sx={{ alignItems: "center", borderTop: 1, borderColor: t.color.divider, color: "text.secondary", display: "flex", gap: 1.25, px: 2.5, py: 0.75, typography: "caption" }}>
      <span>{`Cần ${formatViNumber(xp)} XP để vào top 3`}</span>
      <Box sx={{ borderTop: `1px dashed ${t.color.borderStrong}`, flex: 1 }} />
    </Box>
  );
}

const rowSx = (viewer: boolean) => ({ alignItems: "center", bgcolor: viewer ? t.color.primarySofter : "transparent", borderLeft: `4px solid ${viewer ? t.color.primary : "transparent"}`, borderTop: 1, borderColor: t.color.divider, display: "grid" }) as const;
const initialsSx = { bgcolor: t.color.primarySofter, color: t.statusTint.info.color, typography: "caption" } as const;

function BoardRow({ entry, top }: { entry: ClassLeaderboardEntry; top: number }) {
  const name = entry.studentName || "Học sinh";
  const medal = medalColor(entry.rank);
  return (
    <Box aria-current={entry.isViewer ? "true" : undefined} role="listitem" sx={{ ...rowSx(entry.isViewer), gap: 1.5, gridTemplateColumns: COLUMNS, minHeight: 62, px: 2, py: 1.25 }}>
      <Box sx={{ bgcolor: entry.isViewer ? "primary.main" : medal ?? t.color.surfaceSubtle, borderRadius: "50%", color: entry.isViewer || medal ? "primary.contrastText" : "text.primary", display: "grid", height: 32, placeItems: "center", typography: "subtitle2", width: 32 }}>{entry.rank ?? "—"}</Box>
      <RankChange change={entry.rankChange} />
      <Avatar sx={{ ...initialsSx, height: 36, width: 36 }}>{getInitials(name)}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
          <Typography noWrap variant="subtitle2">{name}</Typography>
          {entry.isViewer ? <Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", px: 1, typography: "caption" }}>Bạn</Box> : null}
        </Stack>
        <StreakDays days={entry.streakDays} />
      </Box>
      <Box aria-hidden sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, height: 8, overflow: "hidden" }}>
        <Box sx={{ bgcolor: entry.isViewer ? "primary.main" : t.color.primarySoft, height: "100%", width: `${top > 0 ? Math.max(2, Math.round((entry.xp / top) * 100)) : 0}%` }} />
      </Box>
      <Typography variant="subtitle2" sx={{ textAlign: "right" }}>{formatViNumber(entry.xp)}</Typography>
    </Box>
  );
}

/** Phone row (design H03b): rank, avatar in its tier ring, name with streak, XP and the change arrow. */
function PhoneRow({ entry }: { entry: ClassLeaderboardEntry }) {
  const name = `${entry.studentName || "Học sinh"}${entry.isViewer ? " (bạn)" : ""}`;
  const change = entry.rankChange ?? 0;
  const Arrow = change > 0 ? ArrowUpwardRoundedIcon : change < 0 ? ArrowDownwardRoundedIcon : RemoveRoundedIcon;
  return (
    <Box aria-current={entry.isViewer ? "true" : undefined} role="listitem" sx={{ ...rowSx(entry.isViewer), gap: 1.5, gridTemplateColumns: "24px auto minmax(0,1fr) auto 20px", minHeight: 66, px: 1.5, py: 0.75 }}>
      <Typography component="span" variant="subtitle2" sx={{ fontVariantNumeric: "tabular-nums", textAlign: "center" }}>{entry.rank ?? "—"}</Typography>
      <ErgTierFrame tier={asTier(entry.tierKey)} size={36}>
        <Avatar sx={{ ...initialsSx, height: 36, width: 36 }}>{getInitials(entry.studentName || "Học sinh")}</Avatar>
      </ErgTierFrame>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap variant="subtitle2">{name}</Typography>
        <StreakDays days={entry.streakDays} />
      </Box>
      <Typography component="span" variant="subtitle2" sx={{ fontVariantNumeric: "tabular-nums" }}>{formatViNumber(entry.xp)}</Typography>
      <Arrow aria-label={change > 0 ? `Lên ${change} hạng` : change < 0 ? `Xuống ${-change} hạng` : "Giữ hạng"} role="img" sx={{ color: change > 0 ? "success.main" : change < 0 ? "error.main" : "text.secondary", fontSize: t.size.iconMd }} />
    </Box>
  );
}

type TableProps = {
  entries: readonly ClassLeaderboardEntry[];
  /** Full class size when `entries` is only a slice; feeds the "Hiện N / M bạn" footer. */
  total?: number;
  /** Leave out ranks 1-3 (the arena above shows them) and give the card its "Bảng xếp hạng" header. */
  skipPodium?: boolean;
  /** Adds the "Xem cả lớp" link to the footer. */
  onOpenAll?: () => void;
};

/** XP board (design H08 / H03b): rank, change, avatar, name with streak, XP bar relative to rank 1, XP; the phone gets the compact list. */
export function ClassLeaderboardTable({ entries, total, skipPodium = false, onOpenAll }: TableProps) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const top = entries.reduce((max, entry) => Math.max(max, entry.xp), 0);
  const viewerRank = entries.find((entry) => entry.isViewer)?.rank;
  const thirdXp = entries.find((entry) => entry.rank === 3)?.xp;
  const hasPodium = skipPodium && entries.some((entry) => entry.rank != null && entry.rank <= 3);
  // Top ten of the class; the viewer's own row stays visible when they rank lower.
  const page = skipPodium ? entries.slice(0, WEB_ROWS) : entries;
  const viewer = entries.find((entry) => entry.isViewer && entry.rank != null);
  const withViewer = viewer && !page.includes(viewer) ? [...page, viewer] : page;
  const shown = hasPodium ? withViewer.filter((entry) => entry.rank == null || entry.rank > 3) : withViewer;
  const rows = phone ? shown.slice(0, PHONE_ROWS) : shown;
  const lineAt = !phone && viewerRank != null && viewerRank > 3 && thirdXp != null ? rows.findIndex((entry) => entry.rank != null && entry.rank > 3) : -1;
  return (
    <Box aria-label="Bảng thi đua" sx={{ bgcolor: "background.paper", border: 1, borderColor: t.color.divider, borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      {skipPodium && !phone ? (
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: 2.5, pb: 1.5, pt: 2 }}>
          <Typography component="h2" variant="h6">Bảng xếp hạng</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>Thanh = XP so với bạn dẫn đầu</Typography>
        </Box>
      ) : null}
      <Box role="list">
        {rows.map((entry, index) => (
          <div key={entry.studentId || index}>
            {index === lineAt && thirdXp != null ? <TopThreeLine xp={thirdXp} /> : null}
            {phone ? <PhoneRow entry={entry} /> : <BoardRow entry={entry} top={top} />}
          </div>
        ))}
      </Box>
      <Box sx={{ alignItems: "center", borderTop: phone ? undefined : 1, borderColor: t.color.divider, color: "text.secondary", display: "flex", justifyContent: "space-between", px: phone ? 0.5 : 2.5, py: phone ? 0 : 1.25, typography: "caption" }}>
        {phone ? null : <span>{`Hiện ${withViewer.length} / ${Math.max(total ?? 0, withViewer.length)} bạn`}</span>}
        {onOpenAll ? <ErgButton size="small" variant="text" trailingIcon={<ChevronRightRoundedIcon />} onClick={onOpenAll}>Xem cả lớp</ErgButton> : null}
      </Box>
    </Box>
  );
}
