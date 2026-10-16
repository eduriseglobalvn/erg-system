import type { MenuGroup, MenuItem } from "@/components/portal/ErgPortalLayout";

import { ADMIN_CONTENT_SECTIONS } from "./admin-content-route";
import { LCMS_MENU_GROUPS } from "@/features/lcms/lcms-menu";
import { adminPath } from "@/platform/workspaces/workspace-paths";

const LEGACY_CONTENT_PATHS = new Set([
  ...ADMIN_CONTENT_SECTIONS.map((section) => section.legacyPath),
  "/resources",
  "/quiz-bank",
  "/questions",
  "/quiz-editor",
]);

const contentMenuItem: MenuItem = {
  id: "admin-content",
  label: "Nội dung",
  path: "/admin/content",
  description: "Quản lý cấu trúc môn học, tài nguyên, ngân hàng câu hỏi và quiz cho Teacher Workspace.",
  children: ADMIN_CONTENT_SECTIONS.map((section) => ({
    id: section.key,
    label: section.label,
    path: section.canonicalPath,
    description: `Quản lý ${section.label.toLocaleLowerCase("vi-VN")} trong Admin.`,
    variant: section.variant,
  })),
};

function removeLegacyContentItems(item: MenuItem): MenuItem | null {
  if (item.path && LEGACY_CONTENT_PATHS.has(item.path)) return null;
  if (!item.children?.length) return item;

  const children = item.children.map(removeLegacyContentItems).filter((child): child is MenuItem => child !== null);
  if (!item.path && children.length === 0) return null;
  return { ...item, children: children.length ? children : undefined };
}

function withoutLegacyContent(groups: MenuGroup[]) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.map(removeLegacyContentItems).filter((item): item is MenuItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}

function canonicalizeAdminMenuItem(item: MenuItem): MenuItem {
  const path = item.path
    ? item.path === "/"
      ? "/admin"
      : item.path.startsWith("/admin/")
        ? item.path
        : adminPath(item.path)
    : undefined;
  return {
    ...item,
    ...(path ? { path } : {}),
    ...(item.children ? { children: item.children.map(canonicalizeAdminMenuItem) } : {}),
  };
}

export const ADMIN_MENU_GROUPS: MenuGroup[] = [
  ...withoutLegacyContent(LCMS_MENU_GROUPS).slice(0, 2),
  { label: "Nội dung", items: [contentMenuItem] },
  ...withoutLegacyContent(LCMS_MENU_GROUPS).slice(2),
].map((group) => ({
  ...group,
  items: group.items.map(canonicalizeAdminMenuItem),
}));

export const ADMIN_CONTENT_MENU_ITEM = contentMenuItem;
