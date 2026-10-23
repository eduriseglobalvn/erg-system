import { RoleManagementWorkspace } from "@/features/access-management/components/role-management-workspace";

export function RoleManagementPage({ tenantId }: { tenantId: string }) {
  return <RoleManagementWorkspace tenantId={tenantId} />;
}

export default RoleManagementPage;
