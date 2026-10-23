import type { ClassTrainingSummary, TrainingStatus } from "@/features/lcms/school-management/types/training-monitoring-types";

export type TrainingMonitorScope = "school" | "grade" | "class" | "teacher";

export type TrainingMonitorRow = {
  id: string;
  name: string;
  classCount: number;
  studentCount: number;
  classHealth: number;
  studentMastery: number;
  learningEngagement: number;
  teachingDelivery: number;
  interventionEffectiveness: number;
  riskStudentCount: number;
  status: TrainingStatus;
};

export function buildTrainingMonitorRows(summaries: ClassTrainingSummary[], scope: TrainingMonitorScope, schoolName: string): TrainingMonitorRow[] {
  if (scope === "school") return summaries.length ? [aggregateRows("school", schoolName, summaries)] : [];
  if (scope === "class") return summaries.map((summary) => ({
    classCount: 1,
    classHealth: summary.classHealth,
    id: summary.id,
    interventionEffectiveness: summary.interventionEffectiveness,
    learningEngagement: summary.learningEngagement,
    name: summary.className,
    riskStudentCount: summary.riskStudentCount,
    status: summary.status,
    studentCount: summary.studentCount,
    studentMastery: summary.studentMastery,
    teachingDelivery: summary.teachingDelivery,
  }));

  const groups = new Map<string, ClassTrainingSummary[]>();
  for (const summary of summaries) {
    const key = scope === "grade" ? summary.grade : summary.teacher;
    groups.set(key, [...(groups.get(key) ?? []), summary]);
  }

  return [...groups.entries()].map(([key, rows]) => aggregateRows(
    `${scope}-${key}`,
    scope === "grade" ? `Khối ${key}` : key,
    rows,
  ));
}

function aggregateRows(id: string, name: string, rows: ClassTrainingSummary[]): TrainingMonitorRow {
  const studentCount = rows.reduce((sum, row) => sum + row.studentCount, 0);
  const weight = Math.max(studentCount, 1);
  const weighted = (select: (row: ClassTrainingSummary) => number) => Math.round(rows.reduce((sum, row) => sum + select(row) * row.studentCount, 0) / weight);
  const classHealth = weighted((row) => row.classHealth);

  return {
    classCount: rows.length,
    classHealth,
    id,
    interventionEffectiveness: weighted((row) => row.interventionEffectiveness),
    learningEngagement: weighted((row) => row.learningEngagement),
    name,
    riskStudentCount: rows.reduce((sum, row) => sum + row.riskStudentCount, 0),
    status: classHealth >= 80 ? "good" : classHealth >= 65 ? "watch" : "critical",
    studentCount,
    studentMastery: weighted((row) => row.studentMastery),
    teachingDelivery: weighted((row) => row.teachingDelivery),
  };
}
