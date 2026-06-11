import { apiRequest, hasApiBase } from "@/lib/api-client";

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
  return postAdminNotificationCommand("/api/v1/admin/notifications/send", input);
}

export async function broadcastAdminNotification(input: AdminNotificationCommandInput) {
  return postAdminNotificationCommand("/api/v1/admin/notifications/broadcast", input);
}

export async function fetchAdminNotificationStats() {
  if (!hasApiBase()) {
    return {
      dead: 0,
      pending: 2,
      retry: 0,
      sent: 12,
    } satisfies AdminNotificationStatsResponse;
  }

  return apiRequest<AdminNotificationStatsResponse>("/api/v1/admin/notifications/stats", {
    portal: ADMIN_NOTIFICATION_PORTAL,
  });
}

export async function runAdminNotificationOutbox() {
  if (!hasApiBase()) {
    return {
      dead: 0,
      failed: 0,
      processed: 2,
      retried: 0,
      sent: 2,
    } satisfies AdminNotificationOutboxRunResponse;
  }

  return apiRequest<AdminNotificationOutboxRunResponse>("/api/v1/admin/notifications/outbox/run", {
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

  if (!hasApiBase()) {
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
