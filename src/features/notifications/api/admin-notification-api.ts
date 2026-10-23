import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";

import { normalizePortal, type NotificationPortal, type NotificationPriority } from "./notification-api";

const ADMIN_NOTIFICATION_PORTAL = "admin";

export type AdminNotificationCommandInput = {
  actionUrl?: string;
  bodyPreview: string;
  data?: Record<string, unknown>;
  eventType: string;
  idempotencyKey?: string;
  portal?: NotificationPortal;
  priority?: NotificationPriority;
  sourceId?: string;
  sourceType?: string;
  title: string;
  topicName?: string;
  userIds?: string[];
};

export type AdminNotificationCommandResponse = {
  notificationId: string;
  outboxCount: number;
  recipientCount: number;
};

export type AdminNotificationStatsResponse = {
  dead: number;
  pending: number;
  retry: number;
  sent: number;
};

export type AdminNotificationOutboxRunResponse = {
  dead: number;
  failed: number;
  processed: number;
  retried: number;
  sent: number;
};

export async function sendAdminNotification(input: AdminNotificationCommandInput) {
  return postAdminNotificationCommand(API_ENDPOINTS.legacy.v1AdminNotificationsSend, input);
}

export async function broadcastAdminNotification(input: AdminNotificationCommandInput) {
  return postAdminNotificationCommand(API_ENDPOINTS.legacy.v1AdminNotificationsBroadcast, input);
}

export async function fetchAdminNotificationStats() {
  if (runtimeFixturesEnabled()) {
    return {
      dead: 0,
      pending: 2,
      retry: 0,
      sent: 12,
    } satisfies AdminNotificationStatsResponse;
  }

  return apiRequest<AdminNotificationStatsResponse>(API_ENDPOINTS.legacy.v1AdminNotificationsStats, {
    portal: ADMIN_NOTIFICATION_PORTAL,
  });
}

export async function runAdminNotificationOutbox() {
  if (runtimeFixturesEnabled()) {
    return {
      dead: 0,
      failed: 0,
      processed: 2,
      retried: 0,
      sent: 2,
    } satisfies AdminNotificationOutboxRunResponse;
  }

  return apiRequest<AdminNotificationOutboxRunResponse>(API_ENDPOINTS.legacy.v1AdminNotificationsOutboxRun, {
    method: "POST",
    portal: ADMIN_NOTIFICATION_PORTAL,
  });
}

async function postAdminNotificationCommand(path: string, input: AdminNotificationCommandInput) {
  const portal = normalizePortal(input.portal);
  const userIds = input.userIds?.filter(Boolean) ?? [];
  const topicName = input.topicName?.trim();

  if (!userIds.length && !topicName) {
    throw new Error("Admin notification target is required.");
  }

  const body = {
    ...input,
    portal,
    priority: input.priority ?? "normal",
    topicName: topicName || undefined,
    userIds,
  };

  if (runtimeFixturesEnabled()) {
    return {
      notificationId: `notification-${Date.now().toString(36)}`,
      outboxCount: Math.max(1, userIds.length || 1),
      recipientCount: Math.max(1, userIds.length || 1),
    } satisfies AdminNotificationCommandResponse;
  }

  return apiRequest<AdminNotificationCommandResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
    portal: ADMIN_NOTIFICATION_PORTAL,
  });
}
