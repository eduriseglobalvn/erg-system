import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import type {
  PartnerSchool,
  SchoolDraft,
  SchoolStatus,
  SchoolType,
} from "@/features/lcms/school-management/types/school-management-types";

const DIRECTORY_QUERY = `
  query LcmsSchoolDirectory($input: SchoolDirectoryInput) {
    lcms {
      schoolDirectory(input: $input) {
        items { id name slug schoolType status district academicYear classCount studentCount version }
        page size totalItems totalPages hasNext hasPrevious
      }
    }
  }
`;

const OPERATIONS_QUERY = `
  query LcmsSchoolOperations($input: SchoolOperationsInput!) {
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

const CLASS_RESPONSE_FIELDS = `id tenantId schoolId name grade academicYear homeroomTeacherId status version updatedAt`;
const STUDENT_RESPONSE_FIELDS = `id tenantId schoolId academicClassId studentCode fullName username authUserId email gender birthday phone address parentName parentPhone parentEmail parentRelationship enrollmentDate note status version updatedAt`;
const SUBJECT_RESPONSE_FIELDS = `id tenantId schoolId name code status version updatedAt`;
const ENROLLMENT_RESPONSE_FIELDS = `id tenantId schoolId studentId classId academicYear status version replayed updatedAt`;

const CREATE_CLASS_MUTATION = `
  mutation LcmsCreateSchoolClass($input: CreateSchoolClassInput!) {
    createSchoolClass(input: $input) { ${CLASS_RESPONSE_FIELDS} }
  }
`;
const UPDATE_CLASS_MUTATION = `
  mutation LcmsUpdateSchoolClass($input: UpdateSchoolClassInput!) {
    updateSchoolClass(input: $input) { ${CLASS_RESPONSE_FIELDS} }
  }
`;
const ARCHIVE_CLASS_MUTATION = `
  mutation LcmsArchiveSchoolClass($input: ArchiveSchoolClassInput!) {
    archiveSchoolClass(input: $input) { ${CLASS_RESPONSE_FIELDS} }
  }
`;
const CREATE_STUDENT_MUTATION = `
  mutation LcmsCreateSchoolStudent($input: CreateSchoolStudentInput!) {
    createSchoolStudent(input: $input) { ${STUDENT_RESPONSE_FIELDS} }
  }
`;
const UPDATE_STUDENT_MUTATION = `
  mutation LcmsUpdateSchoolStudent($input: UpdateSchoolStudentInput!) {
    updateSchoolStudent(input: $input) { ${STUDENT_RESPONSE_FIELDS} }
  }
`;
const ARCHIVE_STUDENT_MUTATION = `
  mutation LcmsArchiveSchoolStudent($input: ArchiveSchoolStudentInput!) {
    archiveSchoolStudent(input: $input) { ${STUDENT_RESPONSE_FIELDS} }
  }
`;
const IMPORT_STUDENTS_MUTATION = `
  mutation LcmsImportSchoolStudents($input: ImportSchoolStudentsInput!) {
    importSchoolStudents(input: $input) {
      idempotencyKey requested created replayed
      items { ${STUDENT_RESPONSE_FIELDS} }
    }
  }
`;
const CREATE_SUBJECT_MUTATION = `
  mutation LcmsCreateSchoolSubject($input: CreateSchoolSubjectInput!) {
    createSchoolSubject(input: $input) { ${SUBJECT_RESPONSE_FIELDS} }
  }
`;
const UPDATE_SUBJECT_MUTATION = `
  mutation LcmsUpdateSchoolSubject($input: UpdateSchoolSubjectInput!) {
    updateSchoolSubject(input: $input) { ${SUBJECT_RESPONSE_FIELDS} }
  }
`;
const ARCHIVE_SUBJECT_MUTATION = `
  mutation LcmsArchiveSchoolSubject($input: ArchiveSchoolSubjectInput!) {
    archiveSchoolSubject(input: $input) { ${SUBJECT_RESPONSE_FIELDS} }
  }
