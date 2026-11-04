import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell } from "@/components/erg-mui/erg-table";
import {
  ErgEmptyState,
  ErgErrorState,
  ErgLoadingSkeleton,
} from "@/components/erg-mui/erg-feedback";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import {
  CreateEmployeeWizard,
} from "@/features/employee-management/components/create-employee-wizard";
import {
  EmployeeDetailDrawer,
} from "@/features/employee-management/components/employee-detail-drawer";
import {
  useEmployeeCommands,
  useEmployeeRoleOptions,
  useEmployees,
} from "@/features/employee-management/hooks/use-employee-management";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";
import { EmployeeActionMenu } from "@/features/employee-management/components/employee-list/action-menu";
import { EmployeeTable } from "@/features/employee-management/components/employee-list/employee-table";
import { EmployeeKpiRibbon } from "@/features/employee-management/components/employee-list/kpi-ribbon";
import { EmployeeListHeader } from "@/features/employee-management/components/employee-list/list-header";
import { EmployeeListToolbar } from "@/features/employee-management/components/employee-list/list-toolbar";
import { RoleAssignDialog } from "@/features/employee-management/components/employee-list/role-assign-dialog";

export function EmployeeListWorkspace({ tenantId }: { tenantId: string }) {
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionEmployee, setActionEmployee] = useState<EmployeeItem>();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [statusTarget, setStatusTarget] = useState<EmployeeItem>();

  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useEmployeeRoleOptions(tenantId);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuerySearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useEmployees(tenantId, {
    limit: 25,
    page: 1,
    search: querySearch || undefined,
  });

  const employees = query.data?.users ?? [];

  const openMenu = (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActionEmployee(employee);
  };

  const closeMenu = () => setMenuAnchor(null);

  const openRoleDialog = () => {
    setRoleName("");
    setRoleDialogOpen(true);
    closeMenu();
  };

  const assignRole = async () => {
    if (!actionEmployee || !roleName) return;
    await commands.roles.mutateAsync({
      roles: [...new Set([...actionEmployee.roles, roleName])],
      userId: actionEmployee.id,
    });
    setRoleDialogOpen(false);
  };

  // Quick statistics calculation
  const totalCount = query.data?.meta.total ?? employees.length;
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const riskCount = employees.filter((e) => Boolean(e.riskCode)).length;

  return (
    <ErgContentBand sx={{ bgcolor: "#F5F5F7", py: { md: 4, xs: 2.5 } }}>
      {/* Apple-styled Page Header */}
      <EmployeeListHeader onCreate={() => setCreateOpen(true)} />

      {/* Apple KPI Ribbon Cards */}
      <EmployeeKpiRibbon activeCount={activeCount} riskCount={riskCount} totalCount={totalCount} />

      {/* Main Table Shell (Apple macOS Inset Container) */}
      <ErgPageSurface
        flush
        sx={{
          bgcolor: "#FFFFFF",
          border: `1px solid ${appleDesign.colors.border}`,
          borderRadius: "18px",
          boxShadow: appleDesign.shadows.card,
          overflow: "hidden",
        }}
      >
        <ErgDataTableShell
          toolbar={
            <EmployeeListToolbar onSearchChange={setSearch} search={search} total={query.data?.meta.total} />
          }
        >
          {query.isPending ? (
            <Box sx={{ p: 3 }}>
              <ErgLoadingSkeleton rows={7} />
            </Box>
          ) : null}

          {query.isError ? (
            <Box sx={{ p: 3 }}>
              <ErgErrorState
                title="Không tải được nhân sự"
                description={
                  query.error instanceof Error
                    ? query.error.message
                    : "Không tải được danh sách nhân sự từ hệ thống."
                }
              />
            </Box>
          ) : null}

          {!query.isPending && !query.isError && !employees.length ? (
            <Box sx={{ p: 4 }}>
              <ErgEmptyState title="Chưa có nhân sự phù hợp" />
            </Box>
          ) : null}

          {!query.isPending && !query.isError && employees.length ? (
            <EmployeeTable employees={employees} onOpenMenu={openMenu} onSelect={setSelectedUserId} />
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>

      {/* Apple-styled Action Menu */}
      <EmployeeActionMenu
        anchorEl={menuAnchor}
        onAssignRole={openRoleDialog}
        onClose={closeMenu}
        onToggleStatus={() => {
          if (actionEmployee) setStatusTarget(actionEmployee);
          closeMenu();
        }}
        onView={() => {
          if (actionEmployee) setSelectedUserId(actionEmployee.id);
          closeMenu();
        }}
        status={actionEmployee?.status}
      />

      <ErgConfirmDialog
        confirmLabel={statusTarget?.status === "ACTIVE" ? "Deactive" : "Active"}
        description="Thay đổi trạng thái có thể thu hồi toàn bộ session của nhân sự."
        destructive={statusTarget?.status === "ACTIVE"}
        onCancel={() => setStatusTarget(undefined)}
        onConfirm={() => {
          if (statusTarget) {
            void commands.status.mutateAsync({
              status: statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              userId: statusTarget.id,
            });
          }
          setStatusTarget(undefined);
        }}
        open={Boolean(statusTarget)}
        title={statusTarget?.status === "ACTIVE" ? "Deactive tài khoản" : "Active tài khoản"}
      />

      {/* Role Assignment Dialog */}
      <RoleAssignDialog
        onClose={() => setRoleDialogOpen(false)}
        onConfirm={assignRole}
        onRoleNameChange={setRoleName}
        open={roleDialogOpen}
        pending={commands.roles.isPending}
        roleName={roleName}
        roles={rolesQuery.data}
      />

      {/* Detail Drawer */}
      <EmployeeDetailDrawer
        key={selectedUserId ?? "none"}
        tenantId={tenantId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(undefined)}
      />

      {/* Create Employee Wizard */}
      <CreateEmployeeWizard
        tenantId={tenantId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </ErgContentBand>
  );
}
