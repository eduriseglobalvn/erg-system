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

export function bulkCreateStudentAccounts(input: BulkStudentAccountRequest) {
  return apiRequest<BulkStudentAccountResponse>("/api/lms/students/bulk-accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
