import { graphQlRequest } from "@/lib/graphql-client";

import {
  GRAPHQL_MAX_BATCH_SIZE,
  compactInput,
  createIdempotencyKey,
  isBulkEnrollmentResult,
  isOperationalEnrollmentRecord,
  readMutationRecord,
} from "@/features/lcms/school-management/api/school-api/shared";

import type {
  BulkEnrollmentResult,
  OperationalEnrollmentRecord,
  SchoolEnrollmentItem,
} from "@/features/lcms/school-management/api/school-api/types";

const ENROLLMENT_RESPONSE_FIELDS = `id tenantId schoolId studentId classId academicYear status version replayed updatedAt`;

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

export async function bulkEnrollSchoolStudents(items: SchoolEnrollmentItem[], idempotencyKey = createIdempotencyKey(), signal?: AbortSignal): Promise<BulkEnrollmentResult> {
  if (items.length <= GRAPHQL_MAX_BATCH_SIZE) {
    const data = await graphQlRequest<{ bulkEnrollSchoolStudents: BulkEnrollmentResult }, { input: Record<string, unknown> }>({
      operationName: "LcmsBulkEnrollSchoolStudents",
      portal: "lcms",
      query: BULK_ENROLL_STUDENTS_MUTATION,
      signal,
      variables: { input: { idempotencyKey, items: items.map((item) => compactInput(item, "studentId", "classId")) } },
    });
    return readMutationRecord(data, "bulkEnrollSchoolStudents", isBulkEnrollmentResult, "lcms.bulk-enroll-school-students");
  }

  const results: BulkEnrollmentResult[] = [];
  for (let i = 0; i < items.length; i += GRAPHQL_MAX_BATCH_SIZE) {
    const chunk = items.slice(i, i + GRAPHQL_MAX_BATCH_SIZE);
    const chunkKey = `${idempotencyKey}-b${Math.floor(i / GRAPHQL_MAX_BATCH_SIZE)}`;
    const data = await graphQlRequest<{ bulkEnrollSchoolStudents: BulkEnrollmentResult }, { input: Record<string, unknown> }>({
      operationName: "LcmsBulkEnrollSchoolStudents",
      portal: "lcms",
      query: BULK_ENROLL_STUDENTS_MUTATION,
      signal,
      variables: { input: { idempotencyKey: chunkKey, items: chunk.map((item) => compactInput(item, "studentId", "classId")) } },
    });
    const res = readMutationRecord(data, "bulkEnrollSchoolStudents", isBulkEnrollmentResult, "lcms.bulk-enroll-school-students");
    results.push(res);
  }

  return {
    idempotencyKey,
    requested: items.length,
    enrolled: results.reduce((acc, r) => acc + (r.enrolled || 0), 0),
    replayed: results.reduce((acc, r) => acc + (r.replayed || 0), 0),
    items: results.flatMap((r) => r.items || []),
  };
}
