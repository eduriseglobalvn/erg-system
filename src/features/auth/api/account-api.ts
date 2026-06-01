import { apiRequest } from "@/lib/api-client";

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

export async function listMyLoginSessions() {
  const response = await apiRequest<{ items: LoginSessionLog[] }>("/api/v1/users/me/sessions", { portal: "lms" });
  return response.items;
}
