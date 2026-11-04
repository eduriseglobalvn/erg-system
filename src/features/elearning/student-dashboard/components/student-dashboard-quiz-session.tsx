import { useEffect } from "react";
import { toast } from "sonner";
import { useIsStudentPreview } from "@/platform/auth/hooks/use-student-preview";
import ArrowLeft from "@mui/icons-material/ArrowBackRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { PlayerShell } from "@/features/lcms/quiz/player/player-shell";
import { MUI_BG, MUI_TEXT } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentQuizAssignmentMissing({ onBack }: { onBack: () => void }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: MUI_BG, p: 3 }}>
      <Box sx={{ maxWidth: 520, width: "100%", bgcolor: "#fff", border: "1px solid rgba(16,24,40,0.1)", borderRadius: 3, p: 3, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Không tìm thấy bài được giao</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Bài này không còn trong dữ liệu tài khoản hiện tại. Không thể mở bằng một bài khác.
        </Typography>
        <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={onBack}>
          Quay lại bảng học tập
        </Button>
      </Box>
    </Box>
  );
}

export function StudentQuizNotReady({ assignment, onBack }: { assignment: StudentDashboardAssignment; onBack: () => void }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: MUI_BG, p: 3 }}>
      <Box sx={{ maxWidth: 560, width: "100%", bgcolor: "#fff", border: "1px solid rgba(16,24,40,0.1)", borderRadius: 3, p: 3, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Assessment chưa sẵn sàng</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Backend chưa trả về quiz gắn với “{assignment.title}”. Hệ thống không tự suy đoán quiz từ assignment id.
        </Typography>
        <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={onBack}>
          Quay lại bảng học tập
        </Button>
      </Box>
    </Box>
  );
}

export function StudentQuizSession({
  assignment,
  copy,
  onBack,
  runtimePortal,
}: {
  assignment: StudentDashboardAssignment;
  copy: DashboardCopy;
  onBack: () => void;
  runtimePortal: "lms" | "elearning";
}) {
  // Preview: reuse the offline player (local grading) so no server attempt is created or submitted.
  const preview = useIsStudentPreview();
  useEffect(() => {
    if (preview) toast.info("Chế độ xem thử: bài làm không được nộp.");
  }, [preview]);
  const subjectLabel = assignment.subjectLabel ?? "Chưa có môn học";
  const teacherName = assignment.teacherName ?? "Chưa có giáo viên";
  const subtitle = assignment.subtitle ?? "Chưa có mô tả";
  const lastActivityLabel = assignment.lastActivityLabel ?? "Chưa có hoạt động";
  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        bgcolor: "#f3f6ff",
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(246,248,255,0.88)), url('https://media.erg.edu.vn/logo/bg.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        color: MUI_TEXT,
        fontFamily: "var(--font-app)",
      }}
    >
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.72)",
          borderBottom: "1px solid rgba(0,0,136,0.08)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 10px 34px rgba(0,0,136,0.05)",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 48, md: 46 }, gap: { xs: 1, md: 1.5 }, px: { xs: 1.25, md: 2 } }}>
          <Button
            size="small"
            startIcon={<ArrowLeft sx={{ fontSize: 18 }} />}
            variant="outlined"
            onClick={onBack}
            sx={{
              bgcolor: "rgba(255,255,255,0.64)",
              borderColor: "rgba(0,0,136,0.14)",
              borderRadius: 2,
              color: "#000088",
              fontWeight: 600,
              minHeight: 34,
              px: 1.35,
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.86)",
                borderColor: "rgba(232,40,40,0.22)",
              },
            }}
          >
            {copy.backToDashboard}
          </Button>
          <Box sx={{ minWidth: 0, flex: 1, textAlign: "right" }}>
            <Typography noWrap variant="subtitle2" sx={{ color: "#000088", fontSize: { xs: 12, md: 13 }, fontWeight: 600, lineHeight: 1.2 }}>
              {assignment.title}
            </Typography>
            <Typography noWrap variant="caption" sx={{ color: "rgba(28,37,46,0.62)", display: { xs: "none", md: "block" }, lineHeight: 1.15 }}>
              {copy.sessionDescription(subjectLabel, teacherName, assignment.dueLabel)}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ height: { md: "calc(100vh - 46px)" }, overflow: "hidden", px: { xs: 0.75, md: 1 }, py: { xs: 0.75, md: 0.75 } }}>
        <PlayerShell
          assignmentId={assignment.id}
          quizId={assignment.quizId}
          portableOffline={preview}
          runtimePortal={runtimePortal}
          welcomeMeta={{
            authorName: teacherName,
            courseLabel: assignment.title,
            dueLabel: assignment.dueLabel,
            reviewContent: subtitle,
            subjectLabel,
            topics: [subjectLabel, assignment.statusLabel, lastActivityLabel],
          }}
        />
      </Box>
    </Box>
  );
}
