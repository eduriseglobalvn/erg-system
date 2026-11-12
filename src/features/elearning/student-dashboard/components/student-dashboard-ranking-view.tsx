import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import { useQuery } from "@tanstack/react-query";

import { classLeaderboardKeys, loadStudentClassLeaderboard } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassLeaderboardTable } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { EmptyPanel, PageHeader, SkeletonRow } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import { Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

/** "Xếp hạng": the whole class with the student's own row highlighted. Shown only while the teacher keeps it on. */
export function RankingView({ accountId, classId, copy }: { accountId: string; classId: string; copy: DashboardCopy }) {
  const board = useQuery({
    queryKey: classLeaderboardKeys.student(accountId, classId),
    queryFn: ({ signal }) => loadStudentClassLeaderboard(classId, signal),
  });
  const entries = board.data?.enabled ? board.data.entries : [];

  return (
    <Stack spacing={2.5}>
      <PageHeader description={copy.ranking.description} icon={<LeaderboardOutlinedIcon />} title={copy.ranking.title} />
      {board.isPending ? (
        <Stack spacing={1.5}><SkeletonRow /><SkeletonRow /></Stack>
      ) : board.isError ? (
        <EmptyPanel description={copy.ranking.errorDescription} title={copy.ranking.errorTitle} />
      ) : entries.some((entry) => entry.rank != null) ? (
        <ClassLeaderboardTable entries={entries} />
      ) : (
        <EmptyPanel description={copy.ranking.emptyDescription} title={copy.ranking.emptyTitle} />
      )}
    </Stack>
  );
}
