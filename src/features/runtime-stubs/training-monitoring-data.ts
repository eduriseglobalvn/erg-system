import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import type {
  AssessmentCampaign,
  QuestionPermissionRequest,
  TrainingMonitoringData,
} from "@/features/lcms/school-management/types/training-monitoring-types";

export function buildTrainingMonitoringData(_school: PartnerSchool): TrainingMonitoringData {
  return { assignments: [], classLogs: [], classSummaries: [], practiceTopics: [], students: [], teachers: [], weeklyMetrics: [] };
}

export const assessmentCampaigns: AssessmentCampaign[] = [];
export const questionPermissionRequests: QuestionPermissionRequest[] = [];
