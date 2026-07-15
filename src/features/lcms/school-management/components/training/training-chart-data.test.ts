import { describe, expect, it } from "vitest";
import {
  buildScoreDistributionData,
  buildTrainingChartRows,
  buildTrainingWaveSeries,
  getTrainingMetricInsight,
  selectTrainingPeriod,
  trainingMetricMeta,
} from "@/features/lcms/school-management/components/training/training-chart-data";

const metrics = Array.from({ length: 12 }, (_, index) => ({
  classLogCoverage: 80 + index,
  evidence: { assignments: 6, attempts: 80, classLogs: 8, interventions: 4, students: 48 },
  interventionEffectiveness: 62 + index,
  learningEngagement: 73 + index,
  riskRate: 18 - index / 2,
  week: `Tuần ${index + 1}`,
  studentAverage: 7 + index / 10,
  studentMastery: 70 + index,
  teacherSelfScore: 70 + index,
  teachingDelivery: 76 + index,
}));

describe("training chart period", () => {
  it("keeps the most recent points for the selected period", () => {
    expect(selectTrainingPeriod(metrics, "6-weeks").map((item) => item.week)).toEqual([
      "Tuần 7", "Tuần 8", "Tuần 9", "Tuần 10", "Tuần 11", "Tuần 12",
    ]);
  });

  it("returns all metrics for the full period", () => {
    expect(selectTrainingPeriod(metrics, "all")).toHaveLength(12);
  });

  it("uses a stable distinct color for every evidence domain", () => {
    expect(Object.fromEntries(Object.entries(trainingMetricMeta).map(([key, value]) => [key, value.color]))).toEqual({
      interventionEffectiveness: "#7C3AED",
      learningEngagement: "#059669",
      studentMastery: "#2563EB",
      teachingDelivery: "#D97706",
    });
  });

  it("fills only the selected wave while keeping every domain visible", () => {
    const series = buildTrainingWaveSeries("learningEngagement");

    expect(series).toHaveLength(4);
    expect(series.find((item) => item.id === "learningEngagement")?.area).toBe(true);
    expect(series.filter((item) => item.id !== "learningEngagement").every((item) => item.area === false)).toBe(true);
    expect(new Set(series.map((item) => item.color)).size).toBe(4);
  });

  it("maps weekly metrics to concise Recharts rows", () => {
    expect(buildTrainingChartRows(metrics.slice(0, 1))).toEqual([{
      competency: 70,
      intervention: 62,
      participation: 73,
      teaching: 76,
      week: "Tuần 1",
    }]);
  });

  it("builds semantic student score groups from actual student averages", () => {
    expect(buildScoreDistributionData([
      { averageScore: 8.4 },
      { averageScore: 7.2 },
      { averageScore: 5.8 },
      { averageScore: 4.6 },
      { averageScore: 8.8 },
    ])).toEqual([
      expect.objectContaining({ id: "excellent", label: "Tốt · 8–10", value: 2 }),
      expect.objectContaining({ id: "achieved", label: "Đạt · 6.5–7.9", value: 1 }),
      expect.objectContaining({ id: "reinforce", label: "Cần củng cố · 5–6.4", value: 1 }),
      expect.objectContaining({ id: "support", label: "Cần hỗ trợ · dưới 5", value: 1 }),
    ]);
  });

  it("creates a concise evidence insight for the active metric", () => {
    expect(getTrainingMetricInsight(metrics, "learningEngagement")).toEqual({
      delta: 1,
      direction: "up",
      primary: "Tăng 1 điểm so với tuần trước",
      secondary: "Hoàn thành, đúng hạn, thời lượng và số lần làm",
    });
  });
});
