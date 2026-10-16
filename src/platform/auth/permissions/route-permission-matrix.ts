import { ADMIN_CONTENT_ROUTE_PATHS, ADMIN_ENTERPRISE_CONNECTORS_PATH, ADMIN_LEARNING_STANDARDS_PATH, crmPaths, lcmsWorkspacePaths, lmsPaths } from "@/app/portal-route-registry";
import { LMS_ROUTE_PERMISSIONS, type LmsPermission } from "@/platform/auth/permissions/lms-permission-catalog";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { adminPath, studentPath, teacherPath } from "@/platform/workspaces/workspace-paths";

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage" | "assign" | "publish" | "submit" | "launch";

/** Permission names published by the BE permission catalog/runtime bindings. */
export type RoutePermission =
  | LmsPermission
  | "lms.admin"
  | "lms.school.read"
  | "lms.school.create"
  | "lms.school.update"
  | "lms.school.archive"
  | "lms.scope.read"
  | "lms.student.manage"
  | "lms.subject.manage"
  | "lms.enrollment.manage"
  | "lms.quiz.read"
  | "lms.quiz.create"
  | "lms.quiz.publish"
  | "lms.progress.read"
  | "content.manage"
  | "content.lifecycle.submit"
  | "content.lifecycle.approve"
  | "content.lifecycle.publish"
  | "content.lifecycle.archive"
  | "content.lifecycle.rollback"
  | "curriculum.manage"
  | "documents.manage"
  | "media.upload"
  | "media.delete"
  | "users.manage"
  | "operations.manage"
  | "platform.read"
  | "rbac.permission.read"
  | "rbac.role.read"
  | "rbac.role.assign"
  | "crm.school.read"
  | "crm.analytics.read"
  | "crm.deal.manage"
  | "seo.manage"
  | "elearning.assignment.read_self"
  | "learning.outcomes.read"
  | "learning.outcomes.manage"
  | "learning.outcomes.issue_certificate"
  | "learning.standards.read"
  | "learning.standards.manage"
  | "learning.standards.launch"
  | "enterprise.connectors.read"
  | "enterprise.connectors.manage"
  | "enterprise.connectors.sync";

export type RoutePermissionEntry = {
  readonly path: string;
  readonly workspace: Workspace;
  readonly resource: string;
  readonly action: PermissionAction;
  readonly permission: RoutePermission;
};

const ADMIN_CONTENT_PERMISSIONS: Record<string, Pick<RoutePermissionEntry, "resource" | "action" | "permission">> = {
  "/admin/content": { resource: "content", action: "manage", permission: "content.manage" },
  "/admin/content/structure": { resource: "content-structure", action: "manage", permission: "content.manage" },
  "/admin/content/resources": { resource: "resource", action: "read", permission: "lms.resource.read" },
  "/admin/content/questions": { resource: "quiz", action: "read", permission: "lms.quiz.read" },
  "/admin/content/quiz-bank": { resource: "quiz", action: "read", permission: "lms.quiz.read" },
  "/admin/content/quiz-editor": { resource: "quiz", action: "create", permission: "lms.quiz.create" },
};

const ADMIN_EXTRA_PERMISSIONS: Record<string, Pick<RoutePermissionEntry, "resource" | "action" | "permission">> = {
  "question-types": { resource: "quiz", action: "read", permission: "lms.quiz.read" },
  "settings/permissions": { resource: "permission", action: "read", permission: "rbac.permission.read" },
  "settings/roles": { resource: "role", action: "read", permission: "rbac.role.read" },
  users: { resource: "user", action: "manage", permission: "users.manage" },
  employees: { resource: "user", action: "manage", permission: "users.manage" },
  "employees/access-logs": { resource: "user.audit", action: "read", permission: "users.manage" },
  "report/dashboard-report": { resource: "report", action: "read", permission: "lms.report.read" },
  "report/crm-report": { resource: "report", action: "read", permission: "crm.analytics.read" },
  "report/student-report": { resource: "report", action: "read", permission: "lms.report.read" },
  "report/task-report": { resource: "report", action: "read", permission: "lms.report.read" },
  "report/cash-flow-report": { resource: "report", action: "read", permission: "operations.manage" },
  "report/pnl-report": { resource: "report", action: "read", permission: "crm.analytics.read" },
  "learning-outcomes": { resource: "learning-outcomes", action: "manage", permission: "learning.outcomes.manage" },
};

