import { afterEach, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import {
  downloadReportJob,
  enqueueAssignmentProgressReport,
  isReportJobActive,
  normalizeReportJobStatus,
  reportJobQueryKeys,
} from "@/features/reporting/api/report-job-api";

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

test("enqueues an assignment export with an idempotency header and no tenant header", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ id: "job-1", status: "QUEUED" });
  await enqueueAssignmentProgressReport({ assignmentId: "assignment-1", format: "csv", idempotencyKey: " stable-key " });
  expect(apiRequest).toHaveBeenCalledWith("/api/v1/reports/jobs/assignment-progress", expect.objectContaining({
    method: "POST",
    portal: "lms",
    headers: { "X-Idempotency-Key": "stable-key" },
    body: JSON.stringify({ assignmentId: "assignment-1", format: "csv", idempotencyKey: "stable-key" }),
  }));
});

test("downloads a completed report through the authenticated blob path", async () => {
  const blob = new Blob(["csv"]);
  vi.mocked(apiRequest).mockResolvedValue(blob);
  await expect(downloadReportJob("job/1")).resolves.toBe(blob);
  expect(apiRequest).toHaveBeenCalledWith("/api/v1/reports/jobs/job%2F1/download", expect.objectContaining({ portal: "lms", responseType: "blob" }));
});

test("normalizes terminal and active job statuses", () => {
  expect(normalizeReportJobStatus("SUCCEEDED")).toBe("completed");
  expect(normalizeReportJobStatus("FAILED")).toBe("failed");
  expect(normalizeReportJobStatus("PENDING")).toBe("running");
  expect(isReportJobActive("RUNNING")).toBe(true);
  expect(isReportJobActive("COMPLETED")).toBe(false);
});

test("job query keys isolate auth scope", () => {
  expect(reportJobQueryKeys.status("tenant-a", "account-a", "TEACHER", "job-1")).not.toEqual(
    reportJobQueryKeys.status("tenant-a", "account-b", "TEACHER", "job-1"),
  );
});
