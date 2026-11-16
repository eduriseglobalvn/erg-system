import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { getRbacCatalog, rbacQueryKeys, type RbacAccess, type RbacCatalog } from "@/features/rbac/api/rbac-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

const ACCESS_LABEL: Record<RbacAccess, string> = { SUA: "Sửa", XEM: "Xem", NONE: "—" };
const ACCESS_TONE = { SUA: "success", XEM: "info", NONE: "neutral" } as const;

function AccessCell({ value }: { value: RbacAccess | undefined }) {
  const access = value ?? "NONE";
  return access === "NONE"
    ? <Typography color="text.secondary" component="span">{ACCESS_LABEL.NONE}</Typography>
    : <ErgStatusChip label={ACCESS_LABEL[access]} size="small" tone={ACCESS_TONE[access]} />;
}

function RoleMatrixTable({ catalog }: { catalog: RbacCatalog }) {
  return (
    <ErgTable aria-label="Bảng vai trò và quyền" sx={{ display: { md: "table", xs: "none" } }}>
      <TableHead>
        <TableRow>
          <TableCell>Chức năng</TableCell>
          {catalog.roles.map((role) => (
            <TableCell key={role.id} sx={{ minWidth: 150, verticalAlign: "top" }}>
              <Typography variant="subtitle2">{role.label}</Typography>
              <Typography color="text.secondary" variant="caption">{role.description}</Typography>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {catalog.functions.map((fn) => (
          <TableRow key={fn.code}>
            <TableCell>{fn.label}</TableCell>
            {catalog.roles.map((role) => (
              <TableCell key={role.id}><AccessCell value={catalog.matrix[role.id]?.[fn.code]} /></TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </ErgTable>
  );
}

/** Mobile: one card per role listing its functions. */
function RoleCards({ catalog }: { catalog: RbacCatalog }) {
  return (
    <Box sx={{ display: { md: "none", xs: "grid" }, gap: 2, p: 2 }}>
      {catalog.roles.map((role) => (
        <Box component="section" key={role.id} aria-label={role.label} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
          <Typography variant="subtitle2">{role.label}</Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">{role.description}</Typography>
          {catalog.functions.map((fn) => (
            <Box key={fn.code} sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", py: 0.5 }}>
              <Typography variant="body2">{fn.label}</Typography>
              <AccessCell value={catalog.matrix[role.id]?.[fn.code]} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

/** "Vai trò & quyền": read-only matrix of the 7 business roles; roles are declared in the backend, not edited here. */
export function RolePermissionWorkspace() {
  const query = useQuery({
    queryKey: rbacQueryKeys.catalog,
    queryFn: ({ signal }) => getRbacCatalog(signal),
    staleTime: QUERY_POLICIES.reference.staleTime,
  });

  return (
    <ErgContentBand>
      <ErgPageHeader
        description="Mỗi chức năng được xem hoặc sửa bởi những vai trò nào. Vai trò do hệ thống định nghĩa sẵn."
        title="Vai trò & quyền"
      />
      <ErgPageSurface flush>
        {query.isPending ? <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={8} /></Box> : null}
        {query.isError ? (
          <Box sx={{ p: 2 }}>
            <ErgErrorState action={<ErgButton onClick={() => void query.refetch()} variant="outlined">Thử lại</ErgButton>} description="Hệ thống không dùng dữ liệu giả khi máy chủ gặp lỗi." title="Không tải được vai trò và quyền" />
          </Box>
        ) : null}
        {query.data ? (
          <ErgDataTableShell>
            <RoleMatrixTable catalog={query.data} />
            <RoleCards catalog={query.data} />
          </ErgDataTableShell>
        ) : null}
      </ErgPageSurface>
    </ErgContentBand>
  );
}
