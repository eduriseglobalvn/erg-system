import { PermissionCatalogWorkspace } from "@/features/access-management/components/permission-catalog-workspace";

export function PermissionCatalogPage({ tenantId }: { tenantId: string }) {
  return <PermissionCatalogWorkspace tenantId={tenantId} />;
}

export default PermissionCatalogPage;
