import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import TablePagination from "@mui/material/TablePagination";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell } from "@/components/erg-mui/erg-table";
import { CreateEmployeeWizard } from "@/features/employee-management/components/create-employee-wizard";
import { EmployeeDetailDrawer } from "@/features/employee-management/components/employee-detail-drawer";
import { EmployeeActionMenu } from "@/features/employee-management/components/employee-list/action-menu";
import { EmployeeMobileList } from "@/features/employee-management/components/employee-list/employee-mobile-list";
import { EmployeeTable } from "@/features/employee-management/components/employee-list/employee-table";
import { EmployeeListToolbar } from "@/features/employee-management/components/employee-list/list-toolbar";
import { RoleAssignDialog } from "@/features/employee-management/components/employee-list/role-assign-dialog";
import {
  useEmployeeCommands,
  useEmployeeRoleOptions,
  useEmployees,
  useEmployeeSchoolOptions,
} from "@/features/employee-management/hooks/use-employee-management";
import type { EmployeeItem, EmployeeStatusInput } from "@/features/employee-management/types/employee-management";

export function EmployeeListWorkspace({ tenantId }: { tenantId: string }) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionEmployee, setActionEmployee] = useState<EmployeeItem>();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [statusTarget, setStatusTarget] = useState<EmployeeItem>();

  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useEmployeeRoleOptions(tenantId);
  const { schools } = useEmployeeSchoolOptions();
  const schoolNames = useMemo(() => new Map(schools.map((school) => [school.id, school.name])), [schools]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuerySearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Máy chủ hỗ trợ page/limit/search/status/role nên phân trang và lọc đều ở server.
  const query = useEmployees(tenantId, {
    limit,
    page,
    role: role || undefined,
    search: querySearch || undefined,
    status: (status || undefined) as EmployeeStatusInput | undefined,
  });
  const employees = query.data?.users ?? [];
  const total = query.data?.meta.total;

  const openMenu = (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActionEmployee(employee);
  };
  const closeMenu = () => setMenuAnchor(null);

  const assignRole = async () => {
    if (!actionEmployee || !roleName) return;
    try {
      await commands.roles.mutateAsync({
        roles: [...new Set([...actionEmployee.roles, roleName])],
        userId: actionEmployee.id,
      });
    } catch {
      return; // global handler already toasted; keep the dialog open
    }
    setRoleDialogOpen(false);
  };

  const locking = statusTarget?.status === "ACTIVE";
  const showContent = !query.isPending && !query.isError;

  return (
    <ErgContentBand sx={{ bgcolor: "background.default", py: { md: 4, xs: 2.5 } }}>
      <ErgPageHeader
        description="Quản lý hồ sơ, vai trò, phạm vi, trạng thái và phiên đăng nhập của nhân sự."
        primaryAction={
          <ErgButton onClick={() => setCreateOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">
            Tạo tài khoản
          </ErgButton>
        }
        title="Tài khoản nhân sự"
      />

      <ErgPageSurface flush>
        <ErgDataTableShell
          toolbar={
            <EmployeeListToolbar
              onRoleChange={(value) => { setRole(value); setPage(1); }}
              onSearchChange={setSearch}
              onStatusChange={(value) => { setStatus(value); setPage(1); }}
              role={role}
              roles={rolesQuery.data ?? []}
              search={search}
              status={status}
              total={total}
              loading={query.isPending}
            />
          }
        >
          {query.isPending ? <Box sx={{ p: 3 }}><ErgLoadingSkeleton rows={7} /></Box> : null}
          {query.isError ? (
            <Box sx={{ p: 3 }}>
              <ErgErrorState
                action={<ErgButton onClick={() => void query.refetch()} variant="outlined">Thử lại</ErgButton>}
                description={query.error instanceof Error ? query.error.message : "Không tải được danh sách nhân sự từ hệ thống."}
                title="Không tải được nhân sự"
              />
            </Box>
          ) : null}
          {showContent && !employees.length ? (
            <Box sx={{ p: 4 }}><ErgEmptyState title="Chưa có nhân sự phù hợp" description="Thử đổi từ khoá hoặc bộ lọc." /></Box>
          ) : null}
          {showContent && employees.length ? (
            <>
              {isMobile ? (
                <EmployeeMobileList employees={employees} onOpenMenu={openMenu} onSelect={setSelectedUserId} />
              ) : (
                <EmployeeTable employees={employees} onOpenMenu={openMenu} onSelect={setSelectedUserId} schoolNames={schoolNames} />
              )}
              <TablePagination
                component="div"
                count={total ?? 0}
                labelRowsPerPage="Số dòng"
                onPageChange={(_, next) => setPage(next + 1)}
                onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
                page={Math.max(0, page - 1)}
                rowsPerPage={limit}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </>
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>

      <EmployeeActionMenu
        anchorEl={menuAnchor}
        onAssignRole={() => { setRoleName(""); setRoleDialogOpen(true); closeMenu(); }}
        onClose={closeMenu}
        onToggleStatus={() => { if (actionEmployee) setStatusTarget(actionEmployee); closeMenu(); }}
        onView={() => { if (actionEmployee) setSelectedUserId(actionEmployee.id); closeMenu(); }}
        status={actionEmployee?.status}
      />

      <ErgConfirmDialog
        confirmLabel={locking ? "Khoá" : "Mở khoá"}
        description={`${locking ? "Khoá" : "Mở khoá"} tài khoản ${statusTarget?.fullName ?? ""}. Thay đổi trạng thái có thể thu hồi toàn bộ phiên đăng nhập của nhân sự.`}
        destructive={locking}
        loading={commands.status.isPending}
        onCancel={() => setStatusTarget(undefined)}
        onConfirm={() => {
          if (statusTarget) {
            commands.status.mutate({
              status: locking ? "INACTIVE" : "ACTIVE",
              userId: statusTarget.id,
            });
          }
          setStatusTarget(undefined);
        }}
        open={Boolean(statusTarget)}
        title={locking ? "Khoá tài khoản" : "Mở khoá tài khoản"}
      />

      <RoleAssignDialog
        onClose={() => setRoleDialogOpen(false)}
        onConfirm={assignRole}
        onRoleNameChange={setRoleName}
        open={roleDialogOpen}
        pending={commands.roles.isPending}
        roleName={roleName}
        roles={rolesQuery.data}
      />

      <EmployeeDetailDrawer
        key={selectedUserId ?? "none"}
        onClose={() => setSelectedUserId(undefined)}
        tenantId={tenantId}
        userId={selectedUserId}
      />

      <CreateEmployeeWizard onClose={() => setCreateOpen(false)} open={createOpen} tenantId={tenantId} />
    </ErgContentBand>
  );
}
