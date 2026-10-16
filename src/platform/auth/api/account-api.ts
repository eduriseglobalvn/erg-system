import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

export type LoginSessionLog = {
  sessionId: string;
  deviceId?: string;
  deviceName?: string;
  portal?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  current: boolean;
  revoked: boolean;
  revokedReason?: string;
  expiresAt?: string;
  createdAt?: string;
  lastSeenAt?: string;
};

export async function listMyLoginSessions(signal?: AbortSignal) {
  const response = await apiRequest<{ items: LoginSessionLog[] }>(API_ENDPOINTS.account.sessions, {
    portal: "lms",
    ...(signal ? { signal } : {}),
  });
  return response.items;
}
