import Typography from "@mui/material/Typography";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { ErgChartContainer, ErgChartTooltip, ErgChartTooltipContent, type ErgChartConfig } from "@/components/erg-mui/charts/erg-chart";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { TodayDashboard } from "../api/timekeeping-types";
import { PunchCard } from "../components/punch/punch-card";
import { hhmm } from "../components/punch/punch-format";

// The dashboard carries no shift data; 07:30 is the canvas's morning shift. shortcut: constant, read the school's shifts when A04 data is wired here.
export const SHIFT_START = "07:30";

const config = { in: { label: "Lượt vào", color: ergEnterpriseTokens.color.primary } } satisfies ErgChartConfig;

type Bucket = { time: string; in: number };

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The backend sends only the 15-minute buckets that have punches: fill the gaps with 0 over 06:00..09:30, widened to the first / last bucket. */
export function denseBuckets(buckets: readonly Bucket[], from = "06:00", to = "09:30"): Bucket[] {
  const counts = new Map(buckets.map((bucket) => [bucket.time, bucket.in]));
  const times = buckets.map((bucket) => toMinutes(bucket.time));
  const start = Math.min(toMinutes(from), ...times);
  const end = Math.max(toMinutes(to), ...times);
  const out: Bucket[] = [];
  for (let minutes = start; minutes <= end; minutes += 15) out.push({ time: toTime(minutes), in: counts.get(toTime(minutes)) ?? 0 });
  return out;
}

/** One-line description of the chart for screen readers and as visible caption. */
export function histogramSummary(buckets: readonly Bucket[], shiftStart = SHIFT_START) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.in, 0);
  if (total === 0) return "Chưa có lượt chấm vào nào.";
  const peak = buckets.reduce((best, bucket) => (bucket.in > best.in ? bucket : best));
  const late = buckets.filter((bucket) => bucket.time >= shiftStart).reduce((sum, bucket) => sum + bucket.in, 0);
  return `${total} lượt chấm vào, cao điểm lúc ${peak.time} (${peak.in} lượt), ${late} lượt từ ${shiftStart} trở đi.`;
}

/** "Giờ vào ca": punch-in counts per 15 minutes with a reference line at the shift start. */
export function PunchInHistogram({ buckets }: { buckets: NonNullable<TodayDashboard["inBuckets"]> }) {
  const data: Bucket[] = buckets.map((bucket) => ({ time: hhmm(bucket.time), in: bucket.in ?? 0 }));
  const summary = histogramSummary(data);
  const chartData = denseBuckets(data);
  return (
    <PunchCard sx={{ p: 3 }}>
      <Typography component="h2" variant="subtitle1">Giờ vào ca</Typography>
      <Typography color="text.secondary" variant="caption">{summary}</Typography>
      {data.length === 0 ? null : (
        <ErgChartContainer aria-label={`Giờ vào ca theo mốc 15 phút. ${summary}`} config={config} sx={{ height: 240, mt: 1, "& .recharts-reference-line text": { fontSize: (theme) => theme.typography.caption.fontSize } }}>
          <BarChart barCategoryGap={2} data={chartData} margin={{ left: 0, right: 8, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="time" interval="preserveStartEnd" minTickGap={16} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
            <ErgChartTooltip content={<ErgChartTooltipContent hideIndicator />} cursor={false} />
            <Bar dataKey="in" fill="var(--color-in)" maxBarSize={20} name="Lượt vào" radius={[4, 4, 0, 0]} />
            <ReferenceLine
              label={{ fill: ergEnterpriseTokens.color.textSecondary, position: "top", value: `${SHIFT_START} vào ca` }}
              stroke={ergEnterpriseTokens.color.textSecondary}
              strokeDasharray="4 3"
              x={SHIFT_START}
            />
          </BarChart>
        </ErgChartContainer>
      )}
    </PunchCard>
  );
}
