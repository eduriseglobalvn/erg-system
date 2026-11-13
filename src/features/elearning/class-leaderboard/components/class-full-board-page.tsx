import { useRef, useState, type RefObject } from "react";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";

import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ergChipTabsSx, ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { ErgTierChip, ErgTierEmblem } from "@/components/erg-mui/erg-tier";
import { TIER_BANDS, TIER_KEYS, TIER_NAMES, formatViNumber, tierLabel } from "@/domain/student-tier/tiers";
import {
  classLeaderboardKeys,
  loadStudentClassLeaderboard,
  type ClassLeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { StreakDays, medalColor } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { LEADERBOARD_PERIODS, leaderboardPeriodLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";
import { TierAvatar, TierError, TierHeader, TierLoading, cardSx } from "@/features/elearning/student-tier/components/tier-parts";
import { useMyTier } from "@/features/elearning/student-tier/components/use-student-tier";
import { asTier, submitMoreLabel } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const HIDDEN_NAME = "Bạn ẩn tên";
const COLUMNS = { xs: "40px minmax(0,1fr) 64px", md: "56px 48px minmax(0,1.4fr) 140px 120px minmax(0,1.2fr) 90px" } as const;
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Change({ value }: { value: number | null }) {
  if (!value) return <Typography variant="caption" sx={{ color: "text.secondary" }}>—</Typography>;
  const up = value > 0;
  return (
    <Typography aria-label={up ? `Lên ${value} hạng` : `Xuống ${-value} hạng`} variant="caption" sx={{ alignItems: "center", color: up ? "success.main" : "error.main", display: "inline-flex", fontWeight: "fontWeightBold" }}>
      {up ? <ArrowUpwardRoundedIcon sx={{ fontSize: t.size.iconSm }} /> : <ArrowDownwardRoundedIcon sx={{ fontSize: t.size.iconSm }} />}{Math.abs(value)}
    </Typography>
  );
}

type RowProps = { entry: ClassLeaderboardEntry; course: boolean; top: number; viewerRef: RefObject<HTMLDivElement | null> };

function Row({ entry, course, top, viewerRef }: RowProps) {
  const hidden = entry.hidden === true && !entry.isViewer;
  const tier = hidden ? null : asTier(entry.tierKey);
  const name = hidden ? HIDDEN_NAME : entry.studentName || "Học sinh";
  const medal = course ? undefined : medalColor(entry.rank);
  const chip = tier ? <ErgTierChip tier={tier}>{tierLabel(tier, entry.division)}</ErgTierChip> : null;
  return (
    <Box
      aria-current={entry.isViewer ? "true" : undefined}
      data-design={entry.isViewer ? "H14.myRow" : undefined}
      ref={entry.isViewer ? viewerRef : undefined}
      sx={{ alignItems: "center", bgcolor: entry.isViewer ? t.color.primarySofter : "transparent", borderLeft: entry.isViewer ? `4px solid ${t.color.primary}` : "4px solid transparent", borderTop: 1, borderColor: t.color.divider, display: "grid", gap: 1.5, gridTemplateColumns: COLUMNS, minHeight: 56, px: 2, py: 0.75 }}
    >
      <Box sx={{ alignItems: "center", bgcolor: entry.isViewer ? "primary.main" : medal ?? t.color.surfaceSubtle, borderRadius: "50%", color: entry.isViewer || medal ? "primary.contrastText" : "text.secondary", display: "grid", height: 32, placeItems: "center", typography: "caption", width: 32 }}>{entry.rank ?? "—"}</Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}><Change value={entry.rankChange} /></Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minWidth: 0 }}>
        {hidden ? (
          <Box aria-hidden sx={{ alignItems: "center", border: `1px dashed ${t.color.borderStrong}`, borderRadius: "50%", color: "text.secondary", display: "grid", flexShrink: 0, height: 32, placeItems: "center", width: 32 }}>?</Box>
        ) : <TierAvatar name={name} tier={asTier(entry.frameKey)} size={30} muted={!entry.isViewer} />}
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

function GroupHeader({ tierKey, count }: { tierKey: (typeof TIER_KEYS)[number]; count: number }) {
  return (
    <Box sx={{ alignItems: "center", bgcolor: t.color.surfaceMuted, borderTop: 1, borderColor: t.color.divider, display: "flex", gap: 1.5, px: 2, py: 0.75 }}>
      <ErgTierEmblem tier={tierKey} size={26} />
      <Typography variant="subtitle2">{TIER_NAMES[tierKey]}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", flex: 1, textAlign: "center" }}>{`${TIER_BANDS[tierKey]} khối`}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{count ? `${count} bạn` : "Chưa ai đạt — bạn sẽ là người đầu tiên?"}</Typography>
    </Box>
  );
}

export type ClassFullBoardPageProps = {
  accountId: string;
  classId: string;
  /** Period to open on: "COURSE" from the tier page, otherwise the one picked on the Thi đua screen. */
  initialPeriod?: LeaderboardPeriod;
  gradeLabel?: string;
  seasonLabel?: string;
  onBack?: () => void;
};

/** "Bảng xếp hạng cả lớp" (design H14 / H14m): the whole class by tier (course) or by XP (week, month), with search and paging. */
export function ClassFullBoardPage({ accountId, classId, initialPeriod = "COURSE", gradeLabel = "Khối", seasonLabel = "Mùa 1", onBack }: ClassFullBoardPageProps) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const pageSize = phone ? 14 : 16;
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [scope, setScope] = useState<LeaderboardScope>("CLASS");
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState(1);
  const viewerRef = useRef<HTMLDivElement>(null);
  const board = useQuery({ queryKey: classLeaderboardKeys.student(accountId, classId, period, scope), queryFn: ({ signal }) => loadStudentClassLeaderboard(classId, period, scope, signal) });
  const mine = useMyTier(accountId).data;
  const course = period === "COURSE";
  const className = board.data?.className || "lớp";
  const label = scope === "CLASS" ? className : gradeLabel;
  const all = board.data?.enabled ? board.data.entries : [];
  const matched = query.trim() ? all.filter((e) => strip(e.studentName ?? "").includes(strip(query.trim()))) : all;
  const shown = matched.slice(0, pages * pageSize);
  const top = all.reduce((max, e) => Math.max(max, e.xp), 0);
  const tier = asTier(mine?.tierKey);
  const gap = (xp?: number) => (xp == null || !mine ? "" : ` (+${formatViNumber(Math.max(0, xp - mine.courseXp))})`);
  const goToMe = () => {
    setQuery("");
    setPages(Math.ceil(all.length / pageSize));
    requestAnimationFrame(() => viewerRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" }));
  };

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 1180, mx: "auto", px: { xs: 2, md: 0 }, py: { xs: 2, md: 3 }, pb: { xs: 11, md: 3 } }}>
      <ErgButton variant="text" onClick={onBack} sx={{ display: { xs: "none", md: "inline-flex" }, justifySelf: "start", minWidth: 0, p: 0 }}>← Thi đua</ErgButton>
      <TierHeader
        title={phone ? `Cả lớp ${className}` : `Bảng xếp hạng cả lớp ${className}`}
        subtitle={phone ? `${seasonLabel} · ${all.length} bạn` : `${seasonLabel} · khóa 2026–2027 · xếp theo bậc, cùng bậc thì ai nhiều XP hơn đứng trên`}
        onBack={phone ? onBack : undefined}
        actions={(
          <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, gap: 1 }}>
            <Tabs aria-label="Kỳ thi đua" value={period} sx={ergSegmentedTabsSx} onChange={(_, v: LeaderboardPeriod) => { setPeriod(v); setPages(1); }}>
              {LEADERBOARD_PERIODS.map((p) => <Tab key={p} value={p} label={leaderboardPeriodLabel(p)} />)}
            </Tabs>
          </Box>
        )}
      />
      <Box sx={{ display: { xs: "grid", md: "none" } }}>
        <Tabs aria-label="Kỳ thi đua" value={period} variant="fullWidth" sx={ergSegmentedTabsSx} onChange={(_, v: LeaderboardPeriod) => { setPeriod(v); setPages(1); }}>
          {LEADERBOARD_PERIODS.map((p) => <Tab key={p} value={p} label={p === "COURSE" ? "Cả khóa" : leaderboardPeriodLabel(p)} />)}
        </Tabs>
      </Box>
      <Tabs aria-label="Phạm vi" value={scope} sx={ergChipTabsSx} onChange={(_, v: LeaderboardScope) => { setScope(v); setPages(1); }}>
        <Tab value="CLASS" label={board.data?.className || "Lớp"} />
        <Tab value="GRADE" label={gradeLabel} />
      </Tabs>
      {mine ? (
        <Box data-design="H14.mine" sx={{ ...cardSx, alignItems: "center", boxShadow: t.shadow.float, display: { xs: "none", md: "flex" }, flexWrap: "wrap", gap: 2, py: 1.25 }}>
          {tier ? <ErgTierEmblem tier={tier} size={36} /> : null}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2">
              {!mine.eligible || !tier ? submitMoreLabel(mine.submittedCount) : `Bạn đang ${tierLabel(tier, mine.division)} · #${mine.gradeRank} / ${mine.gradeSize} ${gradeLabel.toLowerCase()}${board.data?.me?.rank ? ` · hạng ${board.data.me.rank} lớp` : ""} · ${formatViNumber(mine.courseXp)} XP`}
            </Typography>
            {tier && mine.nextDivision ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {`Mốc tuần này: ${tierLabel(asTier(mine.nextDivision.tierKey) ?? tier, mine.nextDivision.division)} ${formatViNumber(mine.nextDivision.minXp)} XP${gap(mine.nextDivision.minXp)}${mine.nextTier ? ` · ${tierLabel(asTier(mine.nextTier.tierKey) ?? tier, mine.nextTier.division)} ${formatViNumber(mine.nextTier.minXp)} XP${gap(mine.nextTier.minXp)}` : ""}`}
              </Typography>
            ) : null}
          </Box>
          <TextField
            hiddenLabel
            placeholder={`Tìm bạn trong ${label.toLowerCase()}`}
            size="small"
            slotProps={{ htmlInput: { "aria-label": "Tìm bạn" }, input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
            sx={{ display: { xs: "none", md: "block" }, width: 220 }}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPages(1); }}
          />
          <ErgButton variant="outlined" startIcon={<MyLocationRoundedIcon />} onClick={goToMe}>Tới chỗ của tôi</ErgButton>
        </Box>
      ) : null}
      {mine && tier ? (
        <Box data-design="H14m.pinned" sx={{ ...cardSx, alignItems: "center", bottom: ergMobileDockAnchor(8), boxShadow: t.shadow.float, display: { xs: "flex", md: "none" }, gap: 1.5, left: 12, p: 1.25, position: "fixed", right: 12, zIndex: (theme) => theme.zIndex.appBar }}>
          <ErgTierEmblem tier={tier} size={36} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">{`${tierLabel(tier, mine.division)}${board.data?.me?.rank ? ` · hạng ${board.data.me.rank}` : ""}`}</Typography>
            {mine.nextDivision ? <Typography noWrap variant="caption" sx={{ color: "text.secondary", display: "block" }}>{`+${formatViNumber(Math.max(0, mine.nextDivision.minXp - mine.courseXp))} XP lên ${tierLabel(asTier(mine.nextDivision.tierKey) ?? tier, mine.nextDivision.division)}`}</Typography> : null}
          </Box>
          <ErgButton variant="outlined" onClick={goToMe}>Tới chỗ tôi</ErgButton>
        </Box>
      ) : null}
      {board.isPending ? <TierLoading /> : board.isError ? <TierError onRetry={() => void board.refetch()} /> : !all.length ? (
        <ErgEmptyState title="Chưa có bảng xếp hạng" description="Giáo viên đang tắt bảng này hoặc lớp chưa có học sinh." />
      ) : (
        <Box sx={{ ...cardSx, overflow: "hidden", p: 0 }}>
          <Box aria-hidden sx={{ color: "text.secondary", display: { xs: "none", md: "grid" }, gap: 1.5, gridTemplateColumns: COLUMNS, px: 2, py: 1.25, typography: "caption" }}>
            <span>Hạng</span><span /><span>Học sinh</span><span>{course ? "Bậc" : "Bài nộp"}</span><span>Chuỗi ngày</span><span>XP so với hạng 1</span><span style={{ textAlign: "right" }}>{course ? "XP cả khóa" : "XP"}</span>
          </Box>
          {course && !query ? TIER_KEYS.slice().reverse().map((key) => {
            const rows = shown.filter((e) => e.tierKey === key);
            const total = all.filter((e) => e.tierKey === key).length;
            return (
              <div key={key}>
                <GroupHeader tierKey={key} count={total} />
                {rows.map((e) => <Row key={e.studentId} entry={e} course top={top} viewerRef={viewerRef} />)}
              </div>
            );
          }) : shown.map((e) => <Row key={e.studentId} entry={e} course={course} top={top} viewerRef={viewerRef} />)}
          <Box sx={{ alignItems: "center", borderTop: 1, borderColor: t.color.divider, display: "flex", justifyContent: "space-between", px: 2, py: 1.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{`Hiện ${shown.length} / ${matched.length} bạn`}</Typography>
            {shown.length < matched.length ? <ErgButton variant="outlined" onClick={() => setPages((p) => p + 1)}>{`Xem tiếp ${matched.length - shown.length} bạn`}</ErgButton> : null}
          </Box>
        </Box>
      )}
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Tuần này / Tháng: xếp theo XP kiếm được trong kỳ, như bảng thi đua. Cả khóa học: xếp theo bậc, bậc chia theo tỉ lệ trong khối và cập nhật mỗi thứ Hai. Bạn bật “Ẩn tên” hiện là “Bạn ẩn tên” và không hiện khung viền.
      </Typography>
    </Box>
  );
}
