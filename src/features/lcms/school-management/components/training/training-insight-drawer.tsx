import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import type {
  AssignmentTrainingSummary,
  ClassLogEntry,
  ClassTrainingSummary,
  StudentTrainingInsight,
  TeacherEffectivenessSummary,
} from "@/features/lcms/school-management/types/training-monitoring-types";

export type TrainingInsight = "trend" | "classification" | "class-health" | "class-log" | "assignments" | "students" | "teachers";

const titles: Record<TrainingInsight, string> = {
  assignments: "Bằng chứng từ bài tập",
  classification: "Phân loại kết quả học sinh",
  "class-health": "Sức khỏe đào tạo từng lớp",
  "class-log": "Chất lượng sổ đầu bài",
  students: "Học sinh cần theo dõi",
  teachers: "Hồ sơ năng lực giáo viên",
  trend: "Bằng chứng tạo nên xu hướng",
};

const statusMeta = {
  critical: { color: "error" as const, label: "Cần xử lý" },
  good: { color: "success" as const, label: "Tốt" },
  watch: { color: "warning" as const, label: "Theo dõi" },
};

export function TrainingInsightDrawer({ assignments = [], classLogs = [], insight, onClose, students = [], summaries, teachers = [] }: {
  assignments?: AssignmentTrainingSummary[];
  classLogs?: ClassLogEntry[];
  insight: TrainingInsight | null;
  onClose: () => void;
  students?: StudentTrainingInsight[];
  summaries: ClassTrainingSummary[];
  teachers?: TeacherEffectivenessSummary[];
}) {
  return <Drawer anchor="right" open={Boolean(insight)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", md: 820 } } } }}>
    {insight ? <InsightContent assignments={assignments} classLogs={classLogs} insight={insight} key={insight} onClose={onClose} students={students} summaries={summaries} teachers={teachers} /> : null}
  </Drawer>;
}

function InsightContent({ assignments, classLogs, insight, onClose, students, summaries, teachers }: {
  assignments: AssignmentTrainingSummary[];
  classLogs: ClassLogEntry[];
  insight: TrainingInsight;
  onClose: () => void;
  students: StudentTrainingInsight[];
  summaries: ClassTrainingSummary[];
  teachers: TeacherEffectivenessSummary[];
}) {
  const initialTab = insight === "students" ? 1 : insight === "assignments" ? 2 : insight === "class-log" ? 3 : insight === "teachers" ? 4 : 0;
  const [tab, setTab] = useState(initialTab);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  return <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <Box sx={{ alignItems: "flex-start", borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", p: 2.5 }}><Box><Typography color="primary.main" sx={{ fontSize: 11.5, fontWeight: 850 }}>PHÒNG ĐÀO TẠO · DRILL-DOWN BẰNG CHỨNG</Typography><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{titles[insight]}</Typography><Typography color="text.secondary" variant="body2">Mở từng lớp, học sinh, bài tập hoặc báo giảng để tìm nguyên nhân của chỉ số.</Typography></Box><IconButton aria-label="Đóng thống kê" onClick={onClose}><CloseRoundedIcon /></IconButton></Box>
    <Tabs onChange={(_, value: number) => setTab(value)} scrollButtons="auto" value={tab} variant="scrollable" sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1 }}><Tab label={`Lớp (${summaries.length})`} /><Tab label={`Học sinh (${students.length})`} /><Tab label={`Bài tập (${assignments.length})`} /><Tab label={`Sổ đầu bài (${classLogs.length})`} /><Tab label={`Giáo viên (${teachers.length})`} /></Tabs>
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
      {tab === 0 ? <ClassEvidenceTable rows={summaries} /> : null}
      {tab === 1 ? <><StudentEvidenceTable onSelect={setSelectedStudentId} rows={students} selectedStudentId={selectedStudentId} />{selectedStudent ? <AttemptEvidenceTable student={selectedStudent} /> : null}</> : null}
      {tab === 2 ? <AssignmentEvidenceTable rows={assignments} /> : null}
      {tab === 3 ? <ClassLogEvidenceTable rows={classLogs} /> : null}
      {tab === 4 ? <TeacherEvidenceTable rows={teachers} /> : null}
    </Box>
  </Box>;
}

function ClassEvidenceTable({ rows }: { rows: ClassTrainingSummary[] }) {
  return <EvidenceTable headers={["Lớp", "Giáo viên", "Sức khỏe", "Năng lực", "Tham gia", "Giảng dạy", "Rủi ro", "Phân loại"]}>{rows.map((item) => { const meta = statusMeta[item.status]; return <TableRow hover key={item.id}><TableCell sx={{ fontWeight: 850 }}>{item.className}</TableCell><TableCell>{item.teacher}</TableCell><TableCell align="right" sx={{ fontWeight: 900 }}>{item.classHealth}</TableCell><TableCell align="right">{item.studentMastery}</TableCell><TableCell align="right">{item.learningEngagement}</TableCell><TableCell align="right">{item.teachingDelivery}</TableCell><TableCell align="right">{item.riskStudentCount}</TableCell><TableCell><Chip color={meta.color} label={meta.label} size="small" /></TableCell></TableRow>; })}</EvidenceTable>;
}

function StudentEvidenceTable({ onSelect, rows, selectedStudentId }: { onSelect: (id: string) => void; rows: StudentTrainingInsight[]; selectedStudentId: string | null }) {
  return <EvidenceTable headers={["Học sinh", "Lớp", "Điểm", "Hoàn thành", "Lượt làm", "Tổng phút", "Quá giờ", "Chi tiết"]}>{rows.map((student) => <TableRow hover key={student.id} selected={student.id === selectedStudentId}><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>{student.fullName}</Typography><Typography color="text.secondary" variant="caption">{student.studentCode}</Typography></TableCell><TableCell>{student.className}</TableCell><TableCell align="right">{student.averageScore}</TableCell><TableCell align="right">{student.completedAssignments}/{student.assignmentCount}</TableCell><TableCell align="right">{student.totalAttempts}</TableCell><TableCell align="right">{student.totalMinutes}</TableCell><TableCell align="right"><Chip color={student.overtimeAttempts ? "warning" : "default"} label={student.overtimeAttempts} size="small" /></TableCell><TableCell><Button onClick={() => onSelect(student.id)} size="small">Xem lượt làm</Button></TableCell></TableRow>)}</EvidenceTable>;
}

function AttemptEvidenceTable({ student }: { student: StudentTrainingInsight }) {
  return <Box sx={{ mt: 2 }}><Typography sx={{ fontSize: 13, fontWeight: 850, mb: 1 }}>Từng lần làm · {student.fullName}</Typography><EvidenceTable headers={["Bài tập", "Lần", "Điểm", "Thời lượng", "Giới hạn", "Nộp lúc", "Trạng thái"]}>{student.attempts.map((attempt) => <TableRow key={attempt.id}><TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{attempt.assignmentId.split("-assignment-").pop()}</TableCell><TableCell align="right">{attempt.attemptNumber}</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>{attempt.score / 10}</TableCell><TableCell align="right">{attempt.durationMinutes} phút</TableCell><TableCell align="right">{attempt.timeLimitMinutes} phút</TableCell><TableCell>{attempt.submittedAt}</TableCell><TableCell><Chip color={attempt.status === "passed" ? "success" : attempt.status === "overtime" ? "warning" : "error"} label={attempt.status === "passed" ? "Đạt" : attempt.status === "overtime" ? "Quá giờ" : "Chưa đạt"} size="small" /></TableCell></TableRow>)}</EvidenceTable></Box>;
}

function AssignmentEvidenceTable({ rows }: { rows: AssignmentTrainingSummary[] }) {
  return <EvidenceTable headers={["Bài tập", "Lớp", "Đạt", "Chưa làm", "Lượt thử", "Phút/lần", "Quá giờ", "Hạn nộp"]}>{rows.map((item) => <TableRow hover key={item.id}><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>{item.title}</Typography><Typography color="text.secondary" variant="caption">{item.subject}</Typography></TableCell><TableCell>{item.className}</TableCell><TableCell align="right">{item.passRate}%</TableCell><TableCell align="right" sx={{ color: item.missingStudents ? "error.main" : "text.primary", fontWeight: 800 }}>{item.missingStudents}</TableCell><TableCell align="right">{item.medianAttempts}</TableCell><TableCell align="right">{item.medianDurationMinutes}</TableCell><TableCell align="right">{item.overtimeStudents}</TableCell><TableCell>{item.dueAt}</TableCell></TableRow>)}</EvidenceTable>;
}

function ClassLogEvidenceTable({ rows }: { rows: ClassLogEntry[] }) {
  return <EvidenceTable headers={["Ngày / lớp", "Môn · giáo viên", "Mục tiêu", "Phản ánh", "Hành động tiếp", "Chất lượng", "Trạng thái"]}>{rows.map((log) => <TableRow hover key={log.id}><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{log.date} · {log.className}</Typography><Typography color="text.secondary" variant="caption">{log.period}</Typography></TableCell><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 750 }}>{log.subject}</Typography><Typography color="text.secondary" variant="caption">{log.teacher}</Typography></TableCell><TableCell>{log.lessonObjective}</TableCell><TableCell>{log.teacherReflection}</TableCell><TableCell>{log.nextAction}</TableCell><TableCell align="right">{log.qualityScore}</TableCell><TableCell><Chip color={log.status === "submitted" ? "success" : log.status === "late" ? "warning" : "error"} label={log.status === "submitted" ? "Đúng hạn" : log.status === "late" ? "Nộp muộn" : "Chưa báo"} size="small" /></TableCell></TableRow>)}</EvidenceTable>;
}

function TeacherEvidenceTable({ rows }: { rows: TeacherEffectivenessSummary[] }) {
  return <EvidenceTable headers={["Giáo viên", "Lớp", "Sổ đầu bài", "Tiến độ", "Tăng trưởng", "Can thiệp", "Phản tư", "Tổng"]}>{rows.map((teacher) => <TableRow hover key={teacher.id}><TableCell sx={{ fontWeight: 850 }}>{teacher.teacher}</TableCell><TableCell>{teacher.className}</TableCell><TableCell align="right">{teacher.classLogQuality}</TableCell><TableCell align="right">{teacher.curriculumProgress}</TableCell><TableCell align="right">{teacher.studentGrowth}</TableCell><TableCell align="right">{teacher.interventionImpact}</TableCell><TableCell align="right">{teacher.reflectionQuality}</TableCell><TableCell align="right" sx={{ fontWeight: 900 }}>{teacher.effectivenessScore}</TableCell></TableRow>)}</EvidenceTable>;
}

function EvidenceTable({ children, headers }: { children: ReactNode; headers: string[] }) {
  return <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, maxHeight: 480 }}><Table size="small" stickyHeader><TableHead><TableRow>{headers.map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead><TableBody>{children}</TableBody></Table></TableContainer>;
}
