import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { downloadReportJob as downloadReportFile, enqueueAssignmentProgressReport, getReportJobStatus, isReportJobActive, normalizeReportJobStatus, reportJobQueryKeys } from "@/features/reporting/api/report-job-api";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";

export function AssignmentProgressExportControl({ assignmentId, classId }: { assignmentId?: string; classId?: string }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccount("lms")?.id?.trim() || "bff-session";
  const enqueueMutation = useMutation({
    mutationFn: () => {
      if (!assignmentId) throw new Error("Chưa xác định được bài tập để xuất báo cáo.");
      return enqueueAssignmentProgressReport({ assignmentId, classId, format: "csv", timezone: "Asia/Ho_Chi_Minh" });
    },
    onSuccess: (job) => setJobId(job.id),
  });
  const statusQuery = useQuery({
    queryKey: reportJobQueryKeys.status(tenantId, accountId, "TEACHER", jobId ?? "none"),
    queryFn: ({ signal }) => getReportJobStatus(jobId ?? "", signal),
    enabled: hasApiBase() && Boolean(jobId),
    refetchInterval: (query) => isReportJobActive(query.state.data?.status) ? 2_000 : false,
    refetchOnWindowFocus: false,
  });
  const downloadMutation = useMutation({
    mutationFn: () => downloadReportFile(jobId ?? ""),
    onSuccess: (blob) => downloadBlob(blob, `erg-assignment-progress-${assignmentId}.csv`),
  });
  const status = normalizeReportJobStatus(statusQuery.data?.status);
  const disabled = !hasApiBase() || !assignmentId || enqueueMutation.isPending || (Boolean(jobId) && status === "running");

  return (
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
      <Button disabled={disabled} startIcon={<DownloadRoundedIcon />} variant="outlined" onClick={() => { setJobId(null); enqueueMutation.mutate(); }}>
        {enqueueMutation.isPending ? "Đang xếp hàng..." : "Xuất CSV"}
      </Button>
      {jobId && status === "running" ? <Chip color="info" label={`Đang tạo báo cáo${typeof statusQuery.data?.progress === "number" ? ` · ${statusQuery.data.progress}%` : ""}`} size="small" variant="outlined" /> : null}
      {jobId && status === "completed" ? <Button size="small" onClick={() => downloadMutation.mutate()}>Tải file</Button> : null}
      {jobId && status === "failed" ? <Alert severity="error" sx={{ py: 0 }}>Backend không tạo được báo cáo.</Alert> : null}
      {enqueueMutation.error ? <Alert severity="error" sx={{ py: 0 }}>{errorMessage(enqueueMutation.error)}</Alert> : null}
      {statusQuery.error ? <Alert severity="error" sx={{ py: 0 }}>{errorMessage(statusQuery.error)}</Alert> : null}
    </Box>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể tạo báo cáo.";
}
