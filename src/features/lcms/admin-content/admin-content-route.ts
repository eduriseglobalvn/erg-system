import {
  ADMIN_CONTENT_HOME_PATH,
  ADMIN_CONTENT_ROUTE_PATHS,
  ADMIN_CONTENT_ROUTE_PREFIX,
} from "@/app/portal-route-registry";
import { adminPath, stripWorkspacePath } from "@/platform/workspaces/workspace-paths";
import {
  COURSE_STRUCTURE_WORKSPACE_LABEL,
  LEARNING_RESOURCE_WORKSPACE_LABEL,
} from "@/components/learning-resources/learning-resource-workspace-labels";

export { ADMIN_CONTENT_HOME_PATH, ADMIN_CONTENT_ROUTE_PATHS, ADMIN_CONTENT_ROUTE_PREFIX };

export const ADMIN_CONTENT_SECTIONS = [
  {
    key: "structure",
    label: COURSE_STRUCTURE_WORKSPACE_LABEL,
    canonicalPath: `${ADMIN_CONTENT_ROUTE_PREFIX}/structure`,
    legacyPath: "/structure",
    variant: "admin-internal-docs",
  },
  {
    key: "resources",
    label: LEARNING_RESOURCE_WORKSPACE_LABEL,
    canonicalPath: `${ADMIN_CONTENT_ROUTE_PREFIX}/resources`,
    legacyPath: "/resources",
    variant: "admin-internal-docs",
  },
  {
    key: "quiz-bank",
    label: "Ngân hàng bài tập",
    canonicalPath: `${ADMIN_CONTENT_ROUTE_PREFIX}/quiz-bank`,
    legacyPath: "/quiz-bank",
    variant: "quiz-bank",
  },
  {
    key: "questions",
    label: "Ngân hàng câu hỏi",
    canonicalPath: `${ADMIN_CONTENT_ROUTE_PREFIX}/questions`,
    legacyPath: "/questions",
    variant: "question-bank",
  },
  {
    key: "quiz-editor",
    label: "Tạo Quiz",
    canonicalPath: `${ADMIN_CONTENT_ROUTE_PREFIX}/quiz-editor`,
    legacyPath: "/quiz-editor",
    variant: "quiz-editor",
  },
] as const;

export type AdminContentSection = (typeof ADMIN_CONTENT_SECTIONS)[number];
export type AdminContentSectionKey = AdminContentSection["key"];

function splitPathSuffix(pathname: string) {
  const value = pathname.trim() || "/";
  const suffixIndex = value.search(/[?#]/);
  return suffixIndex < 0
    ? { path: value, suffix: "" }
    : { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function normalizePath(pathname: string) {
  const path = splitPathSuffix(pathname).path;
  if (path === "/") return path;
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

export function isAdminContentPath(pathname: string) {
  const path = normalizePath(pathname);
  return path === ADMIN_CONTENT_ROUTE_PREFIX || path.startsWith(`${ADMIN_CONTENT_ROUTE_PREFIX}/`);
}

export function adminContentSectionForPath(pathname: string): AdminContentSection | null {
  const path = normalizePath(pathname);
  return ADMIN_CONTENT_SECTIONS.find(
    (section) => path === section.canonicalPath || path.startsWith(`${section.canonicalPath}/`),
  ) ?? null;
}

export function canonicalAdminContentPath(pathname: string) {
  const { path: rawPath, suffix } = splitPathSuffix(pathname);
  const path = normalizePath(rawPath);
  if (isAdminContentPath(path)) return `${path}${suffix}`;

  const section = ADMIN_CONTENT_SECTIONS.find(
    (candidate) => path === candidate.legacyPath || path.startsWith(`${candidate.legacyPath}/`),
  );
  if (!section) return `${path}${suffix}`;

  return `${section.canonicalPath}${path.slice(section.legacyPath.length)}${suffix}`;
}

export function legacyAdminContentPath(pathname: string) {
  const { path: rawPath, suffix } = splitPathSuffix(pathname);
  const path = normalizePath(rawPath);
  const section = adminContentSectionForPath(path);
  if (!section) return `${path}${suffix}`;

  return `${section.legacyPath}${path.slice(section.canonicalPath.length)}${suffix}`;
}

export function adminContentPathForSection(key: AdminContentSectionKey) {
  return ADMIN_CONTENT_SECTIONS.find((section) => section.key === key)?.canonicalPath ?? ADMIN_CONTENT_HOME_PATH;
}

/** Canonicalizes every Admin-owned UI path, including non-content operations. */
export function canonicalAdminWorkspacePath(pathname: string) {
  const canonicalContentPath = canonicalAdminContentPath(pathname);
  if (isAdminContentPath(canonicalContentPath)) return canonicalContentPath;
  const { path, suffix } = splitPathSuffix(canonicalContentPath);
  if (path === "/admin" || path.startsWith("/admin/")) return `${path}${suffix}`;
  return `${adminPath(path)}${suffix}`;
}

/** Converts a canonical Admin path back to the internal legacy segment used by feature presenters. */
export function legacyAdminWorkspacePath(pathname: string) {
  const contentPath = legacyAdminContentPath(pathname);
  if (contentPath !== normalizePath(pathname)) return contentPath;
  return stripWorkspacePath(pathname, "ADMIN");
}
