import type { CanonicalLmsWorkspace } from "./workspace-route";

/**
 * Builds a public URL inside a canonical LMS workspace.
 *
 * Route ownership is explicit at the URL boundary. Feature modules may still
 * pass their legacy relative segment (for example `/class-log`), but the
 * returned URL always carries `/admin`, `/teacher`, or `/student`.
 */
export function workspacePath(workspace: CanonicalLmsWorkspace, pathname = "/") {
  const prefix = `/${workspace.toLowerCase()}`;
  const { path, suffix } = splitPathSuffix(pathname);
  if (path === prefix || path.startsWith(`${prefix}/`)) return `${path}${suffix}`;
  const suffixPath = path === "/" ? "" : path;
  return `${prefix}${suffixPath}${suffix}`;
}

export function adminPath(pathname = "/") {
  return workspacePath("ADMIN", pathname);
}

export function teacherPath(pathname = "/") {
  return workspacePath("TEACHER", pathname);
}

export function studentPath(pathname = "/") {
  return workspacePath("STUDENT", pathname);
}

export function stripWorkspacePath(pathname: string, workspace: CanonicalLmsWorkspace) {
  const { path, suffix } = splitPathSuffix(pathname);
  const prefix = `/${workspace.toLowerCase()}`;
  if (path === prefix) return `/${suffix}`;
  if (path.startsWith(`${prefix}/`)) return `${path.slice(prefix.length)}${suffix}`;
  return `${path}${suffix}`;
}

function splitPathSuffix(pathname: string) {
  const value = pathname.trim() || "/";
  const suffixIndex = value.search(/[?#]/);
  const rawPath = suffixIndex < 0 ? value : value.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? "" : value.slice(suffixIndex);
  const normalizedPath = rawPath === "/" ? "/" : `/${rawPath.replace(/^\/+|\/+$/g, "")}`;
  return { path: normalizedPath, suffix };
}