`;
const ENROLL_STUDENT_MUTATION = `
  mutation LcmsEnrollSchoolStudent($input: EnrollSchoolStudentInput!) {
    enrollSchoolStudent(input: $input) { ${ENROLLMENT_RESPONSE_FIELDS} }
  }
`;
const BULK_ENROLL_STUDENTS_MUTATION = `
  mutation LcmsBulkEnrollSchoolStudents($input: BulkEnrollSchoolStudentsInput!) {
    bulkEnrollSchoolStudents(input: $input) {
      idempotencyKey requested enrolled replayed
      items { ${ENROLLMENT_RESPONSE_FIELDS} }
    }
  }
`;

export const schoolManagementQueryKeys = {
  root: (tenantId: string, accountId: string) =>
    ["lcms", "school-management", tenantId, accountId] as const,
  directory: (tenantId: string, accountId: string, search = "") =>
    [...schoolManagementQueryKeys.root(tenantId, accountId), "directory", search] as const,
  operations: (tenantId: string, accountId: string, schoolId: string) =>
    [...schoolManagementQueryKeys.root(tenantId, accountId), "operations", schoolId] as const,
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

export type SchoolClassInput = {
  name: string;
  grade?: string | null;
  academicYear?: string | null;
  homeroomTeacherId?: string | null;
  status?: string | null;
};

export type SchoolStudentInput = {
  studentCode: string;
  fullName: string;
  academicClassId?: string | null;
  email?: string | null;
  username?: string | null;
  gender?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentRelationship?: string | null;
  enrollmentDate?: string | null;
  note?: string | null;
  status?: string | null;
};

export type SchoolSubjectInput = {
  name: string;
  code: string;
  schoolId?: string | null;
  status?: string | null;
};

export type SchoolEnrollmentItem = {
  studentId: string;
  classId: string;
  academicYear?: string | null;
};

export type OperationalClassRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  grade?: string | null;
  academicYear?: string | null;
  homeroomTeacherId?: string | null;
  status: string;
  version: number;
  updatedAt?: string | null;
};

export type OperationalStudentRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  academicClassId?: string | null;
  studentCode: string;
  fullName: string;
  username?: string | null;
  authUserId?: string | null;
  email?: string | null;
  gender?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentRelationship?: string | null;
  enrollmentDate?: string | null;
  note?: string | null;
  status: string;
  version: number;
  updatedAt?: string | null;
};

export type OperationalSubjectRecord = {
  id: string;
  tenantId: string;
  schoolId?: string | null;
  name: string;
  code: string;
  status: string;
  version: number;
  updatedAt?: string | null;
};

export type OperationalEnrollmentRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  academicYear?: string | null;
  status: string;
  version: number;
  replayed: boolean;
  updatedAt?: string | null;
};

export type BulkStudentImportResult = {
  idempotencyKey?: string | null;
  requested: number;
  created: number;
  replayed: number;
  items: OperationalStudentRecord[];
};

export type BulkEnrollmentResult = {
  idempotencyKey?: string | null;
  requested: number;
  enrolled: number;
  replayed: number;
  items: OperationalEnrollmentRecord[];
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

export async function getSchoolDirectory(search = "", signal?: AbortSignal) {
  const data = await graphQlRequest<{ lcms: { schoolDirectory: DirectoryWorkspace } }, { input: { search?: string; page: number; size: number } }>({
    operationName: "LcmsSchoolDirectory",
    portal: "lcms",
    query: DIRECTORY_QUERY,
    signal,
    variables: { input: { search: search.trim() || undefined, page: 0, size: 200 } },
  });
  const directory = validateResponse(data, isSchoolDirectoryResponse, "lcms.school-directory").lcms.schoolDirectory;
  return {
    ...directory,
    items: directory.items.map(mapDirectorySchool),
  };
}

export async function getSchoolOperations(schoolId: string, signal?: AbortSignal) {
  const data = await graphQlRequest<{ lcms: { schoolOperations: OperationsWorkspace } }, { input: { schoolId: string } }>({
    operationName: "LcmsSchoolOperations",
    portal: "lcms",
    query: OPERATIONS_QUERY,
    signal,
    variables: { input: { schoolId } },
  });
  return mapOperations(
    validateResponse(data, isSchoolOperationsResponse, "lcms.school-operations").lcms.schoolOperations,
  );
}

export async function createSchoolClass(schoolId: string, input: SchoolClassInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ createSchoolClass: OperationalClassRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsCreateSchoolClass",
    portal: "lcms",
    query: CREATE_CLASS_MUTATION,
    signal,
    variables: { input: { schoolId, ...compactInput(input, "name") } },
  });
  return readMutationRecord(data, "createSchoolClass", isOperationalClassRecord, "lcms.create-school-class");
}

export async function updateSchoolClass(schoolId: string, classId: string, version: number, input: Partial<SchoolClassInput>, signal?: AbortSignal) {
  const data = await graphQlRequest<{ updateSchoolClass: OperationalClassRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsUpdateSchoolClass",
    portal: "lcms",
    query: UPDATE_CLASS_MUTATION,
    signal,
    variables: { input: { schoolId, classId, version: String(version), ...compactInput(input) } },
  });
  return readMutationRecord(data, "updateSchoolClass", isOperationalClassRecord, "lcms.update-school-class");
}

export async function archiveSchoolClass(schoolId: string, classId: string, version: number, signal?: AbortSignal) {
  const data = await graphQlRequest<{ archiveSchoolClass: OperationalClassRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsArchiveSchoolClass",
    portal: "lcms",
    query: ARCHIVE_CLASS_MUTATION,
    signal,
    variables: { input: { schoolId, classId, version: String(version) } },
  });
  return readMutationRecord(data, "archiveSchoolClass", isOperationalClassRecord, "lcms.archive-school-class");
}

export async function createSchoolStudent(schoolId: string, input: SchoolStudentInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ createSchoolStudent: OperationalStudentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsCreateSchoolStudent",
    portal: "lcms",
    query: CREATE_STUDENT_MUTATION,
    signal,
    variables: { input: { schoolId, ...mapStudentInput(input, "studentCode", "fullName") } },
  });
  return readMutationRecord(data, "createSchoolStudent", isOperationalStudentRecord, "lcms.create-school-student");
}

export async function updateSchoolStudent(schoolId: string, studentId: string, version: number, input: Partial<SchoolStudentInput>, signal?: AbortSignal) {
  const data = await graphQlRequest<{ updateSchoolStudent: OperationalStudentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsUpdateSchoolStudent",
    portal: "lcms",
    query: UPDATE_STUDENT_MUTATION,
    signal,
    variables: { input: { schoolId, studentId, version: String(version), ...mapStudentInput(input) } },
  });
  return readMutationRecord(data, "updateSchoolStudent", isOperationalStudentRecord, "lcms.update-school-student");
}

export async function archiveSchoolStudent(schoolId: string, studentId: string, version: number, signal?: AbortSignal) {
  const data = await graphQlRequest<{ archiveSchoolStudent: OperationalStudentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsArchiveSchoolStudent",
    portal: "lcms",
    query: ARCHIVE_STUDENT_MUTATION,
    signal,
    variables: { input: { schoolId, studentId, version: String(version) } },
  });
  return readMutationRecord(data, "archiveSchoolStudent", isOperationalStudentRecord, "lcms.archive-school-student");
}

export async function importSchoolStudents(schoolId: string, items: SchoolStudentInput[], idempotencyKey = createIdempotencyKey(), signal?: AbortSignal) {
  const data = await graphQlRequest<{ importSchoolStudents: BulkStudentImportResult }, { input: Record<string, unknown> }>({
    operationName: "LcmsImportSchoolStudents",
    portal: "lcms",
    query: IMPORT_STUDENTS_MUTATION,
    signal,
    variables: {
      input: {
        schoolId,
        idempotencyKey,
        items: items.map((item) => mapStudentInput(item, "studentCode", "fullName")),
      },
    },
  });
  return readMutationRecord(data, "importSchoolStudents", isBulkStudentImportResult, "lcms.import-school-students");
}

export async function createSchoolSubject(input: SchoolSubjectInput, signal?: AbortSignal) {
  const data = await graphQlRequest<{ createSchoolSubject: OperationalSubjectRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsCreateSchoolSubject",
    portal: "lcms",
    query: CREATE_SUBJECT_MUTATION,
    signal,
    variables: { input: compactInput(input, "name", "code") },
  });
  return readMutationRecord(data, "createSchoolSubject", isOperationalSubjectRecord, "lcms.create-school-subject");
}

export async function updateSchoolSubject(subjectId: string, version: number, input: Partial<SchoolSubjectInput>, signal?: AbortSignal) {
  const data = await graphQlRequest<{ updateSchoolSubject: OperationalSubjectRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsUpdateSchoolSubject",
    portal: "lcms",
    query: UPDATE_SUBJECT_MUTATION,
    signal,
    variables: { input: { subjectId, version: String(version), ...compactInput(input) } },
  });
  return readMutationRecord(data, "updateSchoolSubject", isOperationalSubjectRecord, "lcms.update-school-subject");
}

export async function archiveSchoolSubject(subjectId: string, version: number, signal?: AbortSignal) {
  const data = await graphQlRequest<{ archiveSchoolSubject: OperationalSubjectRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsArchiveSchoolSubject",
    portal: "lcms",
    query: ARCHIVE_SUBJECT_MUTATION,
    signal,
    variables: { input: { subjectId, version: String(version) } },
  });
  return readMutationRecord(data, "archiveSchoolSubject", isOperationalSubjectRecord, "lcms.archive-school-subject");
}

export async function enrollSchoolStudent(item: SchoolEnrollmentItem, idempotencyKey = createIdempotencyKey(), signal?: AbortSignal) {
  const data = await graphQlRequest<{ enrollSchoolStudent: OperationalEnrollmentRecord }, { input: Record<string, unknown> }>({
    operationName: "LcmsEnrollSchoolStudent",
    portal: "lcms",
    query: ENROLL_STUDENT_MUTATION,
    signal,
    variables: { input: { ...compactInput(item, "studentId", "classId"), idempotencyKey } },
  });
  return readMutationRecord(data, "enrollSchoolStudent", isOperationalEnrollmentRecord, "lcms.enroll-school-student");
}

export async function bulkEnrollSchoolStudents(items: SchoolEnrollmentItem[], idempotencyKey = createIdempotencyKey(), signal?: AbortSignal) {
  const data = await graphQlRequest<{ bulkEnrollSchoolStudents: BulkEnrollmentResult }, { input: Record<string, unknown> }>({
    operationName: "LcmsBulkEnrollSchoolStudents",
    portal: "lcms",
    query: BULK_ENROLL_STUDENTS_MUTATION,
    signal,
    variables: { input: { idempotencyKey, items: items.map((item) => compactInput(item, "studentId", "classId")) } },
  });
  return readMutationRecord(data, "bulkEnrollSchoolStudents", isBulkEnrollmentResult, "lcms.bulk-enroll-school-students");
}

function compactInput(input: Record<string, unknown>, ...requiredKeys: string[]) {
  const result = Object.fromEntries(Object.entries(input).filter(([key, value]) => {
    if (requiredKeys.includes(key)) return value !== undefined && value !== null && String(value).trim() !== "";
    return value !== undefined && value !== null && (typeof value !== "string" || value.trim() !== "");
  }));
  return result;
}

function mapStudentInput(input: Partial<SchoolStudentInput>, ...requiredKeys: string[]) {
  const mapped = {
    ...input,
    birthday: input.birthday ? new Date(input.birthday).toISOString() : undefined,
    enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate).toISOString() : undefined,
  };
  return compactInput(mapped, ...requiredKeys);
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `lcms-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readMutationRecord<T>(data: unknown, key: string, guard: (value: unknown) => value is T, context: string): T {
  if (!isObject(data) || !guard(data[key])) {
    throw new Error(`Invalid ${context} response.`);
  }
  return normalizeMutationValue(data[key]) as T;
}

function normalizeMutationValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeMutationValue);
  if (!isObject(value)) return value;
  const result: Record<string, unknown> = { ...value };
  if ("version" in result) result.version = Number(result.version);
  if ("items" in result) result.items = normalizeMutationValue(result.items);
  return result;
}

function isOperationalClassRecord(value: unknown): value is OperationalClassRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.schoolId === "string" && typeof value.name === "string" && typeof value.status === "string" && isFiniteNumber(value.version);
}

function isOperationalStudentRecord(value: unknown): value is OperationalStudentRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.schoolId === "string" && typeof value.studentCode === "string" && typeof value.fullName === "string" && typeof value.status === "string" && isFiniteNumber(value.version);
}

function isOperationalSubjectRecord(value: unknown): value is OperationalSubjectRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.code === "string" && typeof value.status === "string" && isFiniteNumber(value.version);
}

function isOperationalEnrollmentRecord(value: unknown): value is OperationalEnrollmentRecord {
  return isObject(value) && typeof value.id === "string" && typeof value.schoolId === "string" && typeof value.studentId === "string" && typeof value.classId === "string" && typeof value.status === "string" && isFiniteNumber(value.version) && typeof value.replayed === "boolean";
}

function isBulkStudentImportResult(value: unknown): value is BulkStudentImportResult {
  return isObject(value) && typeof value.requested === "number" && typeof value.created === "number" && typeof value.replayed === "number" && Array.isArray(value.items) && value.items.every(isOperationalStudentRecord);
}

