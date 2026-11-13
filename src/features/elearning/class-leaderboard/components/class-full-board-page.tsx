import { Fragment, useRef, useState } from "react";
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
import { ErgTierEmblem } from "@/components/erg-mui/erg-tier";
import { TIER_KEYS, formatViNumber, tierLabel } from "@/domain/student-tier/tiers";
import {
  classLeaderboardKeys,
  loadStudentClassLeaderboard,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { COLUMNS, GroupHeader, Row } from "@/features/elearning/class-leaderboard/components/class-full-board-rows";
import { LEADERBOARD_PERIODS, leaderboardPeriodLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";
import { TierError, TierHeader, TierLoading, cardSx } from "@/features/elearning/student-tier/components/tier-parts";
import { useMyTier } from "@/features/elearning/student-tier/components/use-student-tier";
import { asTier, submitMoreLabel } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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
      {mine || board.data?.me ? (
        <Box data-design="H14m.pinned" sx={{ ...cardSx, alignItems: "center", bottom: ergMobileDockAnchor(8), boxShadow: t.shadow.float, display: { xs: "flex", md: "none" }, gap: 1.5, left: 12, p: 1.25, position: "fixed", right: 12, zIndex: (theme) => theme.zIndex.appBar }}>
          {tier ? <ErgTierEmblem tier={tier} size={36} /> : null}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">{tier && mine ? `${tierLabel(tier, mine.division)}${board.data?.me?.rank ? ` · hạng ${board.data.me.rank}` : ""}` : [board.data?.me?.rank ? `Hạng ${board.data.me.rank}` : "", `${formatViNumber(mine?.courseXp ?? board.data?.me?.xp ?? 0)} XP`].filter(Boolean).join(" · ")}</Typography>
            {tier && mine?.nextDivision ? <Typography noWrap variant="caption" sx={{ color: "text.secondary", display: "block" }}>{`+${formatViNumber(Math.max(0, mine.nextDivision.minXp - mine.courseXp))} XP lên ${tierLabel(asTier(mine.nextDivision.tierKey) ?? tier, mine.nextDivision.division)}`}</Typography> : null}
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
          }) : shown.map((e) => (
            <Fragment key={e.studentId}>
              <Row entry={e} course={course} top={top} viewerRef={viewerRef} />
              {e.rank === 3 && !query ? <Box aria-hidden data-design="H14.top3Line" sx={{ borderTop: `2px dashed ${t.medal.gold}` }} /> : null}
            </Fragment>
          ))}
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
