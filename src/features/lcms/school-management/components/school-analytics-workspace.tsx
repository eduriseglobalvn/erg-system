import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ScoreboardRoundedIcon from "@mui/icons-material/ScoreboardRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export function SchoolAnalyticsWorkspace({ school }: { school: PartnerSchool }) {
  const summary = summarizeSchool(school);

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* Top Banner Toolbar */}
      <Paper
        elevation={0}
        sx={{
          alignItems: { xs: "flex-start", md: "center" },
          bgcolor: "#FFFFFF",
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          justifyContent: "space-between",
          p: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
            Báo cáo vận hành theo trường
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.825rem", mt: 0.35 }}>
            Các chỉ số dưới đây lấy trực tiếp từ schoolOperations và chịu scope của phiên quản trị backend.
          </Typography>
        </Box>
        <Button
          onClick={() => downloadSchoolSummary(school, summary)}
          startIcon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />}
          variant="outlined"
          sx={{
            bgcolor: "#FFFFFF",
            borderColor: "rgba(0, 0, 0, 0.12)",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            color: ergEnterpriseTokens.color.text,
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            px: 2,
            py: 0.85,
            textTransform: "none",
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.03)",
              borderColor: "rgba(0, 0, 0, 0.22)",
            },
            "&:active": {
              transform: "scale(0.985)",
            },
          }}
        >
          Xuất tóm tắt CSV
        </Button>
      </Paper>

      {/* 4 Apple KPI Cards */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}>
        <AnalyticsMetricCard
          detail="Số lượng do backend trả về"
          icon={<GroupsRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.primary, 0.08)}
          iconColor={ergEnterpriseTokens.color.primary}
          label="Học sinh"
          value={summary.studentCount}
        />
        <AnalyticsMetricCard
          detail="Lớp trong scope hiện tại"
          icon={<ClassRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg="rgba(175, 82, 222, 0.12)"
          iconColor="#7E22CE"
          label="Lớp học"
          value={summary.classCount}
        />
        <AnalyticsMetricCard
          detail="Môn đã được cấu hình"
          icon={<MenuBookRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.success, 0.12)}
          iconColor="#15803D"
          label="Môn học"
          value={summary.subjectCount}
        />
        <AnalyticsMetricCard
          detail={summary.averageScore === null ? "Backend chưa trả điểm" : `${summary.scoredStudentCount} học sinh có điểm`}
          icon={<ScoreboardRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.warning, 0.12)}
          iconColor="#B45309"
          label="Điểm trung bình"
          value={summary.averageScore === null ? "-" : `${summary.averageScore}%`}
        />
      </Box>

      {/* Alert Banner */}
      {summary.atRiskCount > 0 ? (
        <Alert
          severity="warning"
          sx={{
            bgcolor: alpha(ergEnterpriseTokens.color.warning, 0.09),
            border: `1px solid ${alpha(ergEnterpriseTokens.color.warning, 0.22)}`,
            borderRadius: "12px",
            color: "#B45309",
            fontWeight: 550,
            "& .MuiAlert-icon": { color: ergEnterpriseTokens.color.warning },
          }}
        >
          Có {summary.atRiskCount} học sinh đang có trạng thái cần theo dõi theo dữ liệu backend. Hãy mở workspace học sinh để xử lý.
        </Alert>
      ) : (
        <Alert
          severity="success"
          sx={{
            bgcolor: alpha(ergEnterpriseTokens.color.success, 0.09),
            border: `1px solid ${alpha(ergEnterpriseTokens.color.success, 0.22)}`,
            borderRadius: "12px",
            color: "#15803D",
            fontWeight: 550,
            "& .MuiAlert-icon": { color: ergEnterpriseTokens.color.success },
          }}
        >
          Không có học sinh ở trạng thái cần theo dõi trong dữ liệu đã tải.
        </Alert>
      )}

      {/* Class Distribution Table Surface */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`, p: 2 }}>
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
            Phân bổ lớp học
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", mt: 0.25 }}>
            Sĩ số và giáo viên chủ nhiệm của từng lớp theo dữ liệu hệ thống
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Lớp</TableCell>
                <TableCell sx={headerCellSx}>Khối</TableCell>
                <TableCell align="right" sx={headerCellSx}>Số học sinh</TableCell>
                <TableCell sx={headerCellSx}>Giáo viên chủ nhiệm</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {school.classes.map((classroom) => (
                <TableRow
                  hover
                  key={classroom.id}
                  sx={{
                    transition: "background-color 0.12s ease",
                    "&:hover": { bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.035)} !important` },
                  }}
                >
                  <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.4 }}>
                    <Box
                      sx={{
                        bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                        borderRadius: "6px",
                        color: ergEnterpriseTokens.color.primary,
                        display: "inline-block",
                        fontSize: "0.825rem",
                        fontWeight: 600,
                        px: 1,
                        py: 0.3,
                      }}
                    >
                      {classroom.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", color: ergEnterpriseTokens.color.text, fontSize: "0.825rem", fontWeight: 600, py: 1.4 }}>
                    {classroom.grade ? `Khối ${classroom.grade}` : "-"}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.4 }}>
                    <Box
                      sx={{
                        bgcolor: "rgba(0, 0, 0, 0.04)",
                        borderRadius: "9999px",
                        color: ergEnterpriseTokens.color.text,
                        display: "inline-block",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        lineHeight: 1,
                        px: 1.25,
                        py: 0.4,
                      }}
                    >
                      {classroom.studentCount}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", color: classroom.homeroomTeacher ? ergEnterpriseTokens.color.text : ergEnterpriseTokens.color.textMuted, fontSize: "0.825rem", fontWeight: classroom.homeroomTeacher ? 600 : 400, fontStyle: classroom.homeroomTeacher ? "normal" : "italic", py: 1.4 }}>
                    {classroom.homeroomTeacher || "Chưa gán"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!school.classes.length ? (
          <Typography color="text.secondary" sx={{ p: 4, textAlign: "center" }} variant="body2">
            Backend chưa trả danh sách lớp cho scope này.
          </Typography>
        ) : null}
      </Paper>
    </Box>
  );
}

