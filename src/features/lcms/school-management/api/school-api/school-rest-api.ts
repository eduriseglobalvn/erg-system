import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import type { SchoolDraft } from "@/features/lcms/school-management/types/school-management-types";
import { academicYearStart, mapCommandSchool, toApiSchoolType, toApiStatus } from "@/features/lcms/school-management/api/school-api/mappers";
import type {
  SchoolAcademicYearRecord,
  SchoolCommandResponse,
  SchoolGradeRecord,
} from "@/features/lcms/school-management/api/school-api/types";

export async function createSchool(draft: SchoolDraft) {
  const response = await apiRequest<SchoolCommandResponse>(API_ENDPOINTS.legacy.v1LcmsSchools, {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify({
      name: draft.name.trim(),
      schoolType: toApiSchoolType(draft.schoolType),
      academicYearStart: academicYearStart(draft.academicYear),
      address: draft.address || null,
      district: draft.district || null,
      principalName: draft.principal || null,
      contactPhone: draft.contactPhone || null,
      contactEmail: draft.contactEmail || null,
      status: toApiStatus(draft.status),
    }),
  });
  return mapCommandSchool(response);
}

export async function updateSchool(schoolId: string, version: number | undefined, draft: SchoolDraft) {
  const response = await apiRequest<SchoolCommandResponse>(API_ENDPOINTS.lcms.school(schoolId), {
    method: "PATCH",
    portal: "lcms",
    body: JSON.stringify({
      version,
      name: draft.name.trim(),
      schoolType: toApiSchoolType(draft.schoolType),
      address: draft.address || null,
      district: draft.district || null,
      principalName: draft.principal || null,
      contactPhone: draft.contactPhone || null,
      contactEmail: draft.contactEmail || null,
      status: toApiStatus(draft.status),
    }),
  });
  return mapCommandSchool(response);
}

export function archiveSchool(schoolId: string) {
  return apiRequest<{ id: string; status: string; version: number }>(API_ENDPOINTS.lcms.school(schoolId), {
    method: "DELETE",
    portal: "lcms",
  });
}

export function restoreSchool(schoolId: string) {
  return apiRequest<{ id: string; status: string; version: number }>(API_ENDPOINTS.lcms.schoolRestore(schoolId), {
    method: "POST",
    portal: "lcms",
  });
}

export function createAcademicYear(schoolId: string, input: { startYear: number; startsOn?: string; endsOn?: string; activate?: boolean }) {
  return apiRequest<SchoolAcademicYearRecord>(API_ENDPOINTS.lcms.academicYears(schoolId), {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify(input),
  });
}

export function activateAcademicYear(schoolId: string, yearId: string, version: number) {
  return apiRequest<SchoolAcademicYearRecord>(API_ENDPOINTS.lcms.academicYearActivate(schoolId, yearId), {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify({ version }),
  });
}

export function closeAcademicYear(schoolId: string, yearId: string, version: number) {
  return apiRequest<SchoolAcademicYearRecord>(API_ENDPOINTS.lcms.academicYearClose(schoolId, yearId), {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify({ version }),
  });
}

export function syncDefaultGrades(schoolId: string) {
  return apiRequest<{ academicYearId: string; created: number; existing: number; grades: SchoolGradeRecord[] }>(API_ENDPOINTS.lcms.gradesSyncDefaults(schoolId), {
    method: "POST",
    portal: "lcms",
  });
}

export function createGrade(schoolId: string, input: { gradeCode: string; label: string; sortOrder: number; status?: string }) {
  return apiRequest<SchoolGradeRecord>(API_ENDPOINTS.lcms.grades(schoolId), {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify(input),
  });
}

export function updateGrade(schoolId: string, gradeId: string, input: { label?: string; sortOrder?: number; status?: string }) {
  return apiRequest<SchoolGradeRecord>(API_ENDPOINTS.lcms.grade(schoolId, gradeId), {
    method: "PATCH",
    portal: "lcms",
    body: JSON.stringify(input),
  });
}
