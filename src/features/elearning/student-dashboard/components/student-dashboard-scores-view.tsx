import GradeOutlined from "@mui/icons-material/GradeOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { filterAssignments } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import { SubmittedBoard } from "@/features/elearning/student-dashboard/components/student-assignment-submitted";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { submittedStats } from "@/features/elearning/student-dashboard/utils/assignment-board";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** "Điểm số" (BUG-UI-001): the handed-in assignments on the 10-point scale; same board as the "Đã nộp" tab. */
export function ScoresView({ assignments, mobile, onOpenAssignment }: { assignments: StudentDashboardAssignment[]; mobile: boolean; onOpenAssignment: (assignmentId: string) => void }) {
  const submitted = filterAssignments(assignments, "submitted");
  const { count } = submittedStats(submitted);
  return (
    <Stack spacing={mobile ? 2 : 3}>
      <Box>
        <Typography component="h1" sx={mobile ? undefined : t.type.pageTitle} variant="h1">Điểm số</Typography>
        <Typography color="text.secondary" sx={{ ...t.type.pageLead, mt: 0.5 }}>{count} bài đã có điểm · thang 10</Typography>
      </Box>
      {submitted.length ? (
        <SubmittedBoard items={submitted} mobile={mobile} onOpen={onOpenAssignment} />
      ) : (
        <ErgEmptyState description="Nộp bài xong, điểm của em sẽ hiện ở đây." icon={<GradeOutlined />} title="Chưa có điểm" />
      )}
    </Stack>
  );
}
