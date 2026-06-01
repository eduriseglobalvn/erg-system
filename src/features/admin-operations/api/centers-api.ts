import { apiRequest, getBackOfficePortal } from "@/lib/api-client";
import type { ClassroomSchool } from "@/features/classroom/types/classroom-types";

/**
 * Fetches the list of all education units (centers/schools) from the Go backend.
 * This includes the root "Hệ thống ERG" and all sub-schools.
 */
export async function getCenters(): Promise<ClassroomSchool[]> {
  try {
    const data = await apiRequest<ClassroomSchool[]>("/api/v1/centers", { portal: getBackOfficePortal() });
    return data;
  } catch (error) {
    console.error("[CentersAPI] Failed to fetch centers:", error);
    // Return empty list on failure to prevent UI crashes
    return [];
  }
}

/**
 * Fetches the access scopes for a specific user.
 * Defines which centers and modules (LMS/HocLieu) the user can access.
 */
export async function getUserAccessScopes(userID: string) {
  return apiRequest(`/api/v1/users/${userID}/access-scopes`, { portal: getBackOfficePortal() });
}