function adminEntry(path: string): RoutePermissionEntry {
  const legacyPath = path.replace(/^\/+|\/+$/g, "");
  const normalizedPath = canonicalAdminRoutePath(`/${legacyPath}`);
  const contentPermission = ADMIN_CONTENT_PERMISSIONS[normalizedPath];
  if (contentPermission) return { path: normalizedPath, workspace: "ADMIN", ...contentPermission };

  const extraPermission = ADMIN_EXTRA_PERMISSIONS[legacyPath];
  if (extraPermission) return { path: normalizedPath, workspace: "ADMIN", ...extraPermission };

  if (legacyPath.startsWith("schools")) {
    const action = legacyPath.includes("imports") || legacyPath.includes("reviews") ? "update" : "read";
    return { path: normalizedPath, workspace: "ADMIN", resource: "school", action, permission: action === "update" ? "lms.school.update" : "lms.school.read" };
  }
  if (legacyPath === "questions" || legacyPath === "quiz-bank" || legacyPath === "quiz-editor" || legacyPath === "rubrics" || legacyPath === "session-templates" || legacyPath === "report-templates") {
    return { path: normalizedPath, workspace: "ADMIN", resource: "quiz", action: legacyPath === "quiz-editor" ? "create" : "read", permission: legacyPath === "quiz-editor" ? "lms.quiz.create" : "lms.quiz.read" };
  }
  if (legacyPath === "legal" || legacyPath.startsWith("settings") || legacyPath.startsWith("setting/")) {
    return { path: normalizedPath, workspace: "ADMIN", resource: "platform", action: "read", permission: "platform.read" };
  }
  if (legacyPath === "customers" || legacyPath === "center-tasks" || legacyPath.startsWith("integration/")) {
    return { path: normalizedPath, workspace: "ADMIN", resource: "operations", action: "manage", permission: "operations.manage" };
  }
  if (legacyPath.startsWith("report/")) {
    return { path: normalizedPath, workspace: "ADMIN", resource: "report", action: "read", permission: "lms.report.read" };
  }
  return { path: normalizedPath, workspace: "ADMIN", resource: "admin", action: "manage", permission: "lms.admin" };
}

function permissionMetadata(permission: LmsPermission): Pick<RoutePermissionEntry, "resource" | "action"> {
  const parts = permission.split(".");
  return { resource: parts.slice(1, -1).join(".") || parts[0], action: (parts.at(-1) ?? "read") as PermissionAction };
}

function teacherEntry(path: string): RoutePermissionEntry {
  const route = path.replace(/^\/+|\/+$/g, "") as keyof typeof LMS_ROUTE_PERMISSIONS;
  const permission = LMS_ROUTE_PERMISSIONS[route] as LmsPermission;
  return { path: teacherPath(`/${route}`), workspace: "TEACHER", ...permissionMetadata(permission), permission };
}

function crmEntry(path: string): RoutePermissionEntry {
  const permission = path === "seo"
    ? "seo.manage"
    : path === "seo/schools"
      ? "crm.school.read"
      : path === "seo/pnl"
        ? "crm.analytics.read"
        : "crm.deal.manage";
  return {
    path: `/${path}`,
    workspace: "CRM",
    resource: permission === "seo.manage" ? "seo" : permission.replace("crm.", "").replace(".manage", "").replace(".read", ""),
    action: permission.endsWith("read") ? "read" : "manage",
    permission,
  };
}

