import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import type { AttendanceSheetController } from "./use-attendance-sheet-controller";

export function AttendanceCurriculumTable({ controller }: { controller: AttendanceSheetController }) {
  return (
    <Box sx={{ minHeight: 0 }}>
      {controller.teachingPlanLoading ? <Alert severity="info" sx={{ mb: 1.5 }}>Đang tải lịch dạy…</Alert> : null}
      {/* Setup guidance is for admins only; teachers just see the table without a lesson highlight. */}
      {controller.teachingPlanMissing && controller.isAdmin ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Chưa cấu hình lịch dạy cho trường, môn và năm học này. Thiết lập trong Cấu trúc môn học.
        </Alert>
      ) : null}
      <Table size="small" sx={{ "& td, & th": { border: 1, borderColor: "divider", px: 1, py: 0.75 } }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ width: "27%" }}>Chủ đề</TableCell>
            <TableCell align="center" sx={{ width: 56 }}>Tiết</TableCell>
            <TableCell>Tên bài học</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {controller.curriculumProgram.map((item, index) => {
            const isCurrent = Boolean(controller.teachingPlan) && item.period === controller.taughtLessonCount;
            const isDone = Boolean(controller.teachingPlan) && item.period < controller.taughtLessonCount;
            const showTopicCell = controller.curriculumTopicSpans.firstRows.get(item.topic) === index;
            return (
              <TableRow
                aria-current={isCurrent ? "true" : undefined}
                key={item.period}
                sx={{ bgcolor: isCurrent ? "primary.light" : isDone ? "action.hover" : "background.paper" }}
              >
                {showTopicCell ? (
                  <TableCell rowSpan={controller.curriculumTopicSpans.counts.get(item.topic)} sx={{ typography: "body2", fontWeight: "fontWeightMedium" }}>
                    {item.topic}
                  </TableCell>
                ) : null}
                <TableCell
                  align="center"
                  sx={isCurrent ? { bgcolor: "primary.main", color: "primary.contrastText", fontWeight: "fontWeightBold" } : undefined}
                >
                  {item.period}
                </TableCell>
                <TableCell sx={isCurrent ? { fontWeight: "fontWeightMedium" } : undefined}>{item.title}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
