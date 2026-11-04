import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { resolveCurrentPortal, type StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import type { ApiRequestOptions } from "./response";

export function portalFromPath(path: string): StoredAuthSession["portal"] | undefined {
  const normalized = path.toLowerCase();
  if (normalized.includes(API_ENDPOINTS.routing.curriculumBase) || normalized.includes(API_ENDPOINTS.routing.contentBase)) return "lcms";
  if (
    normalized.includes(API_ENDPOINTS.legacy.v1UsersMe) ||
    normalized.includes(`${API_ENDPOINTS.routing.legacyUsersBase}/me`)
  ) {
    return resolveCurrentPortal();
  }
  if (
    normalized.includes(API_ENDPOINTS.routing.adminBase) ||
    normalized.includes(API_ENDPOINTS.routing.legacyAdminBase) ||
    normalized.includes(API_ENDPOINTS.routing.legacyUsersBase) ||
    normalized.includes(API_ENDPOINTS.routing.usersBase) ||
    normalized.includes(API_ENDPOINTS.routing.centers)
  ) {
    return currentBackOfficePortal();
  }
  if (normalized.includes(API_ENDPOINTS.routing.versionedBase)) return "lms";
  if (normalized.includes(API_ENDPOINTS.routing.legacyLmsBase)) return "lms";
  if (normalized.includes(API_ENDPOINTS.routing.elearningBase)) return "elearning";
  return undefined;
}

export function currentBackOfficePortal(): StoredAuthSession["portal"] {
  const portal = resolveCurrentPortal();
  return portal === "crm" || portal === "lcms" ? portal : "admin";
}

export function requiresAuth(path: string, init?: ApiRequestOptions) {
  if (init?.auth) return init.auth === "required";
  const normalized = path.toLowerCase().split("?")[0] ?? "";

  if (isPublicApiPath(normalized)) {
    return false;
  }

  return Boolean(portalFromPath(normalized));
}

function isPublicApiPath(path: string) {
  return (
    path === API_ENDPOINTS.auth.login ||
    path === API_ENDPOINTS.auth.refresh
  );
}
