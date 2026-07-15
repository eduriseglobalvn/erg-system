import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import PsychologyAltRoundedIcon from "@mui/icons-material/PsychologyAltRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type {
  AssignmentTrainingSummary,
  TeacherEffectivenessSummary,
} from "@/features/lcms/school-management/types/training-monitoring-types";

const statusMeta = {
  critical: { color: "error" as const, label: "Cần xử lý" },
  good: { color: "success" as const, label: "Tốt" },
  watch: { color: "warning" as const, label: "Theo dõi" },
};

export function TrainingDiagnosticPanels({ assignments, onOpenAssignments, onOpenTeachers, teachers }: {
  assignments: AssignmentTrainingSummary[];
  onOpenAssignments: () => void;
  onOpenTeachers: () => void;
  teachers: TeacherEffectivenessSummary[];
}) {
  const riskAssignments = [...assignments].sort((left, right) => right.missingStudents - left.missingStudents || left.passRate - right.passRate).slice(0, 5);
  const teacherRows = [...teachers].sort((left, right) => left.effectivenessScore - right.effectivenessScore).slice(0, 5);

  return <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.18fr) minmax(380px,.82fr)" } }}>
    <DiagnosticPaper
      actionLabel="Xem bài tập"
      icon={<AssignmentLateRoundedIcon />}
      onAction={onOpenAssignments}
      title="Bài tập cần xem"
    >
      <TableContainer sx={{ maxHeight: 360 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Bài tập</TableCell><TableCell>Lớp</TableCell><TableCell align="right">Đạt</TableCell><TableCell align="right">Chưa làm</TableCell><TableCell align="right">Lượt thử</TableCell><TableCell align="right">Thời lượng</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>{riskAssignments.map((assignment) => { const meta = statusMeta[assignment.status]; return <TableRow hover key={assignment.id}><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{assignment.title}</Typography><Typography color="text.secondary" variant="caption">{assignment.subject}</Typography></TableCell><TableCell sx={{ fontWeight: 750 }}>{assignment.className}</TableCell><TableCell align="right"><Typography color={assignment.passRate < 65 ? "error.main" : "text.primary"} sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{assignment.passRate}%</Typography></TableCell><TableCell align="right"><Typography color={assignment.missingStudents ? "error.main" : "text.primary"} sx={{ fontWeight: 800 }}>{assignment.missingStudents}</Typography></TableCell><TableCell align="right">{assignment.medianAttempts}</TableCell><TableCell align="right">{assignment.medianDurationMinutes} phút</TableCell><TableCell><Chip color={meta.color} label={meta.label} size="small" variant="outlined" /></TableCell></TableRow>; })}</TableBody></Table></TableContainer>
    </DiagnosticPaper>

    <DiagnosticPaper
      actionLabel="Xem giáo viên"
      icon={<PsychologyAltRoundedIcon />}
      onAction={onOpenTeachers}
      title="Năng lực giáo viên"
    >
      <Box sx={{ display: "grid", gap: 1.25, p: 1.5 }}>{teacherRows.map((teacher) => { const meta = statusMeta[teacher.status]; return <Box key={teacher.id} sx={{ display: "grid", gap: 0.65 }}><Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 12.5, fontWeight: 850 }}>{teacher.teacher}</Typography><Typography color="text.secondary" variant="caption">{teacher.className} · {teacher.evidenceCount} bằng chứng</Typography></Box><Box sx={{ alignItems: "center", display: "flex", gap: 1 }}><Typography sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 900 }}>{teacher.effectivenessScore}</Typography><Chip color={meta.color} label={meta.label} size="small" variant="outlined" /></Box></Box><LinearProgress color={teacher.status === "critical" ? "error" : teacher.status === "watch" ? "warning" : "success"} sx={{ borderRadius: 4, height: 6 }} value={teacher.effectivenessScore} variant="determinate" /></Box>; })}</Box>
    </DiagnosticPaper>
  </Box>;
}

function DiagnosticPaper({ actionLabel, children, icon, onAction, title }: {
  actionLabel: string;
  children: ReactNode;
  icon: ReactNode;
  onAction: () => void;
  title: string;
}) {
  return <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}><Box sx={{ alignItems: "center", borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 1.25, justifyContent: "space-between", px: 2, py: 1.5 }}><Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}><Box sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 1.25, color: "text.secondary", display: "flex", height: 36, justifyContent: "center", width: 36 }}>{icon}</Box><Typography sx={{ fontSize: 14, fontWeight: 850 }}>{title}</Typography></Box><Button endIcon={<ArrowForwardRoundedIcon />} onClick={onAction} size="small" sx={{ flexShrink: 0 }}>{actionLabel}</Button></Box>{children}</Paper>;
}
