/**
 * Shared query-key primitives. Keeping normalization here prevents subtle
 * cache collisions when a portal, tenant, or account value is optional.
 */
export type QueryPortal = "shared" | "lms" | "lcms" | "crm" | "elearning";

export type QueryScope = {
  portal: QueryPortal | string;
  tenantId: string;
  accountId?: string | null;
};

export function normalizeQueryScopePart(value: string | null | undefined, fallback = "anonymous") {
  const normalized = value?.trim();
  return normalized || fallback;
}

export function scopedQueryKey<T extends readonly unknown[]>(
  family: string,
  resource: string,
  scope: QueryScope,
  ...parts: T
) {
  return [
    family,
    resource,
    normalizeQueryScopePart(scope.portal, "shared"),
    normalizeQueryScopePart(scope.tenantId, "default"),
    normalizeQueryScopePart(scope.accountId),
    ...parts,
  ] as const;
}

export function tenantQueryKey<T extends readonly unknown[]>(family: string, resource: string, tenantId: string, ...parts: T) {
  return [family, resource, normalizeQueryScopePart(tenantId, "default"), ...parts] as const;
}
