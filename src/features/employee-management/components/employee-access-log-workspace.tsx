import Box from "@mui/material/Box";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell } from "@/components/erg-mui/erg-table";
import {
  AccessLogFilters,
  type AccessLogFilterState,
} from "@/features/employee-management/components/access-log/access-log-filters";
import { AccessLogTable } from "@/features/employee-management/components/access-log/access-log-table";
import { useEmployeeSecurityFeed } from "@/features/employee-management/hooks/use-employee-management";
import { accessResult } from "@/features/employee-management/lib/access-log-display";

const INITIAL_FILTERS: AccessLogFilterState = { from: null, person: null, result: "", sourceType: "", to: null };

export function EmployeeAccessLogWorkspace({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  // Server chỉ lọc theo người và nguồn; phân trang theo server.
  const query = useEmployeeSecurityFeed(tenantId, {
    limit,
    page,
    sourceType: filters.sourceType || undefined,
    userId: filters.person?.id,
  });

  // shortcut: ngày và kết quả lọc phía client trên trang đang tải (API chưa có tham số), nâng lên server khi backend hỗ trợ.
  const rows = useMemo(() => {
    const { from, result, to } = filters;
    return (query.data?.items ?? []).filter((item) => {
      if (result && accessResult(item) !== result) return false;
      const at = dayjs(item.occurredAt);
      if (from && at.isBefore(from.startOf("day"))) return false;
      if (to && at.isAfter(to.endOf("day"))) return false;
      return true;
    });
  }, [filters, query.data]);
  const clientFiltered = Boolean(filters.from || filters.to || filters.result);

  return (
    <ErgContentBand sx={{ bgcolor: "background.default", py: { md: 4, xs: 2.5 } }}>
      <ErgPageHeader
        description="Đăng nhập, phiên làm việc, cảnh báo bảo mật và thay đổi quyền của toàn bộ nhân sự."
        title="Nhật ký truy cập"
      />
      <ErgPageSurface flush>
        <ErgDataTableShell
          toolbar={
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <AccessLogFilters
                onChange={(next) => { setFilters(next); setPage(1); }}
                state={filters}
                tenantId={tenantId}
              />
              {query.isError ? null : (
                <Typography color="text.secondary" sx={{ px: { md: 2.5, xs: 2 }, pb: 1.5 }} variant="body2">
                  {query.data ? `${query.data.total} sự kiện` : "Đang tải dữ liệu"}
                  {clientFiltered ? " · ngày và kết quả chỉ lọc trong trang đang xem" : ""}
                </Typography>
              )}
            </Box>
          }
        >
          {query.isPending ? <Box sx={{ p: 3 }}><ErgLoadingSkeleton rows={8} /></Box> : null}
          {query.isError ? (
            <Box sx={{ p: 3 }}>
              <ErgErrorState title="Không tải được nhật ký truy cập" description="Kiểm tra quyền quản lý người dùng và kết nối tới máy chủ." />
            </Box>
          ) : null}
          {!query.isPending && !query.isError && rows.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <ErgEmptyState title="Chưa có sự kiện phù hợp" description="Thử đổi bộ lọc hoặc khoảng ngày." />
            </Box>
          ) : null}
          {!query.isPending && !query.isError && rows.length > 0 ? (
            <>
              <AccessLogTable rows={rows} />
              <TablePagination
                component="div"
                count={query.data?.total ?? 0}
                labelRowsPerPage="Số dòng"
                onPageChange={(_, next) => setPage(next + 1)}
                onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
                page={page - 1}
                rowsPerPage={limit}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </>
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>
    </ErgContentBand>
  );
}
