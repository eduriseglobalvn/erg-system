import { useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ergChipTabsSx, ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import {
  classLeaderboardKeys,
  loadStudentClassLeaderboard,
  setMyLeaderboardHidden,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassLeaderboardTable } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { ViewerRankStrip } from "@/features/elearning/class-leaderboard/components/viewer-rank-strip";
import { PodiumArena } from "@/features/elearning/class-leaderboard/components/podium-arena";
import { EarnXpCard, RankPositionCard, WeekRewardsCard, XP_RULES } from "@/features/elearning/class-leaderboard/components/ranking-side-cards";
import { chaseOf } from "@/features/elearning/class-leaderboard/components/chase-strip";
import { LEADERBOARD_PERIODS, leaderboardPeriodLabel, leaderboardWeekLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";
import { gradeLabelFromClassName } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import { EmptyPanel, SkeletonRow } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import { Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import { dueClock } from "@/features/elearning/student-dashboard/utils/assignment-board";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

/** "hạn 20:00 hôm nay", "21:00 ngày mai", "Thứ Hai 16/11". */
function dueText(a: StudentDashboardAssignment) {
  const clock = dueClock(a, Date.now());
  return clock.endsWith("hôm nay") ? `hạn ${clock}` : clock;
}

const PERIOD_WORD = { WEEK: "tuần", MONTH: "tháng", TERM: "học kỳ", COURSE: "cả khóa" } as const;

/** "Thi đua" (design H08 / H03b): XP board of the class or grade by week, month or course. Shown only while the teacher keeps it on. */
type RankingViewProps = {
  accountId: string;
  classId: string;
  copy: DashboardCopy;
  /** "Khối 7": label of the grade chip and of the grade rank. */
  gradeLabel?: string;
  /** "Xem cả lớp" (H14); receives the period picked here. */
  onOpenFullBoard?: (period: LeaderboardPeriod) => void;
  /** The round "?" button (H18). */
  onOpenTierTable?: () => void;
  /** Open assignments for "Kiếm XP ngay"; the card is hidden while the list is empty. */
  openAssignments?: readonly StudentDashboardAssignment[];
  /** Start button of the chase strip and of "Kiếm XP ngay" (goes to the assignments page). */
  onDoAssignments?: () => void;
};

export function RankingView({ accountId, classId, copy, gradeLabel: gradeProp, onOpenFullBoard, onOpenTierTable, openAssignments = [], onDoAssignments }: RankingViewProps) {
  const queryClient = useQueryClient();
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [period, setPeriod] = useState<LeaderboardPeriod>("WEEK");
  const [scope, setScope] = useState<LeaderboardScope>("CLASS");
  const board = useQuery({
    queryKey: classLeaderboardKeys.student(accountId, classId, period, scope),
    queryFn: ({ signal }) => loadStudentClassLeaderboard(classId, period, scope, signal),
  });
  const hide = useMutation({
    mutationFn: setMyLeaderboardHidden,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["class-leaderboard", "student", accountId] }),
  });
  const entries = board.data?.enabled ? board.data.entries : [];
  const ranked = entries.some((entry) => entry.rank != null);
  const viewerHidden = hide.isPending ? Boolean(hide.variables) : Boolean(board.data?.viewerHidden);
  const className = board.data?.className || "Lớp";
  const gradeLabel = gradeProp || gradeLabelFromClassName(className) || "Khối";
  const size = board.data?.me?.size;
  const subtitle = period === "WEEK" && board.data?.periodEndsAt
    ? [leaderboardWeekLabel(board.data.periodEndsAt), `Lớp ${className}`, size ? `${size} bạn` : ""].filter(Boolean).join(" · ")
    : copy.ranking.description;
  const grade = board.data?.me?.gradeRank && board.data.me.gradeSize ? { label: gradeLabel, rank: board.data.me.gradeRank, size: board.data.me.gradeSize } : undefined;

  const periodTabs = (
    <Tabs aria-label="Kỳ thi đua" value={period} variant="fullWidth" onChange={(_, value: LeaderboardPeriod) => setPeriod(value)} sx={{ ...ergSegmentedTabsSx, width: { xs: "100%", md: 330 } }}>
      {LEADERBOARD_PERIODS.map((value) => <Tab key={value} value={value} label={phone && value === "COURSE" ? "Cả khóa" : leaderboardPeriodLabel(value)} />)}
    </Tabs>
  );
  const scopeTabs = (
    <Tabs aria-label="Phạm vi" value={scope} onChange={(_, value: LeaderboardScope) => setScope(value)} sx={ergChipTabsSx}>
      <Tab value="CLASS" label={`Lớp ${className}`} />
      <Tab value="GRADE" label={gradeLabel} />
    </Tabs>
  );
  const help = onOpenTierTable ? <ErgIconButton label="Bảng bậc & cấp" onClick={onOpenTierTable}><HelpOutlineRoundedIcon /></ErgIconButton> : null;

  return (
    <Stack spacing={phone ? 1.5 : 2.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: phone ? "center" : "flex-end", flexWrap: "wrap", justifyContent: "space-between", rowGap: 1.5 }}>
        <div>
          <Typography component="h1" variant="h1">{copy.ranking.title}</Typography>
          {phone ? null : <Typography variant="body2" sx={{ color: "text.secondary" }}>{subtitle}</Typography>}
        </div>
        {phone ? help : <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>{periodTabs}{scopeTabs}{help}</Stack>}
      </Stack>
      {board.isPending ? (
        <Stack spacing={1.5}><SkeletonRow /><SkeletonRow /></Stack>
      ) : board.isError ? (
        <EmptyPanel description={copy.ranking.errorDescription} title={copy.ranking.errorTitle} />
      ) : ranked ? (
        <>
          <ViewerRankStrip entries={entries} grade={grade} label={scope === "CLASS" ? `lớp ${className}` : gradeLabel.toLowerCase()} />
          {phone ? <>{periodTabs}{scopeTabs}</> : null}
          <PodiumArena
            endsAt={period === "COURSE" ? undefined : board.data?.periodEndsAt}
            entries={entries}
            subtitle={period === "COURSE" ? "Xếp theo tổng XP cả khóa" : `Ai đứng trên bục lúc chốt bảng sẽ nhận huy hiệu ${PERIOD_WORD[period]}`}
            title={period === "WEEK" ? "Top 3 tuần này" : `Top 3 ${leaderboardPeriodLabel(period).toLowerCase()}`}
            onStart={onDoAssignments}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: "flex-start" }}>
            <Stack spacing={1.5} sx={{ flex: { md: "2 1 620px" }, minWidth: 0, width: "100%" }}>
              <ClassLeaderboardTable entries={entries} skipPodium total={size} onOpenAll={onOpenFullBoard ? () => onOpenFullBoard(period) : undefined} />
              {phone ? <Typography variant="caption" sx={{ color: "text.secondary" }}>{XP_RULES}</Typography> : null}
            </Stack>
            {phone ? null : (
              <Stack spacing={2.5} sx={{ flex: "1 1 340px", minWidth: 0, width: "100%" }}>
                <RankPositionCard entries={entries} periodWord={PERIOD_WORD[period]} size={entries.filter((entry) => entry.rank != null).length} />
                <EarnXpCard
                  gap={(() => { const chase = chaseOf(entries); return chase?.kind === "chase" ? chase.gap : undefined; })()}
                  items={openAssignments.map((a) => ({ id: a.id, title: a.title, subject: a.subjectLabel, subtitle: dueText(a), xp: a.xpReward ?? 0, kind: a.kind }))}
                  onStart={onDoAssignments ? () => onDoAssignments() : undefined}
                />
                <WeekRewardsCard />
              </Stack>
            )}
          </Stack>
        </>
      ) : (
        <EmptyPanel description={copy.ranking.emptyDescription} title={copy.ranking.emptyTitle} />
      )}
      {board.data?.enabled ? (
        <Stack spacing={0.25}>
          <FormControlLabel
            control={<Switch checked={!viewerHidden} disabled={hide.isPending} onChange={(event) => hide.mutate(!event.target.checked)} />}
            label="Hiện tôi trên bảng xếp hạng"
          />
          <Typography variant="caption" sx={{ color: "text.secondary", pl: 6 }}>Tắt thì bạn vẫn thấy hạng của mình.</Typography>
        </Stack>
      ) : null}
    </Stack>
  );
}
