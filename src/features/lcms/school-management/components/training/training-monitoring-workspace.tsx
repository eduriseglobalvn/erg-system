import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type ReactNode } from "react";
import { ErgChartCard } from "@/components/erg-mui";
import { buildTrainingMonitoringData } from "@/features/lcms/school-management/api/mock-training-monitoring";
import { trainingChartCopy } from "@/features/lcms/school-management/components/training/training-copy";
import { selectTrainingPeriod, type TrainingChartPeriod } from "@/features/lcms/school-management/components/training/training-chart-data";
import { ClassHealthChart, ScoreDistributionChart, TrainingWaveChart } from "@/features/lcms/school-management/components/training/training-charts";
import { TrainingDiagnosticPanels } from "@/features/lcms/school-management/components/training/training-diagnostic-panels";
import { TrainingInsightDrawer, type TrainingInsight } from "@/features/lcms/school-management/components/training/training-insight-drawer";
import { TrainingMonitoringTable } from "@/features/lcms/school-management/components/training/training-monitoring-table";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

const logStatus = { submitted: { label: "Đã báo giảng", color: "success" }, late: { label: "Nộp muộn", color: "warning" }, missing: { label: "Chưa báo", color: "error" } } as const;

export function TrainingMonitoringWorkspace({ school }: { school: PartnerSchool }) {
  const [tab, setTab] = useState(0);
  const [grade, setGrade] = useState("all");
  const [className, setClassName] = useState("all");
  const [insight, setInsight] = useState<TrainingInsight | null>(null);
  const [chartPeriod, setChartPeriod] = useState<TrainingChartPeriod>("12-weeks");
  const data = useMemo(() => buildTrainingMonitoringData(school), [school]);
  const summaries = data.classSummaries.filter((item) => (grade === "all" || item.grade === grade) && (className === "all" || item.className === className));
  const availableClasses = school.classes.filter((item) => grade === "all" || item.grade === grade);
  const logs = data.classLogs.filter((item) => className === "all" || item.className === className);
  const topics = data.practiceTopics.filter((item) => className === "all" || item.className === className);
  const selectedClassIds = new Set(summaries.map((item) => item.id));
  const students = data.students.filter((item) => selectedClassIds.has(item.classId));
  const assignments = data.assignments.filter((item) => selectedClassIds.has(item.classId));
  const teachers = data.teachers.filter((item) => selectedClassIds.has(item.classId));
  const chartData = selectTrainingPeriod(data.weeklyMetrics, chartPeriod);
  const averageHealth = summaries.length ? Math.round(summaries.reduce((sum, item) => sum + item.classHealth, 0) / summaries.length) : 0;
  const averageMastery = summaries.length ? Math.round(summaries.reduce((sum, item) => sum + item.studentMastery, 0) / summaries.length) : 0;
  const riskStudents = students.filter((item) => item.status !== "good").length;
  const teachersNeedReview = teachers.filter((item) => item.status !== "good").length;

  return <Box>
    <Paper variant="outlined" sx={{ mb: 1.5, overflow: "hidden" }}>
      <Box sx={{ alignItems: { xs: "stretch", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1, justifyContent: "space-between", px: 1.5, py: 1.25 }}>
        <Typography sx={{ fontWeight: 850 }}>Phạm vi</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField select size="small" value={grade} onChange={(event) => { setGrade(event.target.value); setClassName("all"); }} sx={{ minWidth: 125 }}><MenuItem value="all">Tất cả khối</MenuItem>{school.grades.map((item) => <MenuItem key={item} value={item}>Khối {item}</MenuItem>)}</TextField>
          <TextField select size="small" value={className} onChange={(event) => setClassName(event.target.value)} sx={{ minWidth: 145 }}><MenuItem value="all">Tất cả lớp</MenuItem>{availableClasses.map((item) => <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>)}</TextField>
        </Box>
      </Box>
      <Tabs onChange={(_, value: number) => setTab(value)} value={tab} variant="scrollable" scrollButtons="auto" sx={{ borderTop: "1px solid", borderColor: "divider", minHeight: 44, px: 1 }}><Tab label="Tổng quan" sx={{ minHeight: 44 }} /><Tab label={`Sổ đầu bài (${logs.length})`} sx={{ minHeight: 44 }} /><Tab label="Bảng giám sát" sx={{ minHeight: 44 }} /><Tab label="Thực hành" sx={{ minHeight: 44 }} /></Tabs>
    </Paper>

    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }, mb: 1.5 }}>
      <MetricCard color="#2563EB" icon={<AutoGraphRoundedIcon />} label="Sức khỏe lớp" value={averageHealth} />
      <MetricCard color="#059669" icon={<FactCheckRoundedIcon />} label="Năng lực học sinh" value={averageMastery} />
      <MetricCard color={riskStudents ? "error.main" : "success.main"} icon={<WarningAmberRoundedIcon />} label="Học sinh cần theo dõi" value={riskStudents} />
      <MetricCard color="#D97706" icon={<MenuBookRoundedIcon />} label="Giáo viên cần xem" value={teachersNeedReview} />
    </Box>

    {tab === 0 ? <Box sx={{ display: "grid", gap: 1.5 }}>
      <ErgChartCard
        action={<TextField onChange={(event) => setChartPeriod(event.target.value as TrainingChartPeriod)} select size="small" value={chartPeriod} sx={{ minWidth: 155 }}><MenuItem value="6-weeks">6 tuần gần nhất</MenuItem><MenuItem value="12-weeks">12 tuần gần nhất</MenuItem><MenuItem value="all">Toàn bộ dữ liệu</MenuItem></TextField>}
        bodySx={{ overflowX: { xs: "auto", md: "visible" } }}
        hideFooter
        minHeight={400}
        onOpen={() => setInsight("trend")}
        title={trainingChartCopy.wave.title}
      >
        <TrainingWaveChart data={chartData} />
      </ErgChartCard>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "repeat(2,minmax(0,1fr))" } }}>
        <ErgChartCard onOpen={() => setInsight("classification")} title={trainingChartCopy.scoreDistribution.title}><ScoreDistributionChart students={students} /></ErgChartCard>
        <ErgChartCard onOpen={() => setInsight("class-health")} title={trainingChartCopy.classHealth.title}><ClassHealthChart summaries={summaries} /></ErgChartCard>
      </Box>
      <TrainingDiagnosticPanels assignments={assignments} onOpenAssignments={() => setInsight("assignments")} onOpenTeachers={() => setInsight("teachers")} teachers={teachers} />
    </Box> : null}
    {tab === 1 ? <ClassLogTable rows={logs} /> : null}
    {tab === 2 ? <TrainingMonitoringTable schoolName={school.name} summaries={summaries} /> : null}
    {tab === 3 ? <PracticeTopicTable rows={topics} /> : null}
    <TrainingInsightDrawer assignments={assignments} classLogs={logs} insight={insight} onClose={() => setInsight(null)} students={students} summaries={summaries} teachers={teachers} />
  </Box>;
}

