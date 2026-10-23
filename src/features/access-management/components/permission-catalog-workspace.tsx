import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

import { ErgContentBand, ErgPageSurface, ErgSectionHeader } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { usePermissionCatalog } from "@/features/access-management/hooks/use-access-management";
import { PermissionDetailDrawer } from "@/features/access-management/components/permission-detail-drawer";

export function PermissionCatalogWorkspace({ tenantId }: { tenantId: string }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [used, setUsed] = useState<"" | "true" | "false">("");
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>();
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = usePermissionCatalog(tenantId, { page, limit, search: debouncedSearch || undefined, used: used === "" ? undefined : used === "true" });
  const rows = query.data?.items ?? [];

  return (
    <ErgContentBand>
      <ErgSectionHeader eyebrow="Hệ thống" title="Quyền hệ thống" description="Catalog quyền thật trong DB, kèm binding runtime và mức sử dụng." />
      <ErgPageSurface flush>
        <ErgDataTableShell toolbar={<ErgTableToolbar title="Catalog permission" meta={query.data ? `${query.data.total} quyền` : "Đang tải dữ liệu"} actions={<Box sx={{ display: "flex", gap: 1 }}><TextField select size="small" label="Mức sử dụng" value={used} onChange={(event) => { setUsed(event.target.value as typeof used); setPage(0); }} sx={{ minWidth: 150 }}><MenuItem value="">Tất cả</MenuItem><MenuItem value="true">Đang dùng</MenuItem><MenuItem value="false">Chưa dùng</MenuItem></TextField><TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm key, mô tả..." slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} /></Box>} />}>
          {query.isPending ? <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={7} /></Box> : null}
          {query.isError ? <Box sx={{ p: 2 }}><ErgErrorState title="Không tải được catalog quyền" description="Backend không trả về dữ liệu quyền. Không dùng dữ liệu giả để thay thế." action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} /></Box> : null}
          {!query.isPending && !query.isError && rows.length === 0 ? <Box sx={{ p: 2 }}><ErgEmptyState title="Chưa có quyền phù hợp" description="Thử đổi từ khóa hoặc bộ lọc." /></Box> : null}
          {!query.isPending && !query.isError && rows.length > 0 ? (
            <><ErgTable aria-label="Catalog quyền hệ thống"><TableHead><TableRow><TableCell>ID DB</TableCell><TableCell>Permission key</TableCell><TableCell>Module / action</TableCell><TableCell>Binding runtime</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Đang dùng</TableCell></TableRow></TableHead><TableBody>
              {rows.map((row) => <TableRow hover key={row.id} onClick={() => setSelectedPermissionId(row.id)} sx={{ cursor: "pointer" }}><TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{row.id}</TableCell><TableCell><Box sx={{ fontFamily: "monospace", fontWeight: 700 }}>{row.name}</Box><Box sx={{ color: "text.secondary", fontSize: 12 }}>{row.description}</Box></TableCell><TableCell>{row.resource ?? row.group} · {row.action ?? "—"}</TableCell><TableCell>{row.bindings[0]?.surfaceIdentifier ?? "Chưa bind"}</TableCell><TableCell><ErgStatusChip label={row.status} tone={row.status === "ACTIVE" ? "success" : "warning"} /></TableCell><TableCell align="right">{row.used ? "Có" : "Không"} · {row.roleCount} role / {row.userCount} user</TableCell></TableRow>)}
            </TableBody></ErgTable><TablePagination component="div" count={query.data?.total ?? 0} page={page} rowsPerPage={limit} rowsPerPageOptions={[25, 50, 100]} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} labelRowsPerPage="Số dòng" /></>
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>
      <PermissionDetailDrawer tenantId={tenantId} permissionId={selectedPermissionId} onClose={() => setSelectedPermissionId(undefined)} />
    </ErgContentBand>
  );
}
