import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";

export type CurriculumTeachingPlan = {
  id: string;
  tenantId: string;
  schoolId: string;
  subjectId: string;
  academicYear: string;
  startDate: string;
  teachingDays: number[];
  sessionsPerDay: number;
  timezone: string;
  status: string;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CurriculumTeachingPlanInput = Pick<CurriculumTeachingPlan, "startDate" | "teachingDays" | "sessionsPerDay"> &
  Partial<Pick<CurriculumTeachingPlan, "timezone" | "status">> & { expectedVersion?: number };

export function loadCurriculumTeachingPlan(scope: { schoolId: string; subjectId: string; academicYear: string }, signal?: AbortSignal) {
  const params = new URLSearchParams({ schoolId: scope.schoolId, subjectId: scope.subjectId, academicYear: scope.academicYear });
  return apiRequest<CurriculumTeachingPlan | null>(`${API_ENDPOINTS.curriculum.teachingPlan}?${params}`, { signal });
}

export function saveCurriculumTeachingPlan(scope: { schoolId: string; subjectId: string; academicYear: string }, input: CurriculumTeachingPlanInput) {
  const params = new URLSearchParams({ schoolId: scope.schoolId, subjectId: scope.subjectId, academicYear: scope.academicYear });
  return apiRequest<CurriculumTeachingPlan>(`${API_ENDPOINTS.curriculum.teachingPlan}?${params}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
