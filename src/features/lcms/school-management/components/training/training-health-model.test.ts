import { describe, expect, it } from "vitest";
import {
  calculateClassHealth,
  getTrainingMetricDelta,
} from "@/features/lcms/school-management/components/training/training-health-model";
import type { WeeklyTrainingMetric } from "@/features/lcms/school-management/types/training-monitoring-types";

describe("training health model", () => {
  it("calculates the weighted class-health score", () => {
    expect(calculateClassHealth({
      interventionEffectiveness: 70,
      learningEngagement: 80,
      missingAssignmentRate: 8,
      studentMastery: 90,
      teachingDelivery: 75,
    })).toEqual({ score: 82, status: "good" });
  });

  it("classifies watch and critical bands", () => {
    expect(calculateClassHealth({
      interventionEffectiveness: 60,
      learningEngagement: 70,
      missingAssignmentRate: 12,
      studentMastery: 70,
      teachingDelivery: 70,
    }).status).toBe("watch");
    expect(calculateClassHealth({
      interventionEffectiveness: 45,
      learningEngagement: 58,
      missingAssignmentRate: 16,
      studentMastery: 57,
      teachingDelivery: 60,
    }).status).toBe("critical");
  });

  it("forces critical status when more than twenty percent did not submit", () => {
    expect(calculateClassHealth({
      interventionEffectiveness: 88,
      learningEngagement: 84,
      missingAssignmentRate: 21,
      studentMastery: 86,
      teachingDelivery: 90,
    })).toEqual({ score: 87, status: "critical" });
  });

  it("returns the latest week-over-week delta for a metric", () => {
    const metrics = [
      { week: "Tuần 1", studentMastery: 72 },
      { week: "Tuần 2", studentMastery: 76.4 },
    ] as WeeklyTrainingMetric[];

    expect(getTrainingMetricDelta(metrics, "studentMastery")).toBe(4.4);
    expect(getTrainingMetricDelta(metrics.slice(0, 1), "studentMastery")).toBe(0);
  });
});
