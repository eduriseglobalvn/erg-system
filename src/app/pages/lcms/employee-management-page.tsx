import { EmployeeListWorkspace } from "@/features/employee-management/components/employee-list-workspace";

export function EmployeeManagementPage({ tenantId }: { tenantId: string }) {
  return <EmployeeListWorkspace tenantId={tenantId} />;
}

export default EmployeeManagementPage;
