import type {
  TrainingMetricKey,
  TrainingStatus,
  WeeklyTrainingMetric,
} from "@/features/lcms/school-management/types/training-monitoring-types";

type ClassHealthInput = {
  studentMastery: number;
  learningEngagement: number;
  teachingDelivery: number;
  interventionEffectiveness: number;
  missingAssignmentRate: number;
};

export function calculateClassHealth(input: ClassHealthInput) {
  const score = Math.round(clamp(
    input.studentMastery * 0.4
      + input.learningEngagement * 0.25
      + input.teachingDelivery * 0.2
      + input.interventionEffectiveness * 0.15,
  ));
  const status: TrainingStatus = input.missingAssignmentRate > 20
    ? "critical"
    : score >= 80
      ? "good"
      : score >= 65
        ? "watch"
        : "critical";

  return { score, status };
}

export function getTrainingMetricDelta(
  metrics: WeeklyTrainingMetric[],
  metric: TrainingMetricKey,
) {
  if (metrics.length < 2) return 0;
  const latest = metrics[metrics.length - 1]?.[metric] ?? 0;
  const previous = metrics[metrics.length - 2]?.[metric] ?? 0;
  return Math.round((latest - previous) * 10) / 10;
}

export function toTrainingStatus(score: number): TrainingStatus {
  return score >= 80 ? "good" : score >= 65 ? "watch" : "critical";
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
