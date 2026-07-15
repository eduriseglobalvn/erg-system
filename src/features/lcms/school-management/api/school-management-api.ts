import { apiRequest } from "@/lib/api-client";
import { graphQlRequest } from "@/lib/graphql-client";
import type {
  PartnerSchool,
  SchoolDraft,
  SchoolStatus,
  SchoolType,
} from "@/features/lcms/school-management/types/school-management-types";

const DIRECTORY_QUERY = `
  query SchoolDirectory($input: SchoolDirectoryInput) {
    lcms {
      schoolDirectory(input: $input) {
        items { id name slug schoolType status district academicYear classCount studentCount version }
        page size totalItems totalPages hasNext hasPrevious
      }
    }
  }
`;

const OPERATIONS_QUERY = `
  query SchoolOperations($input: SchoolOperationsInput!) {
    lcms {
      schoolOperations(input: $input) {
        school { id name slug schoolType status address district principalName contactPhone contactEmail currentAcademicYearId version }
        summary { classCount activeClassCount studentCount gradeCount }
        academicYears { id startYear endYear displayName status startsOn endsOn version }
        grades { id academicYearId gradeCode label sortOrder status source }
        classes { id name grade homeroomTeacher studentCount status }
        students { id code fullName birthDate grade className guardianPhone subjectIds status averageScore }
        subjects { id name code studentCount teacherCount }
        permissions { canCreateSchool canUpdateSchool canArchiveSchool canManageClasses }
      }
    }
  }
`;

export const schoolManagementQueryKeys = {
  root: ["lcms", "school-management"] as const,
  directory: (search = "") => [...schoolManagementQueryKeys.root, "directory", search] as const,
  operations: (schoolId: string) => [...schoolManagementQueryKeys.root, "operations", schoolId] as const,
};

export type SchoolAcademicYearRecord = {
  id: string;
  startYear: number;
  endYear: number;
  displayName: string;
  status: string;
  startsOn?: string | null;
  endsOn?: string | null;
  version: number;
};

export type SchoolGradeRecord = {
  id: string;
  academicYearId: string;
  gradeCode: string;
  label: string;
  sortOrder: number;
  status: string;
  source: string;
};

export type SchoolPermissions = {
  canCreateSchool: boolean;
  canUpdateSchool: boolean;
  canArchiveSchool: boolean;
  canManageClasses: boolean;
};

type DirectoryItem = {
  id: string;
  name: string;
  schoolType: string;
  status: string;
  district?: string | null;
  academicYear?: string | null;
  classCount: number;
  studentCount: number;
  version: number;
};

type DirectoryWorkspace = {
  items: DirectoryItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

type OperationsWorkspace = {
  school: {
    id: string;
    name: string;
    schoolType: string;
    status: string;
    address?: string | null;
    district?: string | null;
    principalName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    currentAcademicYearId?: string | null;
    version: number;
  };
  summary: { classCount: number; activeClassCount: number; studentCount: number; gradeCount: number };
  academicYears: Array<Omit<SchoolAcademicYearRecord, "version"> & { version: string | number }>;
  grades: SchoolGradeRecord[];
  classes: Array<{ id: string; name: string; grade?: string | null; homeroomTeacher?: string | null; studentCount: number; status?: string | null }>;
  students: Array<{ id: string; code?: string | null; fullName: string; birthDate?: string | null; grade?: string | null; className?: string | null; guardianPhone?: string | null; subjectIds: string[]; status: string; averageScore?: number | null }>;
  subjects: Array<{ id: string; name: string; code?: string | null; studentCount: number; teacherCount: number }>;
  permissions: SchoolPermissions;
};

type SchoolCommandResponse = OperationsWorkspace["school"] & {
  currentAcademicYear?: SchoolAcademicYearRecord | null;
  grades?: SchoolGradeRecord[];
};

export async function getSchoolDirectory(search = "") {
  const data = await graphQlRequest<{ lcms: { schoolDirectory: DirectoryWorkspace } }, { input: { search?: string; page: number; size: number } }>({
    operationName: "SchoolDirectory",
    portal: "lcms",
    query: DIRECTORY_QUERY,
    variables: { input: { search: search.trim() || undefined, page: 0, size: 200 } },
  });
  return {
    ...data.lcms.schoolDirectory,
    items: data.lcms.schoolDirectory.items.map(mapDirectorySchool),
  };
}

export async function getSchoolOperations(schoolId: string) {
  const data = await graphQlRequest<{ lcms: { schoolOperations: OperationsWorkspace } }, { input: { schoolId: string } }>({
    operationName: "SchoolOperations",
    portal: "lcms",
    query: OPERATIONS_QUERY,
    variables: { input: { schoolId } },
  });
  return mapOperations(data.lcms.schoolOperations);
}

export async function createSchool(draft: SchoolDraft) {
  const response = await apiRequest<SchoolCommandResponse>("/api/v1/lcms/schools", {
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

export async function updateSchool(schoolId: string, version: number, draft: SchoolDraft) {
  const response = await apiRequest<SchoolCommandResponse>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}`, {
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
  return apiRequest<{ id: string; status: string; version: number }>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}`, {
    method: "DELETE",
    portal: "lcms",
  });
}

export function restoreSchool(schoolId: string) {
  return apiRequest<{ id: string; status: string; version: number }>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/restore`, {
    method: "POST",
    portal: "lcms",
  });
}

export function createAcademicYear(schoolId: string, input: { startYear: number; startsOn?: string; endsOn?: string; activate?: boolean }) {
  return apiRequest<SchoolAcademicYearRecord>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/academic-years`, {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify(input),
  });
}

export function activateAcademicYear(schoolId: string, yearId: string, version: number) {
  return apiRequest<SchoolAcademicYearRecord>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/academic-years/${encodeURIComponent(yearId)}/activate`, {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify({ version }),
  });
}

export function closeAcademicYear(schoolId: string, yearId: string, version: number) {
  return apiRequest<SchoolAcademicYearRecord>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/academic-years/${encodeURIComponent(yearId)}/close`, {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify({ version }),
  });
}

