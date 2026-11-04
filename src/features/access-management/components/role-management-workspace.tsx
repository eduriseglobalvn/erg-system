import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { RoleEditorDrawer } from "@/features/access-management/components/role-editor-drawer";
import { usePermissionGroups, useRoles } from "@/features/access-management/hooks/use-access-management";
import { roleDisplayName, scopeTypeLabel } from "@/features/access-management/lib/permission-display";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function RoleManagementWorkspace({ tenantId }: { tenantId: string }) {
  const query = useRoles(tenantId);
  const groupsQuery = usePermissionGroups(tenantId);
  const [editorRoleId, setEditorRoleId] = useState<string>();
  const rows = query.data ?? [];
  // Lỗi tải lại khi vẫn còn dữ liệu cũ phải báo rõ, không âm thầm hiện dữ liệu cũ.
  const staleError = query.isError && rows.length > 0;

  return (
    <ErgContentBand>
      <ErgPageHeader
        description="Mỗi nhóm quyền là tập hợp các quyền có thể kiểm toán; xem trước ảnh hưởng trước khi gán."
        primaryAction={<ErgButton onClick={() => setEditorRoleId("")} startIcon={<AddRoundedIcon />} variant="contained">Tạo nhóm quyền</ErgButton>}
        title="Nhóm quyền"
      />
      {groupsQuery.isError ? (
        <Alert action={<ErgButton onClick={() => void groupsQuery.refetch()} variant="text">Thử lại</ErgButton>} severity="error" sx={{ mb: 2 }}>
          Không tải được danh mục quyền theo module. Dữ liệu hiển thị có thể chưa đầy đủ và không thể chỉnh quyền của nhóm.
        </Alert>
      ) : null}
      {staleError ? (
        <Alert action={<ErgButton onClick={() => void query.refetch()} variant="text">Thử lại</ErgButton>} severity="error" sx={{ mb: 2 }}>
          Không cập nhật được danh sách nhóm quyền. Bảng dưới đây là dữ liệu đã tải trước đó.
        </Alert>
      ) : null}
      <ErgPageSurface flush>
        <ErgDataTableShell toolbar={<ErgTableToolbar meta={query.data ? `${rows.length} nhóm quyền` : query.isPending ? "Đang tải dữ liệu" : undefined} title="Danh sách nhóm quyền" />}>
          {query.isPending ? <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={6} /></Box> : null}
          {query.isError && !rows.length ? (
            <Box sx={{ p: 2 }}>
              <ErgErrorState action={<ErgButton onClick={() => void query.refetch()} variant="outlined">Thử lại</ErgButton>} description="Hệ thống không dùng dữ liệu giả khi máy chủ gặp lỗi." title="Không tải được nhóm quyền" />
            </Box>
          ) : null}
          {!query.isPending && !query.isError && rows.length === 0 ? <Box sx={{ p: 2 }}><ErgEmptyState title="Chưa có nhóm quyền" description="Tạo nhóm quyền đầu tiên rồi gán các quyền cần thiết." /></Box> : null}
          {rows.length > 0 ? (
            <ErgTable aria-label="Danh sách nhóm quyền" sx={{ "& .MuiTableCell-head": { whiteSpace: "nowrap" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nhóm quyền</TableCell>
                  <TableCell align="right">Số quyền</TableCell>
                  <TableCell align="right">Người dùng</TableCell>
                  <TableCell>Phạm vi</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Cập nhật</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((role) => (
                  <TableRow hover key={role.id} onClick={() => setEditorRoleId(role.id)} sx={{ cursor: "pointer" }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: "fontWeightMedium" }} variant="body2">{roleDisplayName(role.name)}</Typography>
                      <Typography color="text.secondary" sx={{ fontFamily: ergEnterpriseTokens.font.mono }} variant="caption">{role.name}</Typography>
                    </TableCell>
                    <TableCell align="right">{role.permissions.length}</TableCell>
                    <TableCell align="right">{role.userCount ?? 0}</TableCell>
                    <TableCell>{role.scopeTypes?.length ? role.scopeTypes.map(scopeTypeLabel).join(", ") : "Chưa giới hạn"}</TableCell>
                    <TableCell>
                      {(role.isSystem ?? role.is_default) ? <Chip label="Hệ thống" size="small" variant="outlined" /> : <Typography color="text.secondary" variant="body2">Tuỳ chỉnh</Typography>}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateVi(role.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ErgTable>
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>
      <RoleEditorDrawer onClose={() => setEditorRoleId(undefined)} roleId={editorRoleId} tenantId={tenantId} />
    </ErgContentBand>
  );
}
