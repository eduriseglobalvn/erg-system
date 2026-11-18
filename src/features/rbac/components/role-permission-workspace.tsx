import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { getRbacCatalog, rbacQueryKeys, type RbacAccess, type RbacCatalog } from "@/features/rbac/api/rbac-api";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Read-only matrix: SUA implies XEM. */
const GRANTS: Record<RbacAccess, { view: boolean; edit: boolean }> = { SUA: { view: true, edit: true }, XEM: { view: true, edit: false }, NONE: { view: false, edit: false } };

function GrantCell({ on }: { on: boolean }) {
  return (
    <TableCell align="center" sx={{ width: 88 }}>
      {on ? <CheckRoundedIcon fontSize="small" sx={{ color: "primary.main", verticalAlign: "middle" }} titleAccess="Có" /> : <Typography color="text.secondary" component="span">—</Typography>}
    </TableCell>
  );
}

/** Left column of the design: one row per business role; the selected one tints like the sidebar choice. */
function RoleList({ catalog, onSelect, selectedId }: { catalog: RbacCatalog; onSelect: (id: string) => void; selectedId: string }) {
  return (
    <Box aria-label="Vai trò" component="nav" sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      {catalog.roles.map((role, index) => (
        <ButtonBase
          aria-current={role.id === selectedId ? "true" : undefined}
          key={role.id}
          onClick={() => onSelect(role.id)}
          sx={{ alignItems: "flex-start", bgcolor: role.id === selectedId ? t.color.primarySofter : "transparent", borderTop: index ? `1px solid ${t.color.divider}` : 0, display: "flex", flexDirection: "column", px: 2, py: 1.5, textAlign: "left", width: "100%" }}
        >
          <Typography variant="subtitle2">{role.label}</Typography>
          <Typography color="text.secondary" sx={{ ...t.type.note, display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{role.description}</Typography>
        </ButtonBase>
      ))}
    </Box>
  );
}

function RoleGrantsTable({ catalog, roleId }: { catalog: RbacCatalog; roleId: string }) {
  const role = catalog.roles.find((item) => item.id === roleId);
  return (
    <ErgDataTableShell>
      <ErgTable aria-label={`Quyền của vai trò ${role?.label ?? ""}`}>
        <TableHead>
          <TableRow>
            <TableCell>Chức năng</TableCell>
            <TableCell align="center">Xem</TableCell>
            <TableCell align="center">Sửa</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {catalog.functions.map((fn) => {
            const grant = GRANTS[catalog.matrix[roleId]?.[fn.code] ?? "NONE"];
            return (
              <TableRow key={fn.code}>
                <TableCell>{fn.label}</TableCell>
                <GrantCell on={grant.view} />
                <GrantCell on={grant.edit} />
              </TableRow>
            );
          })}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}

/** "Vai trò & quyền": roles on the left, the picked role's functions on the right (read-only; roles are declared in the backend). */
export function RolePermissionWorkspace() {
  const query = useQuery({
    queryKey: rbacQueryKeys.catalog,
    queryFn: ({ signal }) => getRbacCatalog(signal),
    staleTime: QUERY_POLICIES.reference.staleTime,
  });
  const [selectedId, setSelectedId] = useState<string>();
  const roleId = selectedId ?? query.data?.roles[0]?.id;

  return (
    <ErgContentBand>
      <ErgPageHeader
        description={query.data ? `${query.data.roles.length} vai trò · do hệ thống định nghĩa sẵn, chỉ xem` : "Vai trò do hệ thống định nghĩa sẵn, chỉ xem."}
        title="Vai trò & quyền"
      />
      {query.isPending ? <ErgLoadingSkeleton rows={8} /> : null}
      {query.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void query.refetch()} variant="outlined">Thử lại</ErgButton>} description="Hệ thống không dùng dữ liệu giả khi máy chủ gặp lỗi." title="Không tải được vai trò và quyền" />
      ) : null}
      {query.data && roleId ? (
        <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: { md: "280px minmax(0, 1fr)", xs: "1fr" } }}>
          <RoleList catalog={query.data} onSelect={setSelectedId} selectedId={roleId} />
          <RoleGrantsTable catalog={query.data} roleId={roleId} />
        </Box>
      ) : null}
    </ErgContentBand>
  );
}
