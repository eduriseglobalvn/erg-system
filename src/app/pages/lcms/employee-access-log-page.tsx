import { EmployeeAccessLogWorkspace } from "@/features/employee-management/components/employee-access-log-workspace";

export default function EmployeeAccessLogPage({ tenantId }: { tenantId: string }) {
  return <EmployeeAccessLogWorkspace tenantId={tenantId} />;
}
