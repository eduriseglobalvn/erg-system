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

export type StudentListResponse = {
  items: StudentListItem[];
  nextCursor?: string;
  total?: number;
};

export type ListStudentsParams = {
  centerId?: string;
  classId?: string;
  keyword?: string;
  status?: string;
  limit?: number;
  cursor?: string;
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

export function listLmsStudents(params: ListStudentsParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return apiRequest<StudentListResponse>(`/api/lms/students${query ? `?${query}` : ""}`);
}