const headerCellSx = {
  bgcolor: "rgba(250, 250, 252, 0.96)",
  borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
  color: ergEnterpriseTokens.color.textMuted,
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  py: 1.35,
  textTransform: "uppercase",
};

export type SchoolSummary = {
  atRiskCount: number;
  averageScore: number | null;
  classCount: number;
  scoredStudentCount: number;
  studentCount: number;
  subjectCount: number;
};

export function summarizeSchool(school: PartnerSchool): SchoolSummary {
  const scores = school.students
    .map((student) => student.averageScore)
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  return {
    atRiskCount: school.students.filter((student) => student.status === "at-risk").length,
    averageScore: scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : null,
    classCount: school.classCount ?? school.classes.length,
    scoredStudentCount: scores.length,
    studentCount: school.studentCount ?? school.students.length,
    subjectCount: school.subjects.length,
  };
}

export function buildSchoolSummaryCsv(school: PartnerSchool, summary = summarizeSchool(school)) {
  const rows = [
    ["metric", "value"],
    ["schoolId", school.id],
    ["schoolName", school.name],
    ["studentCount", summary.studentCount],
    ["classCount", summary.classCount],
    ["subjectCount", summary.subjectCount],
    ["averageScore", summary.averageScore ?? ""],
    ["atRiskCount", summary.atRiskCount],
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

function downloadSchoolSummary(school: PartnerSchool, summary: SchoolSummary) {
  const blob = new Blob([buildSchoolSummaryCsv(school, summary)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `erg-school-summary-${school.id}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AnalyticsMetricCard({
  detail,
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  detail: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
        p: 2.25,
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>
          {label}
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: iconBg,
            borderRadius: "10px",
            color: iconColor,
            display: "flex",
            height: 32,
            justifyContent: "center",
            width: 32,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Box
        sx={{
          bgcolor: "rgba(0, 0, 0, 0.04)",
          borderRadius: "6px",
          color: ergEnterpriseTokens.color.textMuted,
          display: "inline-block",
          fontSize: "0.7rem",
          fontWeight: 600,
          mt: 0.75,
          px: 1,
          py: 0.25,
        }}
      >
        {detail}
      </Box>
    </Paper>
  );
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return text.includes(",") || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text;
}
