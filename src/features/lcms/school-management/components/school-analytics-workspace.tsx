import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolAnalyticsWorkspace({ school }: { school: PartnerSchool }) {
  const summary = summarizeSchool(school);
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Paper variant="outlined" sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", p: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Báo cáo vận hành theo trường</Typography>
          <Typography color="text.secondary" variant="body2">Các chỉ số dưới đây lấy trực tiếp từ schoolOperations và chịu scope của phiên quản trị backend.</Typography>
        </Box>
        <Button startIcon={<DownloadRoundedIcon />} variant="outlined" onClick={() => downloadSchoolSummary(school, summary)}>Xuất tóm tắt CSV</Button>
      </Paper>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" } }}>
        <Metric label="Học sinh" value={summary.studentCount} detail="Số lượng do backend trả về" />
        <Metric label="Lớp học" value={summary.classCount} detail="Lớp trong scope hiện tại" />
        <Metric label="Môn học" value={summary.subjectCount} detail="Môn đã được cấu hình" />
        <Metric label="Điểm trung bình" value={summary.averageScore === null ? "-" : `${summary.averageScore}%`} detail={summary.averageScore === null ? "Backend chưa trả điểm" : `${summary.scoredStudentCount} học sinh có điểm`} />
      </Box>
      {summary.atRiskCount > 0 ? <Alert severity="warning">Có {summary.atRiskCount} học sinh đang có trạng thái cần theo dõi theo dữ liệu backend. Hãy mở workspace học sinh để xử lý.</Alert> : <Alert severity="success">Không có học sinh ở trạng thái cần theo dõi trong dữ liệu đã tải.</Alert>}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}>
          <Typography sx={{ fontWeight: 850 }}>Phân bổ lớp học</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Lớp</TableCell><TableCell>Khối</TableCell><TableCell align="right">Số học sinh</TableCell><TableCell>Giáo viên chủ nhiệm</TableCell></TableRow></TableHead>
            <TableBody>{school.classes.map((classroom) => <TableRow hover key={classroom.id}><TableCell sx={{ fontWeight: 750 }}>{classroom.name}</TableCell><TableCell>{classroom.grade || "-"}</TableCell><TableCell align="right">{classroom.studentCount}</TableCell><TableCell>{classroom.homeroomTeacher || "-"}</TableCell></TableRow>)}</TableBody>
          </Table>
        </TableContainer>
        {!school.classes.length ? <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }} variant="body2">Backend chưa trả danh sách lớp cho scope này.</Typography> : null}
      </Paper>
    </Box>
  );
}

export type SchoolSummary = {
  atRiskCount: number;
  averageScore: number | null;
  classCount: number;
  scoredStudentCount: number;
  studentCount: number;
  subjectCount: number;
};

export function summarizeSchool(school: PartnerSchool): SchoolSummary {
  const scores = school.students.map((student) => student.averageScore).filter((score): score is number => typeof score === "number" && Number.isFinite(score));
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

function Metric({ detail, label, value }: { detail: string; label: string; value: number | string }) {
  return <Paper variant="outlined" sx={{ p: 1.75 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, mt: 0.4 }}>{value}</Typography><Chip label={detail} size="small" sx={{ mt: 1 }} variant="outlined" /></Paper>;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
