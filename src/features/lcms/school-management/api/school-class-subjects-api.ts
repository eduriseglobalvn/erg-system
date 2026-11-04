import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

export type SchoolClassSubjectAllocation = { classId: string; subjectIds: string[] };

export type SchoolClassSubjects = {
  schoolId: string;
  academicYear: string;
  /** Generation of the saved set (0 when nothing is saved); send it back so a concurrent edit returns 409. */
  version: number;
  allocations: SchoolClassSubjectAllocation[];
};

export type SchoolClassSubjectsScope = { schoolId: string; academicYear: string };

const scopeQuery = (scope: SchoolClassSubjectsScope) =>
  new URLSearchParams({ schoolId: scope.schoolId, academicYear: scope.academicYear });

export function loadSchoolClassSubjects(scope: SchoolClassSubjectsScope, signal?: AbortSignal) {
  return apiRequest<SchoolClassSubjects>(`${API_ENDPOINTS.curriculum.classSubjects}?${scopeQuery(scope)}`, { signal });
}

/** Replaces the whole (school, year) allocation set. */
export function saveSchoolClassSubjects(
  scope: SchoolClassSubjectsScope,
  input: { allocations: SchoolClassSubjectAllocation[]; expectedVersion?: number },
) {
  return apiRequest<SchoolClassSubjects>(`${API_ENDPOINTS.curriculum.classSubjects}?${scopeQuery(scope)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
