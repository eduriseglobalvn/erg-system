import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import type { components } from "@/lib/api/generated/erg-openapi";
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

// DEV is inlined at build time, so production bundles drop this branch and the fixture chunk with it.
const loadMockStore = () => (import.meta.env.DEV && runtimeFixturesEnabled() ? import("./notification-mock-store") : undefined);

type AckResult = components["schemas"]["AckResponse"];

export async function fetchNotificationFeed(input: { page?: number; portal?: NotificationPortal; size?: number; status?: NotificationStatusFilter } = {}, signal?: AbortSignal) {
  const portal = normalizePortal(input.portal);
  const page = clampPage(input.page ?? 0);
  const size = clampSize(input.size ?? 20);
  const status = normalizeNotificationStatus(input.status);

  const mock = await loadMockStore();
  if (mock) {
    return mock.getMockNotificationFeed(portal, { page, size, status });
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

  const mock = await loadMockStore();
  if (mock) {
    return { unread: mock.getMockUnreadCount(normalizedPortal) };
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

  const mock = await loadMockStore();
  if (mock) {
    const record = mock.getMockNotificationRecord(normalizedPortal, notificationId);
    if (!record) {
      throw new Error("Notification not found.");
    }
    return mock.mapMockRecordToDetail(record);
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

  const mock = await loadMockStore();
  if (mock) {
    mock.markMockNotificationRead(normalizedPortal, notificationId);
    return { read: true, updated: 1 };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ read: boolean; updated: number }>(`${API_ENDPOINTS.notifications.read(notificationId)}?${search.toString()}`, {
    method: "PATCH",
    portal: toApiPortal(normalizedPortal),
  });
}

/** Read-acknowledgement of a campaign message; the server also marks it read. */
export async function ackNotification(notificationId: string, portal: NotificationPortal = "lms") {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  const mock = await loadMockStore();
  if (mock) {
    mock.markMockNotificationRead(normalizedPortal, notificationId);
    return;
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  await apiRequest<AckResult>(`${API_ENDPOINTS.notifications.ack(notificationId)}?${search.toString()}`, {
    method: "POST",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function markAllNotificationsRead(portal: NotificationPortal = "lms") {
  const normalizedPortal = normalizePortal(portal);

  const mock = await loadMockStore();
  if (mock) {
    return { read: true, updated: mock.markMockAllNotificationsRead(normalizedPortal) };
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

  const mock = await loadMockStore();
  if (mock) {
    mock.markMockNotificationArchived(normalizedPortal, notificationId);
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

  const mock = await loadMockStore();
  if (mock) {
    return mock.getMockNotificationPreferences(normalizedPortal);
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<NotificationPreferenceResponse[]>(`${API_ENDPOINTS.notifications.preferences}?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
  });
}

export async function updateNotificationPreferences(input: { portal?: NotificationPortal; preferences: NotificationPreferenceResponse[] }) {
  const portal = normalizePortal(input.portal);

  const mock = await loadMockStore();
  if (mock) {
    return mock.setMockNotificationPreferences(portal, input.preferences);
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
