import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AuditFilterBar } from "@/features/audit/components/audit-filter-bar";
import { AuditTable } from "@/features/audit/components/audit-table";
import { auditQueryKeys, downloadAuditExport, listAuditEvents } from "@/features/audit/api/audit-api";
import { AUDIT_PAGE_SIZE, type AuditFilters } from "@/features/audit/types/audit-types";
import { hasApiBase, isBffAuthEnabled } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

export function AuditTrailWorkspace({ scopeId }: { scopeId?: string }) {
  const [filters, setFilters] = useState<AuditFilters>({ page: 0, size: AUDIT_PAGE_SIZE });
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccount("lcms")?.id?.trim() || "bff-session";
  const session = readStoredAuthSession("lcms");
  const canRead = isBffAuthEnabled() || evaluatePermission({ permission: "lms.school.read", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
  const eventsQuery = useQuery({
    queryKey: auditQueryKeys.events(tenantId, accountId, "ADMIN", scopeId, filters),
    queryFn: ({ signal }) => listAuditEvents(filters, signal),
    enabled: hasApiBase() && canRead,
    staleTime: QUERY_POLICIES.sensitive.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
    refetchOnWindowFocus: false,
  });
  const exportMutation = useMutation({ mutationFn: (input: AuditFilters) => downloadAuditExport(input) });
  const errorMessage = getAuditErrorMessage(eventsQuery.error);
  const normalizedFilters = useMemo(() => ({ ...filters, page: Math.max(0, filters.page ?? 0), size: filters.size ?? AUDIT_PAGE_SIZE }), [filters]);

  if (!canRead) return <Alert severity="warning">Bạn không có quyền xem nhật ký hoạt động trong phạm vi quản trị hiện tại.</Alert>;
  if (!hasApiBase()) return <Alert severity="info">API chưa được cấu hình. Nhật ký chỉ hiển thị khi kết nối backend doanh nghiệp.</Alert>;

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", p: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Nhật ký theo scope backend</Typography>
          <Typography color="text.secondary" variant="body2">Bộ lọc được gửi lên backend; mã định danh nhạy cảm luôn được rút gọn ở giao diện và file xuất.</Typography>
        </Box>
        <Button
          disabled={exportMutation.isPending}
          startIcon={<DownloadRoundedIcon />}
          variant="outlined"
          onClick={() => exportMutation.mutate(normalizedFilters, { onSuccess: (blob) => downloadBlob(blob, `erg-audit-page-${normalizedFilters.page ?? 0}.csv`) })}
        >
          {exportMutation.isPending ? "Đang xuất..." : "Xuất trang hiện tại"}
        </Button>
      </Box>
      {exportMutation.error ? <Alert severity="error" sx={{ borderRadius: 0 }}>Không thể xuất nhật ký: {getAuditErrorMessage(exportMutation.error)}</Alert> : null}
      <AuditFilterBar filters={filters} onChange={setFilters} onReset={() => setFilters({ page: 0, size: AUDIT_PAGE_SIZE })} />
      {errorMessage ? <Alert severity="error" sx={{ mx: 2, mb: 2 }}>Không thể tải nhật ký: {errorMessage}</Alert> : null}
      {!errorMessage && !eventsQuery.isLoading && eventsQuery.data?.items.length === 0 ? <Alert severity="info" sx={{ mx: 2, mb: 2 }}>Không có sự kiện phù hợp với bộ lọc và scope được backend cấp quyền.</Alert> : null}
      <AuditTable entries={eventsQuery.data?.items ?? []} isLoading={eventsQuery.isLoading} />
      <TablePagination
        component="div"
        count={eventsQuery.data?.totalElements ?? 0}
        page={eventsQuery.data?.page ?? normalizedFilters.page ?? 0}
        rowsPerPage={normalizedFilters.size ?? AUDIT_PAGE_SIZE}
        rowsPerPageOptions={[25, 50, 100]}
        onPageChange={(_, page) => setFilters((current) => ({ ...current, page }))}
        onRowsPerPageChange={(event) => setFilters((current) => ({ ...current, page: 0, size: Number(event.target.value) }))}
      />
    </Paper>
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

function getAuditErrorMessage(error: unknown) {
  if (!error) return "";
  if (typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 403) return "Bạn không có quyền hoặc scope phù hợp.";
  return error instanceof Error ? error.message : "Lỗi không xác định";
}
