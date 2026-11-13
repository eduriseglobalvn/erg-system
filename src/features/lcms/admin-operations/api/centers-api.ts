import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest, getBackOfficePortal, hasApiBase } from "@/lib/api-client";
import type { ClassroomSchool } from "@/domain/school/classroom-types";

/**
 * Fetches the list of all education units (centers/schools) from the Go backend.
 * This includes the root "Hệ thống ERG" and all sub-schools.
 */
export async function getCenters(): Promise<ClassroomSchool[]> {
  try {
    const data = await apiRequest<ClassroomSchool[]>(API_ENDPOINTS.centers, { portal: getBackOfficePortal() });
    return data;
  } catch (error) {
    if (hasApiBase()) throw error;
    return [];
  }
}
