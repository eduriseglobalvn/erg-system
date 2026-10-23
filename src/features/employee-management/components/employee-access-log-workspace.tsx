import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand, ErgPageSurface, ErgSectionHeader } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { useEmployeeSecurityFeed } from "@/features/employee-management/hooks/use-employee-management";
import type { SecurityFeedFilters, SecurityFeedItem } from "@/features/employee-management/types/employee-management";

const sourceOptions: Array<{ value: SecurityFeedFilters["sourceType"] | ""; label: string }> = [
  { value: "", label: "Tất cả nguồn" },
  { value: "LOGIN_ATTEMPT", label: "Đăng nhập" },
  { value: "SECURITY_EVENT", label: "Cảnh báo bảo mật" },
  { value: "SESSION", label: "Phiên đăng nhập" },
  { value: "USER_ACTIVITY", label: "Hoạt động quản trị" },
];

export function EmployeeAccessLogWorkspace({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sourceType, setSourceType] = useState<SecurityFeedFilters["sourceType"]>();
  const query = useEmployeeSecurityFeed(tenantId, { page, limit, sourceType });
  const rows = query.data?.items ?? [];

  return <ErgContentBand>
    <ErgSectionHeader eyebrow="Quản lý" title="Nhật ký truy cập" description="Feed hợp nhất đăng nhập, session, cảnh báo bảo mật và thay đổi quyền của toàn bộ nhân sự." />
    <ErgPageSurface flush>
      <ErgDataTableShell toolbar={<ErgTableToolbar title="Hoạt động nhân sự" meta={query.data ? `${query.data.total} sự kiện` : "Đang tải dữ liệu"} actions={<TextField select size="small" label="Nguồn sự kiện" value={sourceType ?? ""} onChange={(event) => { setSourceType((event.target.value || undefined) as SecurityFeedFilters["sourceType"]); setPage(1); }} sx={{ minWidth: 190 }}>{sourceOptions.map((option) => <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>)}</TextField>} />}>
        {query.isPending ? <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={8} /></Box> : null}
        {query.isError ? <Box sx={{ p: 2 }}><ErgErrorState title="Không tải được nhật ký truy cập" description="Kiểm tra quyền users.manage và kết nối tới security feed backend." /></Box> : null}
        {!query.isPending && !query.isError && rows.length === 0 ? <Box sx={{ p: 3 }}><ErgEmptyState title="Chưa có sự kiện phù hợp" description="Thử đổi nguồn sự kiện hoặc chờ hoạt động đăng nhập mới." /></Box> : null}
        {!query.isPending && !query.isError && rows.length > 0 ? <>
          <ErgTable aria-label="Nhật ký truy cập nhân sự">
            <TableHead><TableRow><TableCell>Thời gian</TableCell><TableCell>Nhân sự</TableCell><TableCell>Sự kiện</TableCell><TableCell>Nền tảng & địa chỉ</TableCell><TableCell>Kết quả</TableCell></TableRow></TableHead>
            <TableBody>{rows.map((event) => <SecurityFeedRow event={event} key={`${event.sourceType}:${event.id}`} />)}</TableBody>
          </ErgTable>
          <TablePagination component="div" count={query.data?.total ?? 0} page={page - 1} rowsPerPage={limit} rowsPerPageOptions={[25, 50, 100]} onPageChange={(_, nextPage) => setPage(nextPage + 1)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} labelRowsPerPage="Số dòng" />
        </> : null}
      </ErgDataTableShell>
    </ErgPageSurface>
  </ErgContentBand>;
}

function SecurityFeedRow({ event }: { event: SecurityFeedItem }) {
  const warning = event.severity === "HIGH" || event.severity === "CRITICAL" || Boolean(event.riskCode);
  const mobile = event.platform === "WEB_MOBILE";
  return <TableRow hover sx={{ bgcolor: warning ? "warning.50" : undefined }}>
    <TableCell sx={{ whiteSpace: "nowrap" }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(event.occurredAt).toLocaleString("vi-VN")}</Typography><Typography color="text.secondary" variant="caption">{event.sourceType}</Typography></TableCell>
    <TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>{event.userName || "Không xác định"}</Typography><Typography color="text.secondary" variant="caption">{event.userEmail || event.userId || "—"}</Typography></TableCell>
    <TableCell><Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>{warning ? <WarningAmberRoundedIcon color="warning" fontSize="small" /> : null}<Typography variant="body2" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{event.riskCode || event.eventType}</Typography></Box>{event.reason ? <Typography color="text.secondary" variant="caption">{event.reason}</Typography> : null}</TableCell>
    <TableCell><Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>{mobile ? <PhoneIphoneRoundedIcon fontSize="small" color="action" /> : <ComputerRoundedIcon fontSize="small" color="action" />}<Typography variant="body2">{event.platform || "UNKNOWN_PLATFORM"}</Typography></Box><Typography color="text.secondary" variant="caption">{event.ipAddress || "Không có IP"}</Typography></TableCell>
    <TableCell><ErgStatusChip label={event.result || event.severity} tone={warning ? "warning" : event.result === "SUCCESS" ? "success" : "info"} /></TableCell>
  </TableRow>;
}
