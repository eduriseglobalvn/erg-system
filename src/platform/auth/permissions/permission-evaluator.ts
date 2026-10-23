export type PermissionEvaluationInput = {
  permission: string;
  grantedPermissions?: readonly string[];
  deniedPermissions?: readonly string[];
  requestedScopeId?: string;
  assignedScopeIds?: readonly string[];
};

export function evaluatePermission({
  permission,
  grantedPermissions = [],
  deniedPermissions = [],
  requestedScopeId,
  assignedScopeIds,
}: PermissionEvaluationInput) {
  const normalizedPermission = normalizePermission(permission);
  if (!normalizedPermission) return false;

  if (requestedScopeId && assignedScopeIds && !assignedScopeIds.includes("*") && !assignedScopeIds.includes(requestedScopeId)) {
    return false;
  }

  if (deniedPermissions.some((candidate) => permissionPatternMatches(candidate, normalizedPermission))) return false;
  return grantedPermissions.some((candidate) => permissionPatternMatches(candidate, normalizedPermission));
}

export function permissionPatternMatches(pattern: string, permission: string) {
  const normalizedPattern = normalizePermission(pattern);
  const normalizedPermission = normalizePermission(permission);
  if (!normalizedPattern || !normalizedPermission) return false;
  if (normalizedPattern === "*") return true;
  if (normalizedPattern === normalizedPermission) return true;
  if (!normalizedPattern.endsWith(".*")) return false;
  return normalizedPermission.startsWith(normalizedPattern.slice(0, -1));
}

function normalizePermission(value: string) {
  return value.trim().toLowerCase();
}
