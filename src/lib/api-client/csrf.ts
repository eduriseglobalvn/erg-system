import { getApiBase } from "@/lib/platform";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { ApiClientError, createRequestId } from "./errors";

let csrfTokenPromise: Promise<{ headerName: string; token: string }> | null = null;

export function isCommandMethod(method?: string) {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes((method ?? "GET").toUpperCase());
}

export async function getCsrfToken() {
  if (csrfTokenPromise) return csrfTokenPromise;
  csrfTokenPromise = (async () => {
    const response = await fetch(`${getApiBase()}${API_ENDPOINTS.auth.csrf}`, {
      credentials: "include",
      headers: { "X-Request-ID": createRequestId() },
    });
    if (!response.ok) {
      throw new ApiClientError("Cannot initialize CSRF protection.", "CSRF_INITIALIZATION_FAILED", response.status);
    }
    return response.json() as Promise<{ headerName: string; token: string }>;
  })();
  try {
    return await csrfTokenPromise;
  } catch (error) {
    csrfTokenPromise = null;
    throw error;
  }
}