export const ROUTE_PERMISSION_MATRIX: readonly RoutePermissionEntry[] = [
  { path: "/admin", workspace: "ADMIN", resource: "admin", action: "manage", permission: "lms.admin" },
  ...ADMIN_CONTENT_ROUTE_PATHS.map((path) => ({
    ...(ADMIN_CONTENT_PERMISSIONS[path] ?? ADMIN_CONTENT_PERMISSIONS["/admin/content"]),
    path,
    workspace: "ADMIN" as const,
  })),
  ...lcmsWorkspacePaths.map(adminEntry),
  adminEntry("question-types"),
  { path: "/teacher", workspace: "TEACHER", resource: "dashboard", action: "read", permission: "lms.dashboard.read" },
  { path: "/teacher/exams/portable", workspace: "TEACHER", resource: "exam.portable", action: "launch", permission: "lms.quiz.read" },
  { path: "/teacher/downloads/desktop", workspace: "TEACHER", resource: "desktop.release", action: "read", permission: "lms.dashboard.read" },
  ...lmsPaths.map(teacherEntry),
  { path: "/student", workspace: "STUDENT", resource: "assignment", action: "read", permission: "elearning.assignment.read_self" },
  { path: "/student/exams/portable", workspace: "STUDENT", resource: "exam.portable", action: "launch", permission: "elearning.assignment.read_self" },
  { path: "/student/downloads/desktop", workspace: "STUDENT", resource: "desktop.release", action: "read", permission: "elearning.assignment.read_self" },
  { path: "/admin/learning-outcomes", workspace: "ADMIN", resource: "learning-outcomes", action: "manage", permission: "learning.outcomes.manage" },
  { path: ADMIN_LEARNING_STANDARDS_PATH, workspace: "ADMIN", resource: "learning-standards", action: "read", permission: "learning.standards.read" },
  { path: ADMIN_ENTERPRISE_CONNECTORS_PATH, workspace: "ADMIN", resource: "enterprise-connectors", action: "read", permission: "enterprise.connectors.read" },
  { path: "/teacher/learning-outcomes", workspace: "TEACHER", resource: "learning-outcomes", action: "read", permission: "learning.outcomes.read" },
  { path: "/student/learning-outcomes", workspace: "STUDENT", resource: "learning-outcomes", action: "read", permission: "learning.outcomes.read" },
  ...crmPaths.map(crmEntry),
];

const sortedMatrix = [...ROUTE_PERMISSION_MATRIX].sort((left, right) => right.path.length - left.path.length);
const nestedRoutePrefixes = new Set(
  sortedMatrix
    .filter((entry) => entry.path !== "/admin" && sortedMatrix.some((candidate) => candidate.path.startsWith(`${entry.path}/`)))
    .map((entry) => entry.path),
);

export function routePermissionForPath(pathname: string, workspace: Workspace): RoutePermissionEntry | undefined {
  const rawPath = normalizePath(pathname);
  const explicitWorkspace = rawPath.match(/^\/(admin|teacher|student|crm)(?:\/|$)/)?.[1];
  const expectedWorkspacePrefix = workspace.toLowerCase();
  if (explicitWorkspace && explicitWorkspace !== expectedWorkspacePrefix) return undefined;
  const path = workspace === "ADMIN"
    ? canonicalAdminRoutePath(rawPath)
    : workspace === "TEACHER"
      ? teacherPath(rawPath)
      : workspace === "STUDENT"
        ? studentPath(rawPath)
        : rawPath;
  return sortedMatrix.find((entry) =>
    entry.workspace === workspace && (entry.path === path || (nestedRoutePrefixes.has(entry.path) && path.startsWith(`${entry.path}/`))),
  );
}

export function isProtectedWorkspacePath(pathname: string) {
  const path = normalizePath(pathname);
  return ["/admin", "/teacher", "/student", "/crm", "/schools", "/users", "/employees", "/seo", "/home", "/dashboard", "/homework", "/calendar", "/score", "/attendance", "/reports", "/admin/learning-outcomes", "/teacher/learning-outcomes", "/student/learning-outcomes"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function normalizePath(pathname: string) {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const normalized = `/${withoutQuery.replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? "/" : normalized;
}

export function matrixCompletenessGaps() {
  const expected = [
    ...lcmsWorkspacePaths.map((path) => canonicalAdminRoutePath(`/${path}`)),
    ...lmsPaths.map((path) => teacherPath(`/${path}`)),
    ...crmPaths.map((path) => `/${path}`),
    ...ADMIN_CONTENT_ROUTE_PATHS,
    "/admin",
    "/teacher",
    "/student",
    "/teacher/exams/portable",
    "/teacher/downloads/desktop",
    "/student/exams/portable",
    "/student/downloads/desktop",
  ];
  return expected.filter((path) => !ROUTE_PERMISSION_MATRIX.some((entry) => entry.path === path));
}

function canonicalAdminRoutePath(pathname: string) {
  const normalized = normalizePath(pathname);
  if (normalized === "/admin" || normalized.startsWith("/admin/")) return normalized;
  const contentSegment = ["resources", "questions", "quiz-bank", "quiz-editor"].find(
    (segment) => normalized === `/${segment}` || normalized.startsWith(`/${segment}/`),
  );
  if (contentSegment) return `/admin/content/${contentSegment}${normalized.slice(contentSegment.length + 1)}`;
  return adminPath(normalized);
}
