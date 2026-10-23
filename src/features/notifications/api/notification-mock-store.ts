import type {
  NotificationDetailItem,
  NotificationFeedItem,
  NotificationPortal,
  NotificationPreferenceResponse,
  NotificationStatusFilter,
} from "./notification-types";
import {
  clampPage,
  clampSize,
  currentIsoString,
  formatNotificationDateLabels,
  mockNotificationStoreKey,
  normalizeNotificationStatus,
  normalizePortal,
  normalizeStoredNotificationStatus,
  resolveNotificationType,
  toPageResponse,
} from "./notification-mappers";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  MOCK_NOTIFICATION_FIXTURES,
  type MockNotificationRecord,
} from "./notification-mock-fixtures";

const notifications = new Map<string, MockNotificationRecord>();
const preferencesByPortal = new Map<string, NotificationPreferenceResponse[]>();

export function getMockNotificationFeed(portal: NotificationPortal = "lms", input: { page?: number; size?: number; status?: NotificationStatusFilter } = {}) {
  const normalizedPortal = normalizePortal(portal);
  const page = clampPage(input.page ?? 0);
  const size = clampSize(input.size ?? 20);
  const status = normalizeNotificationStatus(input.status);
  const filtered = getMockNotificationRecords(normalizedPortal)
    .filter((record) => !record.archivedAt)
    .filter((record) => (status === "all" ? true : status === "read" ? record.status === "read" : record.status !== "read"))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  return toPageResponse(filtered.slice(page * size, page * size + size).map((record) => mapMockRecordToFeed(record)), page, size, filtered.length);
}

export function getMockUnreadCount(portal: NotificationPortal = "lms") {
  return getMockNotificationRecords(normalizePortal(portal)).filter((record) => !record.archivedAt && record.status !== "read").length;
}

export function mapMockRecordToFeed(record: MockNotificationRecord): NotificationFeedItem {
  const { dateLabel, timeLabel } = formatNotificationDateLabels(record.createdAt);
  return {
    actionUrl: record.actionUrl,
    bodyPreview: record.bodyPreview,
    channel: record.channel ?? "inbox",
    createdAt: record.createdAt,
    data: record.data ?? {},
    dateLabel,
    description: record.bodyPreview,
    eventType: record.eventType,
    id: record.id,
    priority: record.priority ?? "normal",
    readAt: record.readAt ?? null,
    recipientId: record.recipientId,
    sourceId: record.sourceId,
    sourceType: record.sourceType,
    starred: record.starred,
    status: normalizeStoredNotificationStatus(record.status, record.readAt),
    timeLabel,
    title: record.title,
    type: resolveNotificationType(record),
    unread: normalizeStoredNotificationStatus(record.status, record.readAt) !== "read",
  };
}

export function mapMockRecordToDetail(record: MockNotificationRecord): NotificationDetailItem {
  const feedItem = mapMockRecordToFeed(record);
  return {
    ...feedItem,
    body: record.body ?? record.bodyPreview,
    portal: record.portal,
  };
}

export function getMockNotificationRecords(portal: string) {
  ensureMockNotificationSeed(portal);
  return [...notifications.values()].filter((record) => record.portal === portal);
}

export function getMockNotificationRecord(portal: string, id: string) {
  ensureMockNotificationSeed(portal);
  const byPortal = [...notifications.values()].filter((record) => record.portal === portal);
  return (
    byPortal.find((record) => record.id === id || record.recipientId === id || record.sourceId === id) ??
    [...notifications.values()].find((record) => record.id === id || record.recipientId === id || record.sourceId === id)
  );
}

export function ensureMockNotificationSeed(portal: string) {
  const normalizedPortal = normalizePortal(portal);
  const portalSeedExists = [...notifications.values()].some((record) => record.portal === normalizedPortal);
  if (portalSeedExists) {
    return;
  }

  for (const fixture of MOCK_NOTIFICATION_FIXTURES) {
    const record: MockNotificationRecord = {
      ...fixture,
      archivedAt: null,
      portal: normalizedPortal,
      status: normalizeStoredNotificationStatus(fixture.status, fixture.readAt),
    };
    notifications.set(mockNotificationStoreKey(normalizedPortal, record.id), record);
  }
}

export function getMockNotificationPreferences(portal: string) {
  const normalizedPortal = normalizePortal(portal);
  if (!preferencesByPortal.has(normalizedPortal)) {
    preferencesByPortal.set(normalizedPortal, DEFAULT_NOTIFICATION_PREFERENCES.map((item) => ({ ...item })));
  }

  return clonePreferences(preferencesByPortal.get(normalizedPortal) ?? []);
}

export function setMockNotificationPreferences(portal: string, preferences: NotificationPreferenceResponse[]) {
  const normalizedPortal = normalizePortal(portal);
  preferencesByPortal.set(normalizedPortal, preferences.map((item) => ({ ...item, quietHours: item.quietHours ? { ...item.quietHours } : undefined })));
  return getMockNotificationPreferences(normalizedPortal);
}

export function markMockNotificationRead(portal: string, id: string) {
  const record = getMutableMockNotificationRecord(portal, id);
  if (!record) {
    return 0;
  }

  if (record.status === "read" && record.readAt) {
    return 0;
  }

  record.status = "read";
  record.readAt = currentIsoString();
  return 1;
}

export function markMockAllNotificationsRead(portal: string) {
  let updated = 0;
  for (const record of getMockNotificationRecords(portal)) {
    if (record.archivedAt || record.status === "read") {
      continue;
    }
    record.status = "read";
    record.readAt = currentIsoString();
    updated += 1;
  }
  return updated;
}

export function markMockNotificationArchived(portal: string, id: string) {
  const record = getMutableMockNotificationRecord(portal, id);
  if (!record) {
    return;
  }

  record.archivedAt = currentIsoString();
}

export function getMutableMockNotificationRecord(portal: string, id: string) {
  const normalizedPortal = normalizePortal(portal);
  const key = mockNotificationStoreKey(normalizedPortal, id);
  const exact = notifications.get(key);
  if (exact) {
    return exact;
  }

  const record = getMockNotificationRecord(normalizedPortal, id);
  if (!record) {
    return undefined;
  }

  const mutableKey = mockNotificationStoreKey(record.portal, record.id);
  return notifications.get(mutableKey);
}


export function clonePreferences(preferences: NotificationPreferenceResponse[]) {
  return preferences.map((item) => ({
    ...item,
    quietHours: item.quietHours ? { ...item.quietHours } : undefined,
  }));
}
