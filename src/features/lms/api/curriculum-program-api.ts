import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";

export type CurriculumProgramRow = {
  id?: string;
  topic: string;
  period: number;
  title: string;
  sessions: number;
  sortOrder?: number;
  status?: string;
  recordVersion?: number;
};

export type CurriculumProgram = {
  id: string;
  tenantId: string;
  subjectId: string;
  levelId: string;
  academicYear: string;
  name: string;
  status: string;
  recordVersion: number;
  rows: CurriculumProgramRow[];
};

function path(subjectId: string, levelId: string, academicYear: string) {
  const params = new URLSearchParams({ subjectId, levelId, academicYear });
  return `${API_ENDPOINTS.curriculum.program}?${params}`;
}

export function loadCurriculumProgram(scope: { subjectId: string; levelId: string; academicYear: string }, signal?: AbortSignal) {
  return apiRequest<CurriculumProgram | null>(path(scope.subjectId, scope.levelId, scope.academicYear), { signal });
}
