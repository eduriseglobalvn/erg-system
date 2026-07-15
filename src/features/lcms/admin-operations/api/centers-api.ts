import { apiRequest, getBackOfficePortal, hasApiBase } from "@/lib/api-client";
import type { ClassroomSchool } from "@/features/lms/classroom/types/classroom-types";

/**
 * Fetches the list of all education units (centers/schools) from the Go backend.
 * This includes the root "Hệ thống ERG" and all sub-schools.
 */
export async function getCenters(): Promise<ClassroomSchool[]> {
  try {
    const data = await apiRequest<ClassroomSchool[]>("/api/v1/centers", { portal: getBackOfficePortal() });
    return data;
  } catch (error) {
    if (hasApiBase()) throw error;
    return [];
  }
}

/**
 * Fetches the access scopes for a specific user.
 * Defines which centers and modules (LMS/learning resources) the user can access.
 */
export async function getUserAccessScopes(userID: string) {
  return apiRequest(`/api/v1/users/${userID}/access-scopes`, { portal: getBackOfficePortal() });
}
