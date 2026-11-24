import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { LMS_ROUTE_PERMISSIONS, type LmsRoutePermission } from "@/platform/auth/permissions/lms-permission-catalog";

type NavigationItem = {
  path?: string;
  children?: NavigationItem[];
};

type NavigationGroup<Item extends NavigationItem> = {
  items: Item[];
};

/** Teacher pages routed outside the LMS shell (own row in ROUTE_PERMISSION_MATRIX) that still need a sidebar entry. */
const STANDALONE_ROUTE_PERMISSIONS = { games: "lms.games.host" } as const;
const NAVIGATION_PERMISSIONS: Record<string, LmsRoutePermission | "lms.games.host"> = { ...LMS_ROUTE_PERMISSIONS, ...STANDALONE_ROUTE_PERMISSIONS };

export function permissionForLmsPath(path: string): LmsRoutePermission | "lms.games.host" | null {
  const normalized = normalizeLmsPath(path);
  const route = Object.keys(NAVIGATION_PERMISSIONS)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => normalized === candidate || normalized.startsWith(`${candidate}/`));
  return route ? NAVIGATION_PERMISSIONS[route] : null;
}

export function canNavigateToLmsPath(path: string, grantedPermissions: readonly string[] = [], deniedPermissions: readonly string[] = []) {
  const normalized = normalizeLmsPath(path);
  if (!normalized || normalized === "home" || normalized === "dashboard" || normalized === "help") return true;
  const permission = permissionForLmsPath(path);
  if (!permission) return false;
  return evaluatePermission({ permission, grantedPermissions, deniedPermissions });
}

function normalizeLmsPath(path: string) {
  const trimmed = path.split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, "") ?? "";
  return trimmed === "teacher" ? "" : trimmed.replace(/^teacher\//, "");
}

export function filterLmsNavigation<Group extends NavigationGroup<Item>, Item extends NavigationItem>(
  groups: readonly Group[],
  grantedPermissions: readonly string[] = [],
  deniedPermissions: readonly string[] = [],
): Group[] {
  return groups.flatMap((group) => {
    const items = filterItems(group.items, grantedPermissions, deniedPermissions);
    return items.length ? [{ ...group, items } as Group] : [];
  });
}

function filterItems<Item extends NavigationItem>(
  items: readonly Item[],
  grantedPermissions: readonly string[],
  deniedPermissions: readonly string[],
): Item[] {
  return items.flatMap((item) => {
    const children = item.children ? filterItems(item.children as Item[], grantedPermissions, deniedPermissions) : undefined;
    const allowed = item.path ? canNavigateToLmsPath(item.path, grantedPermissions, deniedPermissions) : Boolean(children?.length);
    if (!allowed) return [];
    return [{ ...item, ...(children ? { children } : {}) } as Item];
  });
}