function isBulkEnrollmentResult(value: unknown): value is BulkEnrollmentResult {
  return isObject(value) && typeof value.requested === "number" && typeof value.enrolled === "number" && typeof value.replayed === "number" && Array.isArray(value.items) && value.items.every(isOperationalEnrollmentRecord);
}

function isFiniteNumber(value: unknown): value is number {
  return (typeof value === "number" || typeof value === "string") && Number.isFinite(Number(value));
}

function isSchoolDirectoryResponse(value: unknown): value is { lcms: { schoolDirectory: DirectoryWorkspace } } {
  return isObject(value) && isObject(value.lcms) && isObject(value.lcms.schoolDirectory) &&
    Array.isArray(value.lcms.schoolDirectory.items) && typeof value.lcms.schoolDirectory.page === "number" &&
    typeof value.lcms.schoolDirectory.totalItems === "number";
}

function isSchoolOperationsResponse(value: unknown): value is { lcms: { schoolOperations: OperationsWorkspace } } {
  if (!isObject(value) || !isObject(value.lcms) || !isObject(value.lcms.schoolOperations)) return false;
  const workspace = value.lcms.schoolOperations;
  return isObject(workspace.school) && isObject(workspace.summary) && isObject(workspace.permissions) &&
    Array.isArray(workspace.academicYears) && Array.isArray(workspace.grades) &&
    Array.isArray(workspace.classes) && Array.isArray(workspace.students) && Array.isArray(workspace.subjects);
}

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

export async function updateSchool(schoolId: string, version: number, draft: SchoolDraft) {
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
      academicClassId: undefined,
    })),
    classes: workspace.classes.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      grade: classroom.grade ?? "",
      homeroomTeacher: classroom.homeroomTeacher ?? "Chưa phân công",
      studentCount: classroom.studentCount,
      status: classroom.status ?? "",
      version: undefined,
    })),
    grades: workspace.grades.map((grade) => grade.gradeCode.replace(/^GRADE[-_]?/i, "")),
    subjects: workspace.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code ?? "",
      studentCount: subject.studentCount,
      teacherCount: subject.teacherCount,
      status: "ACTIVE",
      version: undefined,
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
