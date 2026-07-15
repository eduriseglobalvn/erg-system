import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ErgChartContainer,
  ErgChartLegend,
  ErgChartLegendContent,
  ErgChartTooltip,
  ErgChartTooltipContent,
  ergChartPalette,
  type ErgChartConfig,
} from "@/components/erg-mui";
import {
  buildScoreDistributionData,
  buildTrainingChartRows,
} from "@/features/lcms/school-management/components/training/training-chart-data";
import type {
  ClassTrainingSummary,
  StudentTrainingInsight,
  WeeklyTrainingMetric,
} from "@/features/lcms/school-management/types/training-monitoring-types";

const waveConfig = {
  participation: { color: "#7DB7F4", label: "Tham gia học tập" },
  competency: { color: "#2563EB", label: "Năng lực học sinh" },
  teaching: { color: "#D97706", label: "Thực thi giảng dạy" },
  intervention: { color: "#7C3AED", label: "Hiệu quả can thiệp" },
} satisfies ErgChartConfig;

export function TrainingWaveChart({ data }: {
  data: WeeklyTrainingMetric[];
}) {
  const rows = buildTrainingChartRows(data);

  return (
    <Box sx={{ height: 270, minWidth: { xs: 560, md: 0 } }}>
      <ErgChartContainer aria-label="Xu hướng chất lượng đào tạo theo tuần" config={waveConfig}>
        <AreaChart accessibilityLayer data={rows} margin={{ left: 12, right: 12 }}>
          <defs>
            <linearGradient id="training-fill-competency" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-competency)" stopOpacity={0.52} />
              <stop offset="95%" stopColor="var(--color-competency)" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="training-fill-participation" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-participation)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-participation)" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis axisLine={false} dataKey="week" interval={rows.length > 8 ? 1 : 0} minTickGap={32} tickLine={false} tickMargin={8} />
          <YAxis domain={[50, 100]} hide />
          <ErgChartTooltip
            content={<ErgChartTooltipContent indicator="dot" />}
            cursor={false}
          />
          <Area
            dataKey="participation"
            fill="url(#training-fill-participation)"
            fillOpacity={1}
            stroke="var(--color-participation)"
            strokeWidth={1.5}
            type="natural"
          />
          <Area
            dataKey="competency"
            fill="url(#training-fill-competency)"
            fillOpacity={1}
            stroke="var(--color-competency)"
            strokeWidth={1.75}
            type="natural"
          />
          <Line dataKey="teaching" dot={false} stroke="var(--color-teaching)" strokeWidth={1.75} type="natural" />
          <Line dataKey="intervention" dot={false} stroke="var(--color-intervention)" strokeWidth={1.75} type="natural" />
          <ErgChartLegend content={<ErgChartLegendContent />} />
        </AreaChart>
      </ErgChartContainer>
    </Box>
  );
}

export function ScoreDistributionChart({ students }: { students: StudentTrainingInsight[] }) {
  const data = buildScoreDistributionData(students);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const config = Object.fromEntries(data.map((item) => [item.id, { color: item.color, label: item.label }])) satisfies ErgChartConfig;

  return (
    <Box sx={{ minHeight: 250 }}>
      <Box sx={{ height: 250, mx: "auto", maxWidth: 360, position: "relative" }}>
        <ErgChartContainer aria-label="Phân loại kết quả học sinh" config={config}>
          <PieChart accessibilityLayer>
            <ErgChartTooltip content={<ErgChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" innerRadius={62} nameKey="id" outerRadius={92} paddingAngle={2} stroke="var(--mui-palette-background-paper)" strokeWidth={5}>
              {data.map((item) => <Cell fill={item.color} key={item.id} />)}
            </Pie>
          </PieChart>
        </ErgChartContainer>
        <Box aria-hidden sx={{ inset: 0, display: "grid", placeContent: "center", pointerEvents: "none", position: "absolute", textAlign: "center" }}>
          <Typography sx={{ fontSize: 28, fontVariantNumeric: "tabular-nums", fontWeight: 800, lineHeight: 1 }}>{total}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, mt: 0.5 }}>Học sinh</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function ClassHealthChart({ summaries }: { summaries: ClassTrainingSummary[] }) {
  const rows = summaries.slice(0, 6);
  const config = { classHealth: { color: ergChartPalette.blue, label: "Sức khỏe" } } satisfies ErgChartConfig;

  return (
    <Box sx={{ height: 255 }}>
      <ErgChartContainer aria-label="Sức khỏe đào tạo theo lớp" config={config}>
        <BarChart accessibilityLayer data={rows} layout="vertical" margin={{ bottom: 4, left: 4, right: 34, top: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis axisLine={false} domain={[0, 100]} tickLine={false} ticks={[0, 50, 100]} type="number" />
          <YAxis axisLine={false} dataKey="className" tickLine={false} tickMargin={8} type="category" width={54} />
          <ErgChartTooltip content={<ErgChartTooltipContent hideLabel />} cursor={{ fill: "rgba(15,23,42,0.035)" }} />
          <Bar barSize={28} dataKey="classHealth" radius={[0, 4, 4, 0]}>
            {rows.map((row) => <Cell fill={healthColor(row.classHealth)} key={row.id} />)}
            <LabelList dataKey="classHealth" fill="#475467" fontSize={11} fontWeight={700} position="right" />
          </Bar>
        </BarChart>
      </ErgChartContainer>
    </Box>
  );
}

export function LogCoverageDonut({ summaries }: { summaries: ClassTrainingSummary[] }) {
  const coverage = summaries.length ? Math.round(summaries.reduce((sum, item) => sum + item.classLogCoverage, 0) / summaries.length) : 0;
  const data = [{ id: "done", value: coverage }, { id: "missing", value: Math.max(0, 100 - coverage) }];
  const config = {
    done: { color: ergChartPalette.blue, label: "Đã báo giảng" },
    missing: { color: "#EEF2F6", label: "Còn thiếu" },
  } satisfies ErgChartConfig;

  return (
    <Box sx={{ alignItems: "center", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) 140px" }, minHeight: 225 }}>
      <Box sx={{ height: 210 }}>
        <ErgChartContainer aria-label="Tỷ lệ hoàn thành báo giảng" config={config}>
          <PieChart accessibilityLayer>
            <ErgChartTooltip content={<ErgChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" innerRadius={58} nameKey="id" outerRadius={82} paddingAngle={2} startAngle={90} endAngle={-270}>
              <Cell fill={config.done.color} />
              <Cell fill={config.missing.color} />
              <Label content={({ viewBox }) => centerLabel(viewBox, coverage)} position="center" />
            </Pie>
          </PieChart>
        </ErgChartContainer>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Tuần này</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{summaries.filter((item) => item.classLogCoverage >= 90).length} lớp đúng hạn</Typography>
        <Typography color="warning.main" variant="body2">{summaries.filter((item) => item.classLogCoverage < 90).length} lớp cần nhắc</Typography>
      </Box>
    </Box>
  );
}

function healthColor(value: number) {
  if (value >= 80) return ergChartPalette.emerald;
  if (value >= 65) return ergChartPalette.amber;
  return ergChartPalette.red;
}

function centerLabel(viewBox: unknown, coverage: number) {
  if (!viewBox || typeof viewBox !== "object" || !("cx" in viewBox) || !("cy" in viewBox)) return null;
  const cx = Number(viewBox.cx);
  const cy = Number(viewBox.cy);
  return <text dominantBaseline="middle" fill="#172033" fontSize={22} fontWeight={800} textAnchor="middle" x={cx} y={cy}>{coverage}%</text>;
}
