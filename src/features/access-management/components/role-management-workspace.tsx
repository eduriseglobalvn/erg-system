import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState } from "react";

import { ErgContentBand, ErgPageSurface, ErgSectionHeader } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { useRoles } from "@/features/access-management/hooks/use-access-management";
import { RoleEditorDrawer } from "@/features/access-management/components/role-editor-drawer";

export function RoleManagementWorkspace({ tenantId }: { tenantId: string }) {
  const query = useRoles(tenantId);
  const [editorRoleId, setEditorRoleId] = useState<string>();
  const rows = query.data ?? [];
  return (
    <ErgContentBand>
      <ErgSectionHeader eyebrow="Hệ thống" title="Nhóm quyền" description="Role là tập hợp một hoặc nhiều permission thật, có thể audit và preview trước khi gán." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditorRoleId("")}>Tạo nhóm quyền</Button>} />
      <ErgPageSurface flush>
        <ErgDataTableShell toolbar={<ErgTableToolbar title="Role registry" meta={query.data ? `${rows.length} nhóm quyền` : "Đang tải dữ liệu"} />}>
          {query.isPending ? <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={6} /></Box> : null}
          {query.isError ? <Box sx={{ p: 2 }}><ErgErrorState title="Không tải được nhóm quyền" description="Không dùng dữ liệu mock khi registry thật gặp lỗi." action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} /></Box> : null}
          {!query.isPending && !query.isError && rows.length === 0 ? <Box sx={{ p: 2 }}><ErgEmptyState title="Chưa có nhóm quyền" description="Tạo role đầu tiên rồi gán các permission cần thiết." /></Box> : null}
          {!query.isPending && !query.isError && rows.length > 0 ? <ErgTable aria-label="Danh sách nhóm quyền"><TableHead><TableRow><TableCell>Mã DB</TableCell><TableCell>Tên nhóm quyền</TableCell><TableCell>Permission</TableCell><TableCell>Người dùng</TableCell><TableCell>Scope</TableCell><TableCell>System role</TableCell><TableCell>Trạng thái</TableCell><TableCell>Cập nhật</TableCell></TableRow></TableHead><TableBody>{rows.map((role) => <TableRow hover key={role.id} onClick={() => setEditorRoleId(role.id)} sx={{ cursor: "pointer" }}><TableCell sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>{role.id}</TableCell><TableCell><Box sx={{ fontWeight: 800 }}>{role.name}</Box><Box sx={{ color: "text.secondary", fontSize: 12 }}>{role.description}</Box></TableCell><TableCell>{role.permissions.length}</TableCell><TableCell>{role.userCount ?? 0}</TableCell><TableCell>{role.scopeTypes?.join(", ") || "Chưa giới hạn"}</TableCell><TableCell>{role.isSystem ?? role.is_default ? "Có" : "Không"}</TableCell><TableCell><ErgStatusChip label={role.status ?? "ACTIVE"} tone="success" /></TableCell><TableCell><Box>{new Date(role.updated_at).toLocaleDateString("vi-VN")}</Box><Box sx={{ color: "text.secondary", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{role.updatedBy || "Chưa có actor"}</Box></TableCell></TableRow>)}</TableBody></ErgTable> : null}
        </ErgDataTableShell>
      </ErgPageSurface>
      <RoleEditorDrawer tenantId={tenantId} roleId={editorRoleId} onClose={() => setEditorRoleId(undefined)} />
    </ErgContentBand>
  );
}
