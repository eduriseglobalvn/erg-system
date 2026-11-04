import { apiRequest, ApiClientError, type ApiRequestOptions } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { PortableResultError, type PortableResultFile } from "@/features/elearning/portable-exam/api/portable-exam-result";

/** Server verdict for one imported `.ergresult`; grading is always done by the server, never read from the file. */
export type ImportedPortableAttempt = {
  attemptId: string;
  assignmentId: string;
  quizId: string;
  studentId: string;
  status: string;
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  late: boolean;
  /** True when the same file was imported before; no second attempt is created. */
  duplicate: boolean;
};

export function importPortableResult(
  file: PortableResultFile,
  options: { assignmentId?: string; portal?: ApiRequestOptions["portal"]; signal?: AbortSignal } = {},
) {
  const query = options.assignmentId ? `?${new URLSearchParams({ assignmentId: options.assignmentId })}` : "";
  return apiRequest<ImportedPortableAttempt>(`${API_ENDPOINTS.lms.attemptImport}${query}`, {
    method: "POST",
    body: JSON.stringify(file),
    ...(options.portal ? { portal: options.portal } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
}

export function portableImportErrorMessage(error: unknown) {
  if (error instanceof PortableResultError) return error.message;
  if (error instanceof ApiClientError) {
    if (error.status === 403) return "Bạn không có quyền nộp kết quả của học sinh này.";
    if (error.status === 404) return "Không tìm thấy học sinh hoặc bài giao tương ứng trong hệ thống.";
    if (error.status === 409) return "Có nhiều bài giao khớp hoặc học sinh đã hết lượt làm bài.";
    if (error.status === 400) return "Tệp không khớp với bài thi đã phát hành hoặc với học sinh trong lớp.";
  }
  return "Không nộp được kết quả lên hệ thống. Kiểm tra kết nối rồi thử lại.";
}
