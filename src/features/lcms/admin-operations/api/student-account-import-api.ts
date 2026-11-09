import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";

export type BulkStudentAccountRow = {
  rowId: string;
  rowNumber: number;
  included: boolean;
  fullName: string;
  className: string;
  username: string;
  password: string;
  birthday?: string;
  phone?: string;
  note?: string;
};

export type BulkStudentAccountRequest = {
  centerId: string;
  classId?: string;
  rows: BulkStudentAccountRow[];
};

export type StudentListItem = {
  id: string;
  fullName: string;
  username: string;
  centerId: string;
  centerName: string;
  classId: string;
  className: string;
  status: string;
  averageScore?: number | null;
  completedAssignments?: number | null;
  lastActivityAt?: string | null;
};

export type BulkStudentAccountResponse = {
  created: number;
  skipped: number;
  duplicates: number;
  credentials: Array<{
    rowId: string;
    rowNumber: number;
    studentId: string;
    username: string;
    password: string;
  }>;
  students?: StudentListItem[];
  failedItems: Array<{
    id: string;
    code: string;
    message: string;
  }>;
};

type SchoolStudentImportResponse = {
  requested: number;
  created: number;
  replayed: number;
};

/** Stable per sheet row, so importing the same sheet again is recognised as a replay instead of duplicating students. */
function studentCodeFor(input: BulkStudentAccountRequest, row: BulkStudentAccountRow) {
  const classPart = row.className.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "lop";
  return `${input.centerId.slice(0, 8)}-${classPart}-${row.rowNumber}`.toUpperCase();
}

/**
 * Imports the sheet rows as students AND creates their login accounts (role learner, already verified,
 * no onboarding), by sending a password with each row to the school's student import.
 * `classIdsByName` maps a sheet class name (lower-case) to an academic class id; `classId` wins when set.
 */
export async function bulkCreateStudentAccounts(
  input: BulkStudentAccountRequest & { classIdsByName?: Record<string, string> },
): Promise<BulkStudentAccountResponse> {
  const rows = input.rows.filter((row) => row.included);
  const response = await apiRequest<SchoolStudentImportResponse>(API_ENDPOINTS.lcms.schoolStudentsImport(input.centerId), {
    method: "POST",
    body: JSON.stringify({
      items: rows.map((row) => ({
        studentCode: studentCodeFor(input, row),
        fullName: row.fullName,
        academicClassId: input.classId ?? input.classIdsByName?.[row.className.trim().toLowerCase()],
        username: row.username,
        password: row.password,
        birthday: row.birthday,
        phone: row.phone,
        note: row.note,
        status: "ACTIVE",
      })),
    }),
  });

  return {
    created: response.created,
    skipped: response.replayed,
    duplicates: 0,
    // shortcut: the API does not say which rows were new, so the sample assumes they are the first `created` ones.
    credentials: rows.slice(0, response.created).map((row) => ({
      rowId: row.rowId,
      rowNumber: row.rowNumber,
      studentId: "",
      username: row.username,
      password: row.password,
    })),
    failedItems: [],
  };
}
