import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import type {
  NotificationDetailResponse,
  NotificationPortal,
  NotificationPreferenceResponse,
  NotificationStatusFilter,
  NotificationItemResponse,
  PageResponse,
} from "./notification-types";
import {
  clampPage,
  clampSize,
  mapNotificationDetail,
  mapNotificationPage,
  normalizeNotificationStatus,
  normalizePortal,
  toApiPortal,
} from "./notification-mappers";
import {
  getMockNotificationFeed,
  getMockNotificationPreferences,
  getMockNotificationRecord,
  getMockUnreadCount,
  mapMockRecordToDetail,
  markMockAllNotificationsRead,
  markMockNotificationArchived,
  markMockNotificationRead,
  setMockNotificationPreferences,
} from "./notification-mock-store";

export async function fetchNotificationFeed(input: { page?: number; portal?: NotificationPortal; size?: number; status?: NotificationStatusFilter } = {}, signal?: AbortSignal) {
  const portal = normalizePortal(input.portal);
  const page = clampPage(input.page ?? 0);
  const size = clampSize(input.size ?? 20);
  const status = normalizeNotificationStatus(input.status);

  if (runtimeFixturesEnabled()) {
    return getMockNotificationFeed(portal, { page, size, status });
  }

  const search = new URLSearchParams();
  search.set("portal", portal);
  search.set("page", String(page));
  search.set("size", String(size));
  search.set("status", status);

  const response = await apiRequest<PageResponse<NotificationItemResponse>>(`${API_ENDPOINTS.notifications.list}?${search.toString()}`, {
    portal: toApiPortal(portal),
    ...(signal ? { signal } : {}),
  });

  return mapNotificationPage(response);
}

export async function fetchUnreadNotificationCount(portal: NotificationPortal = "lms", signal?: AbortSignal) {
  const normalizedPortal = normalizePortal(portal);

  if (runtimeFixturesEnabled()) {
    return { unread: getMockUnreadCount(normalizedPortal) };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ unread: number }>(`${API_ENDPOINTS.notifications.unreadCount}?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
    ...(signal ? { signal } : {}),
  });
}

export async function fetchNotificationDetail(notificationId: string, portal: NotificationPortal = "lms", signal?: AbortSignal) {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (runtimeFixturesEnabled()) {
    const record = getMockNotificationRecord(normalizedPortal, notificationId);
    if (!record) {
      throw new Error("Notification not found.");
    }
    return mapMockRecordToDetail(record);
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  const response = await apiRequest<NotificationDetailResponse>(`${API_ENDPOINTS.notifications.detail(notificationId)}?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
    ...(signal ? { signal } : {}),
  });

  return mapNotificationDetail(response, normalizedPortal);
}

export async function markNotificationRead(notificationId: string, portal: NotificationPortal = "lms") {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (runtimeFixturesEnabled()) {
    markMockNotificationRead(normalizedPortal, notificationId);
    return { read: true, updated: 1 };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ read: boolean; updated: number }>(`${API_ENDPOINTS.notifications.read(notificationId)}?${search.toString()}`, {
    method: "PATCH",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function markAllNotificationsRead(portal: NotificationPortal = "lms") {
  const normalizedPortal = normalizePortal(portal);

  if (runtimeFixturesEnabled()) {
    return { read: true, updated: markMockAllNotificationsRead(normalizedPortal) };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ read: boolean; updated: number }>(`${API_ENDPOINTS.notifications.readAll}?${search.toString()}`, {
    method: "PATCH",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function archiveNotification(notificationId: string, portal: NotificationPortal = "lms") {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (runtimeFixturesEnabled()) {
    markMockNotificationArchived(normalizedPortal, notificationId);
    return { archived: true };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ archived: boolean }>(`${API_ENDPOINTS.notifications.detail(notificationId)}?${search.toString()}`, {
    method: "DELETE",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function fetchNotificationPreferences(portal: NotificationPortal = "lms") {
  const normalizedPortal = normalizePortal(portal);

  if (runtimeFixturesEnabled()) {
    return getMockNotificationPreferences(normalizedPortal);
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<NotificationPreferenceResponse[]>(`${API_ENDPOINTS.notifications.preferences}?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
  });
}

export async function updateNotificationPreferences(input: { portal?: NotificationPortal; preferences: NotificationPreferenceResponse[] }) {
  const portal = normalizePortal(input.portal);

  if (runtimeFixturesEnabled()) {
    return setMockNotificationPreferences(portal, input.preferences);
  }

  return apiRequest<NotificationPreferenceResponse[]>(API_ENDPOINTS.legacy.v1NotificationPreferences, {
    method: "PUT",
    body: JSON.stringify({
      portal,
      preferences: input.preferences,
    }),
    portal: toApiPortal(portal),
  });
}
