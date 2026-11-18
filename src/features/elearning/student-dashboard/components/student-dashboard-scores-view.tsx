import GradeOutlined from "@mui/icons-material/GradeOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { filterAssignments } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import { SubmittedBoard } from "@/features/elearning/student-dashboard/components/student-assignment-submitted";
import type { StudentDashboardAssignment, StudentDashboardProfile } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { submittedStats } from "@/features/elearning/student-dashboard/utils/assignment-board";
import { serverAverageTen } from "@/features/elearning/student-dashboard/utils/student-overview-hero";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/**
 * "Điểm số" (BUG-UI-001): the handed-in assignments on the 10-point scale; same board as the "Đã nộp" tab.
 * The average is the server's (every assignment); the list is the loaded page, with "Tải thêm" while more exist.
 * A failed load shows the page-level alert with "Thử lại" (runtime), so this view only avoids a false "Chưa có điểm".
 */
export function ScoresView({ assignments, failed, hasMore, loading, loadingMore, mobile, profile, onLoadMore, onOpenAssignment }: {
  assignments: StudentDashboardAssignment[];
  failed: boolean;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  mobile: boolean;
  profile: Pick<StudentDashboardProfile, "averageScore" | "completedAssignments">;
  onLoadMore: () => void;
  onOpenAssignment: (assignmentId: string) => void;
}) {
  const submitted = filterAssignments(assignments, "submitted");
  const { count } = submittedStats(submitted);
  // The server reports 0 (not null) while every hand-in still waits for marking: trust it only once a score is on screen or more pages remain.
  const average = count > 0 || hasMore ? serverAverageTen(profile) : null;
  const lead = average
    ? `${average.count} bài đã có điểm · thang 10`
    : `${hasMore ? `${count} bài gần nhất` : `${count} bài đã có điểm`} · thang 10`;
  const pending = loading && !submitted.length;
  return (
    <Stack spacing={mobile ? 2 : 3}>
      <Box>
        <Typography component="h1" sx={mobile ? undefined : t.type.pageTitle} variant="h1">Điểm số</Typography>
        {pending || (failed && !submitted.length) ? null : <Typography color="text.secondary" sx={{ ...t.type.pageLead, mt: 0.5 }}>{lead}</Typography>}
      </Box>
      {submitted.length ? (
        <SubmittedBoard average={average} items={submitted} mobile={mobile} onOpen={onOpenAssignment} />
      ) : pending ? (
        <ErgLoadingSkeleton rows={4} />
      ) : failed || hasMore ? null : (
        <ErgEmptyState description="Nộp bài xong, điểm của em sẽ hiện ở đây." icon={<GradeOutlined />} title="Chưa có điểm" />
      )}
      {/* The handed-in ones can sit past the first page, so "Tải thêm" shows even with none loaded yet. */}
      {hasMore ? <ErgButton loading={loadingMore} onClick={onLoadMore} sx={{ alignSelf: "center" }} variant="text">Tải thêm</ErgButton> : null}
    </Stack>
  );
}
