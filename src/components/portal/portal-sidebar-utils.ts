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

const ROOT_WORKSPACE_PATHS = new Set([
  "/",
  "/admin",
  "/teacher",
  "/teacher/home",
  "/student",
  "/crm",
]);

export function pathMatches(
  path: string | undefined,
  currentPath: string,
  allowPrefix = false,
) {
  if (!path) return false;
  const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  const normalizedCurrent =
    currentPath.length > 1 && currentPath.endsWith("/")
      ? currentPath.slice(0, -1)
      : currentPath;

  if (normalizedPath === normalizedCurrent) return true;
  if (!allowPrefix || ROOT_WORKSPACE_PATHS.has(normalizedPath)) return false;
  return normalizedCurrent.startsWith(`${normalizedPath}/`);
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
