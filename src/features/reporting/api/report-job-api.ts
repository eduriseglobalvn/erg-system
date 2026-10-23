import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { ApiOperationBody, ApiResponseData } from "@/lib/api/contract-types";
import { apiRequest } from "@/lib/api-client";
import { isObject, validateResponse } from "@/lib/validate-response";

export type AssignmentProgressJobRequest = ApiOperationBody<"/api/v1/reports/jobs/assignment-progress", "post">;
export type ReportJobResponse = ApiResponseData<"/api/v1/reports/jobs/{jobId}", "get">;

export const reportJobQueryKeys = {
  root: (tenantId: string, accountId: string, workspace: string) => ["report-jobs", tenantId, accountId, workspace] as const,
  status: (tenantId: string, accountId: string, workspace: string, jobId: string) => [...reportJobQueryKeys.root(tenantId, accountId, workspace), jobId] as const,
};

export async function enqueueAssignmentProgressReport(input: AssignmentProgressJobRequest, signal?: AbortSignal) {
  const idempotencyKey = input.idempotencyKey?.trim() || createIdempotencyKey(input.assignmentId);
  const response = await apiRequest<ReportJobResponse>(API_ENDPOINTS.reports.assignmentProgress, {
    method: "POST",
    portal: "lms",
    body: JSON.stringify({ ...input, idempotencyKey }),
    headers: { "X-Idempotency-Key": idempotencyKey },
    ...(signal ? { signal } : {}),
  });
  return validateResponse(response, isReportJobResponse, "reports.jobs.enqueue");
}

export async function getReportJobStatus(jobId: string, signal?: AbortSignal) {
  if (!jobId.trim()) throw new Error("jobId is required.");
  const response = await apiRequest<ReportJobResponse>(API_ENDPOINTS.reports.job(jobId), {
    portal: "lms",
    ...(signal ? { signal } : {}),
  });
  return validateResponse(response, isReportJobResponse, "reports.jobs.status");
}

export async function downloadReportJob(jobId: string, signal?: AbortSignal) {
  if (!jobId.trim()) throw new Error("jobId is required.");
  return apiRequest<Blob>(API_ENDPOINTS.reports.download(jobId), {
    portal: "lms",
    responseType: "blob",
    ...(signal ? { signal } : {}),
  });
}

export function normalizeReportJobStatus(status?: string) {
  const value = status?.trim().toUpperCase();
  if (value === "COMPLETED" || value === "SUCCEEDED" || value === "SUCCESS") return "completed" as const;
  if (value === "FAILED" || value === "ERROR") return "failed" as const;
  if (value === "EXPIRED") return "expired" as const;
  return "running" as const;
}

export function isReportJobActive(status?: string) {
  return normalizeReportJobStatus(status) === "running";
}

function isReportJobResponse(value: unknown): value is ReportJobResponse & { id: string; status: string } {
  return isObject(value) && typeof value.id === "string" && typeof value.status === "string";
}

function createIdempotencyKey(assignmentId: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `assignment-progress:${assignmentId}:${suffix}`;
}
