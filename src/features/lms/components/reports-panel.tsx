import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import {
  ErgChartContainer,
  ErgChartTooltip,
  ErgChartTooltipContent,
  type ErgChartConfig,
} from "@/components/erg-mui/charts/erg-chart";
import { ergChartPalette } from "@/components/erg-mui/charts/erg-chart-theme";
import {
  buildSubmissionTrend,
  filterRunsByPeriod,
  studentsNeedingSupport,
  type ReportPeriod,
} from "@/features/lms/components/reports-panel-data";
import type { AssignmentRun, ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";

interface ReportsPanelProps {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  classes?: ClassroomSnapshot[];
  runs?: AssignmentRun[];
  students?: ClassroomStudent[];
  onClassChange?: (classId: string) => void;
}

const chartConfig = { completionRate: { color: ergChartPalette.blue, label: "Hoàn thành (%)" } } satisfies ErgChartConfig;
const periodOptions = [
  { label: "7 ngày qua", value: "7" },
  { label: "30 ngày qua", value: "30" },
  { label: "Tất cả", value: "all" },
];

export function ReportsPanel({ selectedClass, selectedSchoolName, classes = [], runs = [], students = [], onClassChange }: ReportsPanelProps) {
  const [period, setPeriod] = useState<ReportPeriod>("30");
  const trend = useMemo(() => buildSubmissionTrend(filterRunsByPeriod(runs, period)), [period, runs]);
  const supportList = useMemo(() => studentsNeedingSupport(students), [students]);

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3 } }}>
      <ErgPageHeader
        description={[selectedSchoolName, selectedClass?.className].filter(Boolean).join(" · ")}
        title="Báo cáo lớp"
      />
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 240px))" }, mb: 2 }}>
        {classes.length > 0 && onClassChange ? (
          <ErgSelect
            label="Lớp"
            onChange={(event) => onClassChange(String(event.target.value))}
            options={classes.map((classroom) => ({ label: classroom.className, value: classroom.id }))}
            size="small"
            value={selectedClass?.id ?? ""}
          />
        ) : null}
        <ErgSelect label="Kỳ" onChange={(event) => setPeriod(event.target.value as ReportPeriod)} options={periodOptions} size="small" value={period} />
      </Box>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" } }}>
        <Paper component="article" sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
          <Typography component="h2" variant="subtitle1">Xu hướng nộp bài</Typography>
          {trend.length === 0 ? (
            <ErgEmptyState description="Giao bài cho lớp để xem tỷ lệ hoàn thành theo từng bài." title="Chưa có bài giao trong kỳ này" />
          ) : (
            <Box sx={{ height: 280, mt: 2 }}>
              <ErgChartContainer aria-label="Tỷ lệ hoàn thành theo bài giao" config={chartConfig}>
                <BarChart accessibilityLayer data={trend} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis axisLine={false} dataKey="name" tickLine={false} tickMargin={8} />
                  <YAxis axisLine={false} domain={[0, 100]} tickLine={false} width={32} />
                  <ErgChartTooltip content={<ErgChartTooltipContent />} cursor={false} />
                  <Bar dataKey="completionRate" fill="var(--color-completionRate)" radius={4} />
                </BarChart>
              </ErgChartContainer>
            </Box>
          )}
        </Paper>
        <Paper component="article" sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
          <Typography component="h2" variant="subtitle1">Học sinh cần hỗ trợ</Typography>
          {supportList.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
              Chưa có học sinh nào cần hỗ trợ trong dữ liệu hiện có.
            </Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0 }}>
              {supportList.map((student) => (
                <Box
                  component="li"
                  key={student.id}
                  sx={{ alignItems: "center", borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", minHeight: 44 }}
                >
                  <Typography variant="body2">{student.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {student.hasProgressData === false ? "—" : `${student.progressRate}%`}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
