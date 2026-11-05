import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { MenuItem } from "@/components/portal/ErgPortalLayout";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { flattenMenuItems, getMenuItemDescription } from "@/features/lcms/admin-menu";
import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";

export const FLAT_MENU_ITEMS = flattenMenuItems(ADMIN_MENU_GROUPS);

export function AdminHeaderBreadcrumb({ activeItem }: { activeItem: MenuItem }) {
  return (
  <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, minWidth: 0 }}>
    {activeItem.section && activeItem.section !== activeItem.label ? (
      <>
        <Typography noWrap sx={{ color: "#64748B", fontSize: { xs: 12, sm: 13 }, fontWeight: 500 }}>
          {activeItem.section}
        </Typography>
        <Typography sx={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1 }}>/</Typography>
      </>
    ) : null}
    <Typography noWrap sx={{ color: "#0F172A", fontSize: { xs: 12.5, sm: 13.5 }, fontWeight: 600 }}>
      {activeItem.label}
    </Typography>
  </Box>
  );
}

export function createClientIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveActiveMenuItem(pathname: string) {
  const normalized = pathname === "" ? "/" : pathname;
  const exact = FLAT_MENU_ITEMS.find((item) => item.path === normalized);
  if (exact) return exact;

  const home = FLAT_MENU_ITEMS[0];
  const section = normalized.split("/").slice(0, 3).join("/");
  return (
    FLAT_MENU_ITEMS
      .filter((item) => item.path && item.path !== "/" && item !== home && normalized.startsWith(item.path))
      .sort((left, right) => (right.path?.length ?? 0) - (left.path?.length ?? 0))[0]
    // Screens reached inside a flow (e.g. /admin/schools/classes) have no menu entry: show their menu group, not "Trang chủ".
    ?? FLAT_MENU_ITEMS.find((item) => item.children?.some((child) => child.path?.startsWith(`${section}/`)))
    ?? home
  );
}

export function toDashboardLeaf(menuItem: MenuItem): DashboardLeaf {
  return {
    id: menuItem.id ?? menuItem.path?.replace(/^\/+/, "").replaceAll("/", "-") ?? "placeholder",
    title: menuItem.label,
    breadcrumb: ["Admin", menuItem.section ?? "Tổng quan", menuItem.label],
    description: getMenuItemDescription(menuItem),
    variant: menuItem.variant ?? "placeholder",
  };

}
