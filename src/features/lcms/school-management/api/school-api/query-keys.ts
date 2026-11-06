export const schoolManagementQueryKeys = {
  root: (tenantId: string, accountId: string) =>
    ["lcms", "school-management", tenantId, accountId] as const,
  directory: (tenantId: string, accountId: string, search = "") =>
    [...schoolManagementQueryKeys.root(tenantId, accountId), "directory", search] as const,
  operations: (tenantId: string, accountId: string, schoolId: string) =>
    [...schoolManagementQueryKeys.root(tenantId, accountId), "operations", schoolId] as const,
};