function MetricCard({ color, icon, label, value }: { color: string; icon: ReactNode; label: string; value: number | string }) {
  return <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}><Box sx={{ alignItems: "center", color, display: "flex", justifyContent: "space-between" }}>{icon}<Typography color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 700 }}>Tuần 12</Typography></Box><Typography sx={{ color, fontSize: 27, fontVariantNumeric: "tabular-nums", fontWeight: 900, lineHeight: 1.15, mt: 0.75 }}>{value}</Typography><Typography sx={{ fontSize: 13, fontWeight: 850, mt: 0.25 }}>{label}</Typography></Paper>;
}

function ClassLogTable({ rows }: { rows: ReturnType<typeof buildTrainingMonitoringData>["classLogs"] }) {
  return <DataPaper title="Sổ đầu bài"><TableContainer sx={{ maxHeight: 560 }}><Table size="small" stickyHeader sx={{ minWidth: 1180 }}><TableHead><TableRow><TableCell>Ngày / tiết</TableCell><TableCell>Lớp</TableCell><TableCell>Môn · giáo viên</TableCell><TableCell>Chủ đề</TableCell><TableCell>Mục tiêu tiết học</TableCell><TableCell>Sĩ số</TableCell><TableCell>Phản ánh của GV</TableCell><TableCell>Hành động tiếp theo</TableCell><TableCell align="right">Chất lượng</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => { const meta = logStatus[row.status]; return <TableRow hover key={row.id}><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 750 }}>{row.date}</Typography><Typography color="text.secondary" variant="caption">{row.period}</Typography></TableCell><TableCell sx={{ fontWeight: 800 }}>{row.className}</TableCell><TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 750 }}>{row.subject}</Typography><Typography color="text.secondary" variant="caption">{row.teacher}</Typography></TableCell><TableCell>{row.topic}</TableCell><TableCell>{row.lessonObjective}</TableCell><TableCell>{row.attendance}</TableCell><TableCell>{row.teacherReflection}</TableCell><TableCell>{row.nextAction}</TableCell><TableCell align="right" sx={{ fontWeight: 850 }}>{row.qualityScore}</TableCell><TableCell><Chip color={meta.color} label={meta.label} size="small" /></TableCell></TableRow>; })}</TableBody></Table></TableContainer></DataPaper>;
}

function PracticeTopicTable({ rows }: { rows: ReturnType<typeof buildTrainingMonitoringData>["practiceTopics"] }) {
  return <DataPaper title="Điểm thực hành"><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Chủ đề</TableCell><TableCell>Môn học</TableCell><TableCell>Lớp</TableCell><TableCell align="right">Điểm TB</TableCell><TableCell align="right">Đã hoàn thành</TableCell><TableCell align="right">Cần hỗ trợ</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow hover key={row.id}><TableCell sx={{ fontWeight: 800 }}>{row.topic}</TableCell><TableCell>{row.subject}</TableCell><TableCell>{row.className}</TableCell><TableCell align="right">{row.averageScore}</TableCell><TableCell align="right">{row.completedStudents}</TableCell><TableCell align="right"><Chip color={row.needsSupport > 3 ? "warning" : "default"} label={row.needsSupport} size="small" /></TableCell></TableRow>)}</TableBody></Table></TableContainer></DataPaper>;
}

function DataPaper({ children, title }: { children: ReactNode; title: string }) {
  return <Paper variant="outlined" sx={{ overflow: "hidden" }}><Box sx={{ borderBottom: "1px solid", borderColor: "divider", p: 1.5 }}><Typography sx={{ fontWeight: 850 }}>{title}</Typography></Box>{children}</Paper>;
}
