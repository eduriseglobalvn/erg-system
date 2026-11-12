import { useState } from "react";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ergChipTabsSx, ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import {
  classLeaderboardKeys,
  loadStudentClassLeaderboard,
  setMyLeaderboardHidden,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassLeaderboardTable } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { LeaderboardPodium } from "@/features/elearning/class-leaderboard/components/leaderboard-podium";
import { LEADERBOARD_PERIODS, leaderboardClosesIn, leaderboardPeriodLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";
import { EmptyPanel, PageHeader, SectionCard, SkeletonRow } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import { Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

const XP_RULES = [
  ["Hoàn thành bài", "+10–40"],
  ["Nộp trước hạn", "+10"],
  ["Giữ chuỗi ≥ 7 ngày", "×1,2"],
] as const;

/** "Thi đua" (design H03): XP board of the class or grade by week, month or term. Shown only while the teacher keeps it on. */
export function RankingView({ accountId, classId, copy }: { accountId: string; classId: string; copy: DashboardCopy }) {
  const queryClient = useQueryClient();
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
  const closesIn = board.data ? leaderboardClosesIn(board.data.periodEndsAt) : "";
  const viewerHidden = hide.isPending ? Boolean(hide.variables) : Boolean(board.data?.viewerHidden);

  return (
    <Stack spacing={2.5}>
      <PageHeader description={copy.ranking.description} icon={<EmojiEventsOutlinedIcon />} title={copy.ranking.title} />
      <Tabs aria-label="Kỳ thi đua" value={period} variant="fullWidth" onChange={(_, value: LeaderboardPeriod) => setPeriod(value)} sx={ergSegmentedTabsSx}>
        {LEADERBOARD_PERIODS.map((value) => <Tab key={value} value={value} label={leaderboardPeriodLabel(value)} />)}
      </Tabs>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", rowGap: 1 }}>
        <Tabs aria-label="Phạm vi" value={scope} onChange={(_, value: LeaderboardScope) => setScope(value)} sx={ergChipTabsSx}>
          <Tab value="CLASS" label={board.data?.className || "Lớp"} />
          <Tab value="GRADE" label="Cả khối" />
        </Tabs>
        {closesIn ? <Typography variant="caption" sx={{ color: "text.secondary" }}>{closesIn}</Typography> : null}
      </Stack>
      {board.isPending ? (
        <Stack spacing={1.5}><SkeletonRow /><SkeletonRow /></Stack>
      ) : board.isError ? (
        <EmptyPanel description={copy.ranking.errorDescription} title={copy.ranking.errorTitle} />
      ) : ranked ? (
        <>
          <LeaderboardPodium entries={entries} />
          <ClassLeaderboardTable entries={entries} />
        </>
      ) : (
        <EmptyPanel description={copy.ranking.emptyDescription} title={copy.ranking.emptyTitle} />
      )}
      <SectionCard title="Kiếm XP thế nào?">
        <Stack spacing={1}>
          {XP_RULES.map(([label, value]) => (
            <Stack key={label} direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2">{label}</Typography>
              <Typography variant="body2" sx={{ color: "primary.main", fontWeight: "fontWeightMedium" }}>{value}</Typography>
            </Stack>
          ))}
          <Typography variant="caption" sx={{ color: "text.secondary", pt: 0.5 }}>Bảng chỉ dùng XP, không hiện điểm số bài làm của ai.</Typography>
        </Stack>
      </SectionCard>
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
