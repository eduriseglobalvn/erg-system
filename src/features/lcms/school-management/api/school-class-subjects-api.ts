import { ApiClientError, apiRequest } from "@/lib/api-client";
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

export async function loadSchoolClassSubjects(scope: SchoolClassSubjectsScope, signal?: AbortSignal) {
  try {
    return await apiRequest<SchoolClassSubjects>(`${API_ENDPOINTS.curriculum.classSubjects}?${scopeQuery(scope)}`, { signal });
  } catch (error) {
    // shortcut: a backend without this endpoint (404) behaves as "nothing saved" so school setup keeps working; drop once every backend has V128.
    if (error instanceof ApiClientError && error.status === 404) {
      return { ...scope, version: 0, allocations: [] } satisfies SchoolClassSubjects;
    }
    throw error;
  }
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
