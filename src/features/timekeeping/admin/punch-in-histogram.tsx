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

/** The bucket the shift start falls in (15-minute buckets are labelled by their start), or undefined when outside the data. */
function referenceBucket(buckets: readonly Bucket[], shiftStart: string) {
  return [...buckets].reverse().find((bucket) => bucket.time <= shiftStart)?.time;
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
  const referenceX = referenceBucket(data, SHIFT_START);
  return (
    <PunchCard sx={{ p: 3 }}>
      <Typography component="h2" variant="subtitle1">Giờ vào ca</Typography>
      <Typography color="text.secondary" variant="caption">{summary}</Typography>
      {data.length === 0 ? null : (
        <ErgChartContainer aria-label={`Giờ vào ca theo mốc 15 phút. ${summary}`} config={config} sx={{ height: 240, mt: 1, "& .recharts-reference-line text": { fontSize: (theme) => theme.typography.caption.fontSize } }}>
          <BarChart barCategoryGap={2} data={data} margin={{ left: 0, right: 8, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="time" interval="preserveStartEnd" minTickGap={16} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
            <ErgChartTooltip content={<ErgChartTooltipContent hideIndicator />} cursor={false} />
            <Bar dataKey="in" fill="var(--color-in)" maxBarSize={20} name="Lượt vào" radius={[4, 4, 0, 0]} />
            {referenceX ? (
              <ReferenceLine
                label={{ fill: ergEnterpriseTokens.color.textSecondary, position: "top", value: `${SHIFT_START} vào ca` }}
                stroke={ergEnterpriseTokens.color.textSecondary}
                strokeDasharray="4 3"
                x={referenceX}
              />
            ) : null}
          </BarChart>
        </ErgChartContainer>
      )}
    </PunchCard>
  );
}
