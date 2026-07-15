import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { LMS_ROUTE_PERMISSIONS, type LmsPermission } from "@/platform/auth/permissions/lms-permission-catalog";

type NavigationItem = {
  path?: string;
  children?: NavigationItem[];
};

type NavigationGroup<Item extends NavigationItem> = {
  items: Item[];
};

export function permissionForLmsPath(path: string): LmsPermission | null {
  const normalized = path.split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, "") ?? "";
  const route = Object.keys(LMS_ROUTE_PERMISSIONS)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => normalized === candidate || normalized.startsWith(`${candidate}/`));
  return route ? LMS_ROUTE_PERMISSIONS[route as keyof typeof LMS_ROUTE_PERMISSIONS] : null;
}

export function canNavigateToLmsPath(path: string, grantedPermissions: readonly string[] = [], deniedPermissions: readonly string[] = []) {
  const permission = permissionForLmsPath(path);
  if (!permission) return false;
  return evaluatePermission({ permission, grantedPermissions, deniedPermissions });
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
