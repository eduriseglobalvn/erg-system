import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";

import type { MenuGroup, MenuItem } from "@/components/portal/ErgPortalLayout";
import type { ErgMobileDockItem } from "@/components/portal/erg-mobile-dock";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { ROUTE_PERMISSION_MATRIX } from "@/platform/auth/permissions/route-permission-matrix";
import { adminPath } from "@/platform/workspaces/workspace-paths";

export type AdminMobileSection = "home" | "calendar" | "schools" | "inbox" | "timekeeping" | "all";

// Hộp thư and Chấm công point at routes later plans create; canNavigateToAdminPath hides them until the route matrix has a row.
export const ADMIN_MOBILE_DOCK_ITEMS: ReadonlyArray<ErgMobileDockItem<AdminMobileSection>> = [
  { id: "home", label: "Trang chủ", path: adminPath("/"), icon: TodayRoundedIcon },
  { id: "calendar", label: "Lịch", path: adminPath("/calendar"), icon: CalendarMonthRoundedIcon },
  { id: "schools", label: "Trường học", path: adminPath("/schools/list"), icon: SchoolRoundedIcon },
  { id: "inbox", label: "Hộp thư", path: adminPath("/notifications"), icon: InboxRoundedIcon },
  { id: "timekeeping", label: "Chấm công", path: adminPath("/employees/timekeeping"), icon: FingerprintRoundedIcon },
  // Opens the "Tất cả chức năng" sheet, which filters its own entries; never permission-gated here.
  { id: "all", label: "Tất cả", path: adminPath("/"), icon: AppsRoundedIcon, opensSheet: true },
];

/** Reachable when the matrix has a row for exactly this path (a parent row must not vouch for a child route that is not built) and the session holds its permission. */
export function canNavigateToAdminPath(path: string, grantedPermissions: readonly string[] = [], deniedPermissions: readonly string[] = []) {
  const entry = ROUTE_PERMISSION_MATRIX.find((candidate) => candidate.workspace === "ADMIN" && candidate.path === path);
  return Boolean(entry) && evaluatePermission({ permission: entry!.permission, grantedPermissions, deniedPermissions });
}

export function visibleAdminDockItems(canAccess: (path: string) => boolean): Array<ErgMobileDockItem<AdminMobileSection>> {
  return ADMIN_MOBILE_DOCK_ITEMS.filter((item) => item.opensSheet || canAccess(item.path));
}

const SECTION_PREFIXES: ReadonlyArray<readonly [Exclude<AdminMobileSection, "home" | "all">, readonly string[]]> = [
  ["calendar", ["/calendar"]],
  ["schools", ["/schools"]],
  ["inbox", ["/notifications"]],
  ["timekeeping", ["/employees/timekeeping", "/employees/timesheet"]],
];

/** Dock tab to light for a pathname; other admin screens light no tab. */
export function resolveAdminMobileSection(pathname: string): AdminMobileSection | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === adminPath("/")) return "home";
  const section = SECTION_PREFIXES.find(([, prefixes]) =>
    prefixes.some((prefix) => path === adminPath(prefix) || path.startsWith(`${adminPath(prefix)}/`)),
  );
  return section?.[0] ?? null;
}

/** Same pruning the LMS sidebar uses: drop leaves the session cannot open and groups left empty. */
export function filterAdminMenuGroups(groups: readonly MenuGroup[], canAccess: (path: string) => boolean): MenuGroup[] {
  const keep = (items: readonly MenuItem[]): MenuItem[] =>
    items.flatMap((item) => {
      const children = item.children ? keep(item.children) : undefined;
      if (item.path ? !canAccess(item.path) : !children?.length) return [];
      return [{ ...item, ...(children ? { children } : {}) }];
    });
  return groups.flatMap((group) => {
    const items = keep(group.items);
    return items.length ? [{ ...group, items }] : [];
  });
}
