import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrainingWaveChart } from "@/features/lcms/school-management/components/training/training-charts";
import type { WeeklyTrainingMetric } from "@/features/lcms/school-management/types/training-monitoring-types";

const metrics: WeeklyTrainingMetric[] = [
  {
    classLogCoverage: 88,
    evidence: { assignments: 6, attempts: 80, classLogs: 8, interventions: 4, students: 48 },
    interventionEffectiveness: 68,
    learningEngagement: 76,
    riskRate: 12,
    studentAverage: 7.6,
    studentMastery: 79,
    teacherSelfScore: 82,
    teachingDelivery: 81,
    week: "Tuần 1",
  },
  {
    classLogCoverage: 91,
    evidence: { assignments: 7, attempts: 84, classLogs: 9, interventions: 4, students: 48 },
    interventionEffectiveness: 71,
    learningEngagement: 79,
    riskRate: 10,
    studentAverage: 7.9,
    studentMastery: 82,
    teacherSelfScore: 84,
    teachingDelivery: 83,
    week: "Tuần 2",
  },
];

describe("TrainingWaveChart", () => {
  it("renders four evidence signals with shadcn areas and comparison lines", () => {
    const { container } = render(<TrainingWaveChart data={metrics} />);

    expect(container.querySelectorAll(".recharts-area-area")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-line-curve")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-legend-wrapper")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Xu hướng chất lượng đào tạo theo tuần" })).toBeInTheDocument();
    expect(screen.getByText("Năng lực học sinh")).toBeInTheDocument();
    expect(screen.getByText("Tham gia học tập")).toBeInTheDocument();
    expect(screen.getByText("Thực thi giảng dạy")).toBeInTheDocument();
    expect(screen.getByText("Hiệu quả can thiệp")).toBeInTheDocument();
    expect(container.querySelectorAll('stop[offset="5%"]')).toHaveLength(2);
    expect(container.querySelectorAll('stop[offset="95%"]')).toHaveLength(2);
  });
});