export function syncDefaultGrades(schoolId: string) {
  return apiRequest<{ academicYearId: string; created: number; existing: number; grades: SchoolGradeRecord[] }>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/grades/sync-defaults`, {
    method: "POST",
    portal: "lcms",
  });
}

export function createGrade(schoolId: string, input: { gradeCode: string; label: string; sortOrder: number; status?: string }) {
  return apiRequest<SchoolGradeRecord>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/grades`, {
    method: "POST",
    portal: "lcms",
    body: JSON.stringify(input),
  });
}

export function updateGrade(schoolId: string, gradeId: string, input: { label?: string; sortOrder?: number; status?: string }) {
  return apiRequest<SchoolGradeRecord>(`/api/v1/lcms/schools/${encodeURIComponent(schoolId)}/grades/${encodeURIComponent(gradeId)}`, {
    method: "PATCH",
    portal: "lcms",
    body: JSON.stringify(input),
  });
}

function mapDirectorySchool(item: DirectoryItem): PartnerSchool {
  return {
    id: item.id,
    code: item.id,
    name: item.name,
    address: "",
    district: item.district ?? "",
    principal: "",
    contactPhone: "",
    contactEmail: "",
    academicYear: item.academicYear ?? "",
    schoolType: fromApiSchoolType(item.schoolType),
    status: fromApiStatus(item.status),
    joinedAt: "",
    students: [],
    classes: [],
    grades: [],
    subjects: [],
    reviews: [],
    version: Number(item.version),
    studentCount: Number(item.studentCount),
    classCount: Number(item.classCount),
  };
}

function mapOperations(workspace: OperationsWorkspace): PartnerSchool {
  const currentYear = workspace.academicYears.find((year) => year.id === workspace.school.currentAcademicYearId)
    ?? workspace.academicYears.find((year) => year.status.toUpperCase() === "ACTIVE")
    ?? workspace.academicYears[0];
  return {
    id: workspace.school.id,
    code: workspace.school.id,
    name: workspace.school.name,
    address: workspace.school.address ?? "",
    district: workspace.school.district ?? "",
    principal: workspace.school.principalName ?? "",
    contactPhone: workspace.school.contactPhone ?? "",
    contactEmail: workspace.school.contactEmail ?? "",
    academicYear: currentYear?.displayName ?? "",
    schoolType: fromApiSchoolType(workspace.school.schoolType),
    status: fromApiStatus(workspace.school.status),
    joinedAt: "",
    students: workspace.students.map((student) => ({
      id: student.id,
      code: student.code ?? "",
      fullName: student.fullName,
      birthDate: student.birthDate ?? "",
      grade: student.grade ?? "",
      className: student.className ?? "",
      guardianPhone: student.guardianPhone ?? "",
      subjectIds: student.subjectIds,
      status: student.status.toUpperCase() === "AT_RISK" ? "at-risk" : student.status.toUpperCase() === "ACTIVE" ? "studying" : "inactive",
    })),
    classes: workspace.classes.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      grade: classroom.grade ?? "",
      homeroomTeacher: classroom.homeroomTeacher ?? "Chưa phân công",
      studentCount: classroom.studentCount,
    })),
    grades: workspace.grades.map((grade) => grade.gradeCode.replace(/^GRADE[-_]?/i, "")),
    subjects: workspace.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code ?? "",
      studentCount: subject.studentCount,
      teacherCount: subject.teacherCount,
    })),
    reviews: [],
    version: Number(workspace.school.version),
    studentCount: Number(workspace.summary.studentCount),
    classCount: Number(workspace.summary.classCount),
    academicYears: workspace.academicYears.map((year) => ({ ...year, version: Number(year.version) })),
    gradeRecords: workspace.grades,
    permissions: workspace.permissions,
  };
}

function mapCommandSchool(response: SchoolCommandResponse) {
  const currentYear = response.currentAcademicYear;
  return {
    id: response.id,
    version: Number(response.version),
    academicYear: currentYear?.displayName ?? "",
  };
}

export function toApiSchoolType(value: SchoolType) {
  return ({ primary: "PRIMARY", secondary: "SECONDARY", "high-school": "HIGH_SCHOOL", university: "UNIVERSITY", "training-center": "TRAINING_CENTER" } as const)[value];
}

export function fromApiSchoolType(value: string): SchoolType {
  return ({ PRIMARY: "primary", SECONDARY: "secondary", HIGH_SCHOOL: "high-school", UNIVERSITY: "university", TRAINING_CENTER: "training-center" } as const)[value.toUpperCase() as "PRIMARY"] ?? "training-center";
}

function toApiStatus(value: SchoolStatus) {
  return ({ active: "ACTIVE", onboarding: "ONBOARDING", paused: "PAUSED" } as const)[value];
}

export function fromApiStatus(value: string): SchoolStatus {
  return ({ ACTIVE: "active", ONBOARDING: "onboarding", PAUSED: "paused", ARCHIVED: "paused" } as const)[value.toUpperCase() as "ACTIVE"] ?? "paused";
}

function academicYearStart(value: string) {
  const year = Number(value.match(/\d{4}/)?.[0]);
  return Number.isFinite(year) && year >= 2000 ? year : new Date().getFullYear();
}
