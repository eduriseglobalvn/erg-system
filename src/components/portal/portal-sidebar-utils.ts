import type { MenuItem } from "./ErgPortalLayout";
import { COLLAPSED_LABELS } from "./portal-sidebar-styles";

export function normalizedLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function isReportMenu(label: string) {
  return normalizedLabel(label).includes("bao cao");
}

export function isStudentLabel(label: string) {
  return normalizedLabel(label).includes("hoc vien");
}

export function getCollapsedLabel(label: string) {
  return COLLAPSED_LABELS[label] ?? label;
}

export function pathMatches(
  path: string | undefined,
  currentPath: string,
  allowPrefix = false,
) {
  if (!path) return false;
  if (path === currentPath) return true;
  if (!allowPrefix || path === "/") return false;
  return currentPath.startsWith(`${path}/`);
}

export function isChildBranchActive(item: MenuItem, currentPath: string) {
  return Boolean(
    item.children?.some((child) => {
      return (
        pathMatches(child.path, currentPath, false) ||
        child.children?.some((grandChild) => {
          return pathMatches(grandChild.path, currentPath, false);
        })
      );
    }),
  );
}
