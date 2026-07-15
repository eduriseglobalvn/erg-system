import type {
  StudentTrainingInsight,
  TrainingMetricKey,
  WeeklyTrainingMetric,
} from "@/features/lcms/school-management/types/training-monitoring-types";

export type TrainingChartPeriod = "6-weeks" | "12-weeks" | "all";
export type TrainingTrendDirection = "down" | "flat" | "up";

export interface ScoreDistributionDatum {
  color: string;
  id: "achieved" | "excellent" | "reinforce" | "support";
  label: string;
  value: number;
}

export const trainingMetricOrder: TrainingMetricKey[] = [
  "studentMastery",
  "learningEngagement",
  "teachingDelivery",
  "interventionEffectiveness",
];

export const trainingMetricMeta: Record<TrainingMetricKey, {
  color: string;
  description: string;
  label: string;
  shortLabel: string;
}> = {
  studentMastery: {
    color: "#2563EB",
    description: "Điểm đạt chuẩn và mức tiến bộ qua các lần làm",
    label: "Năng lực học sinh",
    shortLabel: "Năng lực",
  },
  learningEngagement: {
    color: "#059669",
    description: "Hoàn thành, đúng hạn, thời lượng và số lần làm",
    label: "Tham gia học tập",
    shortLabel: "Tham gia",
  },
  teachingDelivery: {
    color: "#D97706",
    description: "Sổ đầu bài, tiến độ và chất lượng phản ánh sau tiết",
    label: "Thực thi giảng dạy",
    shortLabel: "Giảng dạy",
  },
  interventionEffectiveness: {
    color: "#7C3AED",
    description: "Hỗ trợ học sinh rủi ro và cải thiện sau can thiệp",
    label: "Hiệu quả can thiệp",
    shortLabel: "Can thiệp",
  },
};

export function selectTrainingPeriod(data: WeeklyTrainingMetric[], period: TrainingChartPeriod) {
  if (period === "all") return data;
  return data.slice(-Number.parseInt(period, 10));
}

export function buildTrainingChartRows(data: WeeklyTrainingMetric[]) {
  return data.map((item) => ({
    competency: item.studentMastery,
    intervention: item.interventionEffectiveness,
    participation: item.learningEngagement,
    teaching: item.teachingDelivery,
    week: item.week,
  }));
}

export function buildTrainingWaveSeries(activeMetric: TrainingMetricKey) {
  return trainingMetricOrder.map((metric) => ({
    area: metric === activeMetric,
    color: trainingMetricMeta[metric].color,
    curve: "catmullRom" as const,
    dataKey: metric,
    id: metric,
    label: trainingMetricMeta[metric].label,
    showMark: false,
    valueFormatter: (value: number | null) => value == null ? "—" : `${Math.round(value)} điểm`,
  }));
}

export function buildScoreDistributionData(students: Array<Pick<StudentTrainingInsight, "averageScore">>): ScoreDistributionDatum[] {
  return [
    { color: "#2563EB", id: "excellent", label: "Tốt · 8–10", value: students.filter((student) => student.averageScore >= 8).length },
    { color: "#059669", id: "achieved", label: "Đạt · 6.5–7.9", value: students.filter((student) => student.averageScore >= 6.5 && student.averageScore < 8).length },
    { color: "#D97706", id: "reinforce", label: "Cần củng cố · 5–6.4", value: students.filter((student) => student.averageScore >= 5 && student.averageScore < 6.5).length },
    { color: "#DC2626", id: "support", label: "Cần hỗ trợ · dưới 5", value: students.filter((student) => student.averageScore < 5).length },
  ];
}

export function getTrainingMetricInsight(data: WeeklyTrainingMetric[], metric: TrainingMetricKey) {
  const current = data.at(-1)?.[metric] ?? 0;
  const previous = data.at(-2)?.[metric] ?? current;
  const delta = Math.round(current - previous);
  const direction: TrainingTrendDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const primary = direction === "up"
    ? `Tăng ${delta} điểm so với tuần trước`
    : direction === "down"
      ? `Giảm ${Math.abs(delta)} điểm so với tuần trước`
      : "Không đổi so với tuần trước";

  return { delta, direction, primary, secondary: trainingMetricMeta[metric].description };
}
