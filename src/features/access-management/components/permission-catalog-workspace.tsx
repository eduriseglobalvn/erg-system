import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { PermissionDetailDrawer } from "@/features/access-management/components/permission-detail-drawer";
import { usePermissionCatalog } from "@/features/access-management/hooks/use-access-management";
import { permissionDisplayName, permissionModuleLabel } from "@/features/access-management/lib/permission-display";
import type { SystemPermission } from "@/features/access-management/types/access-management";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function PermissionCatalogWorkspace({ tenantId }: { tenantId: string }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(100);
  const [used, setUsed] = useState<"" | "true" | "false">("");
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>();
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = usePermissionCatalog(tenantId, { page, limit, search: debouncedSearch || undefined, used: used === "" ? undefined : used === "true" });
  const rows = query.data?.items;

  // shortcut: nhóm theo module trong trang đang tải (API phân trang theo quyền); trang mặc định 100 dòng để ít bị tách nhóm.
  const modules = useMemo(() => {
    const map = new Map<string, SystemPermission[]>();
    for (const row of rows ?? []) {
      const label = permissionModuleLabel(row.group);
      map.set(label, [...(map.get(label) ?? []), row]);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <ErgContentBand>
      <ErgPageHeader title="Quyền hệ thống" description="Danh mục quyền của hệ thống, nhóm theo module, kèm mức sử dụng." />
      <Box sx={{ display: "flex", flexDirection: { sm: "row", xs: "column" }, gap: 1.5, mb: 2 }}>
        <TextField
          fullWidth
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên hoặc key quyền"
          size="small"
          slotProps={{ htmlInput: { "aria-label": "Tìm quyền" }, input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
          value={search}
        />
        <TextField label="Mức sử dụng" onChange={(event) => { setUsed(event.target.value as typeof used); setPage(0); }} select size="small" sx={{ minWidth: { sm: 200 } }} value={used}>
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="true">Đang dùng</MenuItem>
          <MenuItem value="false">Chưa dùng</MenuItem>
        </TextField>
      </Box>
      {query.data ? <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">{query.data.total} quyền</Typography> : null}

      {query.isPending ? <ErgLoadingSkeleton rows={7} /> : null}
      {query.isError ? (
        <ErgErrorState
          action={<ErgButton onClick={() => void query.refetch()} variant="outlined">Thử lại</ErgButton>}
          description="Máy chủ không trả về danh mục quyền. Hệ thống không dùng dữ liệu giả để thay thế."
          title="Không tải được danh mục quyền"
        />
      ) : null}
      {!query.isPending && !query.isError && modules.length === 0 ? <ErgEmptyState title="Chưa có quyền phù hợp" description="Thử đổi từ khoá hoặc bộ lọc." /> : null}

      {!query.isPending && !query.isError && modules.map(([label, items], index) => (
        <Accordion defaultExpanded={index === 0} disableGutters key={label} variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography sx={{ fontWeight: "fontWeightMedium" }} variant="body2">{label}</Typography>
            <Typography color="text.secondary" sx={{ ml: 1 }} variant="body2">{items.length} quyền</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <ErgTable aria-label={`Quyền module ${label}`} sx={{ "& .MuiTableCell-head": { whiteSpace: "nowrap" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Quyền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Sử dụng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow hover key={row.id} onClick={() => setSelectedPermissionId(row.id)} sx={{ cursor: "pointer" }}>
                    <TableCell>
                      <Typography variant="body2">{permissionDisplayName(row)}</Typography>
                      <Typography color="text.secondary" sx={{ fontFamily: ergEnterpriseTokens.font.mono }} variant="caption">{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <ErgStatusChip label={row.status === "ACTIVE" ? "Hoạt động" : "Ngừng dùng"} tone={row.status === "ACTIVE" ? "success" : "warning"} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {row.used ? `${row.roleCount} nhóm quyền · ${row.userCount} người` : <Typography color="text.secondary" component="span" variant="body2">Chưa dùng</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ErgTable>
          </AccordionDetails>
        </Accordion>
      ))}

      {!query.isPending && !query.isError && modules.length > 0 ? (
        <TablePagination component="div" count={query.data?.total ?? 0} labelRowsPerPage="Số dòng" onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} page={page} rowsPerPage={limit} rowsPerPageOptions={[50, 100, 200]} />
      ) : null}
      <PermissionDetailDrawer tenantId={tenantId} permissionId={selectedPermissionId} onClose={() => setSelectedPermissionId(undefined)} />
    </ErgContentBand>
  );
}
