import { apiRequest, hasApiBase } from "@/lib/api-client";

export type NotificationPortal = "lms" | "lcms" | "admin" | "crm" | "elearning" | (string & {});
export type NotificationStatusFilter = "all" | "unread" | "read";
export type NotificationPriority = "low" | "normal" | "high" | "urgent" | (string & {});
export type NotificationChannel = "push" | "inbox" | "email" | (string & {});
export type NotificationPermissionState = "granted" | "denied" | "default";
export type NotificationDeliveryPlatform = "web_pwa" | "tauri" | "ios" | "android" | (string & {});
export type LmsNotificationType = "company" | "general" | "system";

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type NotificationItemResponse = {
  id: string;
  recipientId?: string;
  eventType?: string;
  sourceType?: string;
  sourceId?: string;
  title: string;
  bodyPreview?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  status?: "unread" | "read" | string;
  readAt?: string | null;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export type NotificationDetailResponse = NotificationItemResponse & {
  body?: string;
  bodyHtml?: string;
};

export type NotificationPreferenceQuietHours = {
  end: string;
  start: string;
};

export type NotificationPreferenceResponse = {
  emailEnabled: boolean;
  eventType: string;
  inboxEnabled: boolean;
  pushEnabled: boolean;
  quietHours?: NotificationPreferenceQuietHours;
};

export type NotificationDeviceClientInfo = {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  userAgent?: string;
};

export type NotificationDeviceRegistrationInput = {
  client?: NotificationDeviceClientInfo;
  endpoint?: string;
  firebaseInstallationId?: string;
  locale?: string;
  permissionState: NotificationPermissionState;
  platform: NotificationDeliveryPlatform;
  portal: NotificationPortal;
  registrationToken?: string;
  serviceWorkerScope?: string;
  timezone?: string;
};

export type NotificationDeviceRegistrationResponse = {
  enabled: boolean;
  id: string;
  lastSeenAt: string | null;
  permissionState: NotificationPermissionState;
  platform: NotificationDeliveryPlatform;
  portal: NotificationPortal;
};

export type NotificationDeviceHeartbeatInput = {
  deviceRegistrationId?: string;
  firebaseInstallationId?: string;
  permissionState?: NotificationPermissionState;
  portal: NotificationPortal;
  registrationToken?: string;
};

export type NotificationDeviceUnregisterInput = {
  firebaseInstallationId?: string;
  portal: NotificationPortal;
  registrationToken?: string;
};

export type NotificationFeedItem = {
  actionUrl?: string;
  bodyPreview: string;
  channel: NotificationChannel;
  createdAt: string;
  data: Record<string, unknown>;
  dateLabel: string;
  description: string;
  eventType: string;
  id: string;
  priority: NotificationPriority;
  readAt: string | null;
  recipientId?: string;
  sourceId?: string;
  sourceType: string;
  starred?: boolean;
  status: "unread" | "read";
  timeLabel: string;
  title: string;
  type: LmsNotificationType;
  unread: boolean;
};

export type NotificationDetailItem = NotificationFeedItem & {
  body: string;
  portal: string;
};

export type NotificationDeviceRecord = {
  client?: NotificationDeviceClientInfo;
  deviceId: string;
  enabled: boolean;
  endpoint?: string;
  firebaseInstallationId?: string;
  lastSeenAt: string;
  locale?: string;
  permissionState: NotificationPermissionState;
  platform: NotificationDeliveryPlatform;
  portal: string;
  registrationToken?: string;
  serviceWorkerScope?: string;
  timezone?: string;
};

export const notificationQueryKeys = {
  detail: (portal: NotificationPortal, id: string) => ["notifications", normalizePortal(portal), "detail", id] as const,
  inbox: (portal: NotificationPortal, status: NotificationStatusFilter, page: number, size: number) =>
    ["notifications", normalizePortal(portal), "inbox", status, page, size] as const,
  preferences: (portal: NotificationPortal) => ["notifications", normalizePortal(portal), "preferences"] as const,
  root: (portal: NotificationPortal) => ["notifications", normalizePortal(portal)] as const,
  unreadCount: (portal: NotificationPortal) => ["notifications", normalizePortal(portal), "unread-count"] as const,
  device: (portal: NotificationPortal) => ["notification-devices", normalizePortal(portal)] as const,
};

type MockNotificationRecord = {
  actionUrl?: string;
  archivedAt: string | null;
  body: string;
  bodyPreview: string;
  channel: NotificationChannel;
  createdAt: string;
  data: Record<string, unknown>;
  eventType: string;
  id: string;
  priority: NotificationPriority;
  readAt: string | null;
  recipientId?: string;
  portal: string;
  sourceId?: string;
  sourceType: string;
  starred?: boolean;
  status: "unread" | "read";
  title: string;
};

type MockState = {
  notifications: Map<string, MockNotificationRecord>;
  preferences: Map<string, NotificationPreferenceResponse[]>;
  devicesById: Map<string, NotificationDeviceRecord>;
  devicesByIdentity: Map<string, NotificationDeviceRecord>;
};

const mockState: MockState = {
  devicesById: new Map(),
  devicesByIdentity: new Map(),
  notifications: new Map(),
  preferences: new Map(),
};

const MOCK_NOTIFICATION_FIXTURES: Array<Omit<MockNotificationRecord, "archivedAt" | "portal">> = [
  {
    id: "system-schedule-updated",
    recipientId: "recipient-system-schedule-updated",
    eventType: "SCHEDULE_PUBLISHED",
    sourceType: "schedule",
    sourceId: "sch-1",
    title: "Lớp học vừa được cập nhật thời khóa biểu",
    bodyPreview: "Vào lúc 09:02 19/05/2026, thời khóa biểu đã được cập nhật.",
    body: "Giáo viên cần kiểm tra lại lịch dạy trước khi vào lớp để tránh xung đột tiết học.",
    actionUrl: "/notifications/system-schedule-updated",
    priority: "normal",
    channel: "push",
    status: "unread",
    readAt: null,
    createdAt: "2026-05-19T09:02:00+07:00",
    data: { kind: "schedule" },
  },
  {
    id: "company-training",
    recipientId: "recipient-company-training",
    eventType: "ANNOUNCEMENT_PUBLISHED",
    sourceType: "company",
    sourceId: "announce-6-2026",
    title: "Công ty mở lịch tập huấn LMS tháng 6",
    bodyPreview: "Giáo viên đăng ký ca phù hợp để cập nhật quy trình giao bài và báo cáo.",
    body: "Chương trình tập huấn tập trung vào giao bài, phản hồi học sinh và báo cáo theo tuần.",
    actionUrl: "/notifications/company-training",
    priority: "high",
    channel: "push",
    status: "unread",
    readAt: null,
    createdAt: "2026-05-19T08:30:00+07:00",
    data: { kind: "company-training" },
    starred: true,
  },
  {
    id: "general-homework",
    recipientId: "recipient-general-homework",
    eventType: "ASSIGNMENT_CREATED",
    sourceType: "assignment",
    sourceId: "asg-1",
    title: "Bài tập mới cần rà soát trước khi gửi",
    bodyPreview: "Kho bài tập có 4 câu hỏi mới được đồng bộ cho lớp đang chọn.",
    body: "Bạn có thể mở chi tiết để kiểm tra đề, mức độ khó và thời hạn nộp trước khi phát hành.",
    actionUrl: "/notifications/general-homework",
    priority: "normal",
    channel: "inbox",
    status: "read",
    readAt: "2026-05-18T17:05:00+07:00",
    createdAt: "2026-05-18T16:45:00+07:00",
    data: { kind: "assignment" },
  },
  {
    id: "system-sync",
    recipientId: "recipient-system-sync",
    eventType: "SYNC_COMPLETED",
    sourceType: "system",
    sourceId: "sync-2026-05-18",
    title: "Đồng bộ dữ liệu học sinh hoàn tất",
    bodyPreview: "Hệ thống đã cập nhật danh sách học sinh và trạng thái tài khoản.",
    body: "Bản đồng bộ vừa hoàn tất, dữ liệu lớp học đang phản ánh trạng thái mới nhất từ máy chủ.",
    actionUrl: "/notifications/system-sync",
    priority: "normal",
    channel: "push",
    status: "unread",
    readAt: null,
    createdAt: "2026-05-18T14:20:00+07:00",
    data: { kind: "sync" },
  },
  {
    id: "company-policy",
    recipientId: "recipient-company-policy",
    eventType: "POLICY_REMINDER",
    sourceType: "company",
    sourceId: "policy-2026-weekly",
    title: "Nhắc lịch hoàn tất báo cáo tuần",
    bodyPreview: "Báo cáo lớp cần được gửi trước 17:00 thứ Sáu tuần này.",
    body: "Thông báo này giúp giáo viên nắm hạn chót báo cáo và mở đúng nghiệp vụ cần theo dõi.",
    actionUrl: "/notifications/company-policy",
    priority: "normal",
    channel: "inbox",
    status: "read",
    readAt: "2026-05-17T10:30:00+07:00",
    createdAt: "2026-05-17T10:10:00+07:00",
    data: { kind: "policy" },
  },
];

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceResponse[] = [
  {
    emailEnabled: false,
    eventType: "ASSIGNMENT_CREATED",
    inboxEnabled: true,
    pushEnabled: true,
    quietHours: { start: "22:00", end: "06:00" },
  },
  {
    emailEnabled: false,
    eventType: "SCHEDULE_PUBLISHED",
    inboxEnabled: true,
    pushEnabled: true,
  },
  {
    emailEnabled: false,
    eventType: "POLICY_REMINDER",
    inboxEnabled: true,
    pushEnabled: true,
  },
];

export async function fetchNotificationFeed(input: { page?: number; portal?: NotificationPortal; size?: number; status?: NotificationStatusFilter } = {}) {
  const portal = normalizePortal(input.portal);
  const page = clampPage(input.page ?? 0);
  const size = clampSize(input.size ?? 20);
  const status = normalizeNotificationStatus(input.status);

  if (!hasApiBase()) {
    return getMockNotificationFeed(portal, { page, size, status });
  }

  const search = new URLSearchParams();
  search.set("portal", portal);
  search.set("page", String(page));
  search.set("size", String(size));
  search.set("status", status);

  const response = await apiRequest<PageResponse<NotificationItemResponse>>(`/api/v1/notifications?${search.toString()}`, {
    portal: toApiPortal(portal),
  });

  return mapNotificationPage(response);
}

export async function fetchUnreadNotificationCount(portal: NotificationPortal = "lms") {
  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    return { unread: getMockUnreadCount(normalizedPortal) };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ unread: number }>(`/api/v1/notifications/unread-count?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
  });
}

export async function fetchNotificationDetail(notificationId: string, portal: NotificationPortal = "lms") {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    const record = getMockNotificationRecord(normalizedPortal, notificationId);
    if (!record) {
      throw new Error("Notification not found.");
    }
    return mapMockRecordToDetail(record);
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  const response = await apiRequest<NotificationDetailResponse>(`/api/v1/notifications/${encodeURIComponent(notificationId)}?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
  });

  return mapNotificationDetail(response, normalizedPortal);
}

export async function markNotificationRead(notificationId: string, portal: NotificationPortal = "lms") {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    markMockNotificationRead(normalizedPortal, notificationId);
    return { read: true, updated: 1 };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ read: boolean; updated: number }>(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read?${search.toString()}`, {
    method: "PATCH",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function markAllNotificationsRead(portal: NotificationPortal = "lms") {
  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    return { read: true, updated: markMockAllNotificationsRead(normalizedPortal) };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ read: boolean; updated: number }>(`/api/v1/notifications/read-all?${search.toString()}`, {
    method: "PATCH",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function archiveNotification(notificationId: string, portal: NotificationPortal = "lms") {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    markMockNotificationArchived(normalizedPortal, notificationId);
    return { archived: true };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ archived: boolean }>(`/api/v1/notifications/${encodeURIComponent(notificationId)}?${search.toString()}`, {
    method: "DELETE",
    portal: toApiPortal(normalizedPortal),
  });
}

export async function fetchNotificationPreferences(portal: NotificationPortal = "lms") {
  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    return getMockNotificationPreferences(normalizedPortal);
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<NotificationPreferenceResponse[]>(`/api/v1/notifications/preferences?${search.toString()}`, {
    portal: toApiPortal(normalizedPortal),
  });
}

export async function updateNotificationPreferences(input: { portal?: NotificationPortal; preferences: NotificationPreferenceResponse[] }) {
  const portal = normalizePortal(input.portal);

  if (!hasApiBase()) {
    return setMockNotificationPreferences(portal, input.preferences);
  }

  return apiRequest<NotificationPreferenceResponse[]>("/api/v1/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify({
      portal,
      preferences: input.preferences,
    }),
    portal: toApiPortal(portal),
  });
}

export async function registerNotificationDevice(input: NotificationDeviceRegistrationInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationDeviceIdentity(input);

  if (!hasApiBase()) {
    return registerMockNotificationDevice({
      ...input,
      portal,
    });
  }

  return apiRequest<NotificationDeviceRegistrationResponse>("/api/v1/notification-devices", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export async function unregisterNotificationDevice(input: NotificationDeviceUnregisterInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationDeviceIdentity(input);

  if (!hasApiBase()) {
    unregisterMockNotificationDevice({
      ...input,
      portal,
    });
    return { unregistered: true };
  }

  return apiRequest<{ unregistered: boolean }>("/api/v1/notification-devices/unregister", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export async function heartbeatNotificationDevice(input: NotificationDeviceHeartbeatInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationHeartbeatIdentity(input);

  if (!hasApiBase()) {
    heartbeatMockNotificationDevice({
      ...input,
      portal,
    });
    return;
  }

  await apiRequest<void>("/api/v1/notification-devices/heartbeat", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export async function revokeNotificationDevice(deviceId: string, portal: NotificationPortal = "lms") {
  if (!deviceId) {
    throw new Error("deviceId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  if (!hasApiBase()) {
    revokeMockNotificationDevice(normalizedPortal, deviceId);
    return { revoked: true };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ revoked: boolean }>(`/api/v1/notification-devices/${encodeURIComponent(deviceId)}?${search.toString()}`, {
    method: "DELETE",
    portal: toApiPortal(normalizedPortal),
  });
}

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

function mapNotificationPage(response: PageResponse<NotificationItemResponse>): PageResponse<NotificationFeedItem> {
  return {
    ...response,
    items: response.items.map((item) => mapNotificationItem(item)),
  };
}

function mapNotificationItem(item: NotificationItemResponse): NotificationFeedItem {
  const createdAt = item.createdAt ?? currentIsoString();
  const status = normalizeStoredNotificationStatus(item.status, item.readAt);
  const bodyPreview = item.bodyPreview ?? String(item.data?.bodyPreview ?? item.data?.summary ?? item.title ?? "");
  const description = bodyPreview || item.title;
  const { dateLabel, timeLabel } = formatNotificationDateLabels(createdAt);

  return {
    actionUrl: item.actionUrl,
    bodyPreview,
    channel: item.channel ?? "inbox",
    createdAt,
    data: item.data ?? {},
    dateLabel,
    description,
    eventType: item.eventType ?? "UNKNOWN",
    id: item.id,
    priority: item.priority ?? "normal",
    readAt: item.readAt ?? null,
    recipientId: item.recipientId,
    sourceId: item.sourceId,
    sourceType: item.sourceType ?? "general",
    starred: item.priority === "high" || item.priority === "urgent",
    status,
    timeLabel,
    title: item.title,
    type: resolveNotificationType({
      eventType: item.eventType ?? "",
      sourceType: item.sourceType ?? "",
      priority: item.priority,
      data: item.data,
    }),
    unread: status !== "read",
  };
}

function mapNotificationDetail(item: NotificationDetailResponse, portal: string): NotificationDetailItem {
  const feedItem = mapNotificationItem(item);
  return {
    ...feedItem,
    body: item.body ?? item.bodyPreview ?? feedItem.description,
    portal,
  };
}

function mapMockRecordToFeed(record: MockNotificationRecord): NotificationFeedItem {
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

function mapMockRecordToDetail(record: MockNotificationRecord): NotificationDetailItem {
  const feedItem = mapMockRecordToFeed(record);
  return {
    ...feedItem,
    body: record.body ?? record.bodyPreview,
    portal: record.portal,
  };
}

function getMockNotificationRecords(portal: string) {
  ensureMockNotificationSeed(portal);
  return [...mockState.notifications.values()].filter((record) => record.portal === portal);
}

function getMockNotificationRecord(portal: string, id: string) {
  ensureMockNotificationSeed(portal);
  const byPortal = [...mockState.notifications.values()].filter((record) => record.portal === portal);
  return (
    byPortal.find((record) => record.id === id || record.recipientId === id || record.sourceId === id) ??
    [...mockState.notifications.values()].find((record) => record.id === id || record.recipientId === id || record.sourceId === id)
  );
}

function ensureMockNotificationSeed(portal: string) {
  const normalizedPortal = normalizePortal(portal);
  const portalSeedExists = [...mockState.notifications.values()].some((record) => record.portal === normalizedPortal);
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
    mockState.notifications.set(mockNotificationStoreKey(normalizedPortal, record.id), record);
  }
}

function getMockNotificationPreferences(portal: string) {
  const normalizedPortal = normalizePortal(portal);
  if (!mockState.preferences.has(normalizedPortal)) {
    mockState.preferences.set(normalizedPortal, DEFAULT_NOTIFICATION_PREFERENCES.map((item) => ({ ...item })));
  }

  return clonePreferences(mockState.preferences.get(normalizedPortal) ?? []);
}

function setMockNotificationPreferences(portal: string, preferences: NotificationPreferenceResponse[]) {
  const normalizedPortal = normalizePortal(portal);
  mockState.preferences.set(normalizedPortal, preferences.map((item) => ({ ...item, quietHours: item.quietHours ? { ...item.quietHours } : undefined })));
  return getMockNotificationPreferences(normalizedPortal);
}

function markMockNotificationRead(portal: string, id: string) {
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

function markMockAllNotificationsRead(portal: string) {
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

function markMockNotificationArchived(portal: string, id: string) {
  const record = getMutableMockNotificationRecord(portal, id);
  if (!record) {
    return;
  }

  record.archivedAt = currentIsoString();
}

function getMutableMockNotificationRecord(portal: string, id: string) {
  const normalizedPortal = normalizePortal(portal);
  const key = mockNotificationStoreKey(normalizedPortal, id);
  const exact = mockState.notifications.get(key);
  if (exact) {
    return exact;
  }

  const record = getMockNotificationRecord(normalizedPortal, id);
  if (!record) {
    return undefined;
  }

  const mutableKey = mockNotificationStoreKey(record.portal, record.id);
  return mockState.notifications.get(mutableKey);
}

function registerMockNotificationDevice(input: NotificationDeviceRegistrationInput) {
  const normalizedPortal = normalizePortal(input.portal);
  const identity = getDeviceIdentity(input);
  const existing = mockState.devicesByIdentity.get(identity);
  const now = currentIsoString();

  if (existing) {
    existing.enabled = true;
    existing.permissionState = input.permissionState;
    existing.lastSeenAt = now;
    existing.client = input.client ?? existing.client;
    existing.endpoint = input.endpoint ?? existing.endpoint;
    existing.firebaseInstallationId = input.firebaseInstallationId ?? existing.firebaseInstallationId;
    existing.locale = input.locale ?? existing.locale;
    existing.platform = input.platform;
    existing.registrationToken = input.registrationToken ?? existing.registrationToken;
    existing.serviceWorkerScope = input.serviceWorkerScope ?? existing.serviceWorkerScope;
    existing.timezone = input.timezone ?? existing.timezone;
    existing.portal = normalizedPortal;
    return serializeMockDevice(existing);
  }

  const deviceId = `device-${Math.random().toString(36).slice(2, 10)}`;
  const record: NotificationDeviceRecord = {
    client: input.client,
    deviceId,
    enabled: true,
    endpoint: input.endpoint,
    firebaseInstallationId: input.firebaseInstallationId,
    lastSeenAt: now,
    locale: input.locale,
    permissionState: input.permissionState,
    platform: input.platform,
    portal: normalizedPortal,
    registrationToken: input.registrationToken,
    serviceWorkerScope: input.serviceWorkerScope,
    timezone: input.timezone,
  };
  mockState.devicesByIdentity.set(identity, record);
  mockState.devicesById.set(deviceId, record);
  return serializeMockDevice(record);
}

function unregisterMockNotificationDevice(input: NotificationDeviceUnregisterInput) {
  const normalizedPortal = normalizePortal(input.portal);
  const identity = getDeviceIdentity(input);
  const record = mockState.devicesByIdentity.get(identity);
  if (!record) {
    return;
  }

  record.enabled = false;
  record.portal = normalizedPortal;
  record.lastSeenAt = currentIsoString();
  mockState.devicesByIdentity.set(identity, record);
  mockState.devicesById.set(record.deviceId, record);
}

function heartbeatMockNotificationDevice(input: NotificationDeviceHeartbeatInput) {
  const normalizedPortal = normalizePortal(input.portal);
  const record =
    (input.deviceRegistrationId ? mockState.devicesById.get(input.deviceRegistrationId) : undefined) ??
    mockState.devicesByIdentity.get(getDeviceIdentity(input));

  if (!record) {
    if (input.firebaseInstallationId || input.registrationToken) {
      const registrationInput: NotificationDeviceRegistrationInput = {
        client: undefined,
        endpoint: input.registrationToken,
        firebaseInstallationId: input.firebaseInstallationId,
        permissionState: input.permissionState ?? "default",
        platform: "web_pwa",
        portal: normalizedPortal,
        registrationToken: input.registrationToken,
      };
      registerMockNotificationDevice(registrationInput);
    }
    return;
  }

  record.enabled = true;
  record.lastSeenAt = currentIsoString();
  record.permissionState = input.permissionState ?? record.permissionState;
  record.portal = normalizedPortal;
  mockState.devicesByIdentity.set(getDeviceIdentity(record), record);
  mockState.devicesById.set(record.deviceId, record);
}

function revokeMockNotificationDevice(portal: string, deviceId: string) {
  const normalizedPortal = normalizePortal(portal);
  const record = mockState.devicesById.get(deviceId);
  if (!record) {
    return;
  }

  record.enabled = false;
  record.portal = normalizedPortal;
  record.lastSeenAt = currentIsoString();
  mockState.devicesById.set(deviceId, record);
  mockState.devicesByIdentity.set(getDeviceIdentity(record), record);
}

function serializeMockDevice(record: NotificationDeviceRecord): NotificationDeviceRegistrationResponse {
  return {
    enabled: record.enabled,
    id: record.deviceId,
    lastSeenAt: record.lastSeenAt,
    permissionState: record.permissionState,
    platform: record.platform,
    portal: record.portal,
  };
}

function clonePreferences(preferences: NotificationPreferenceResponse[]) {
  return preferences.map((item) => ({
    ...item,
    quietHours: item.quietHours ? { ...item.quietHours } : undefined,
  }));
}

function toPageResponse<T>(items: T[], page: number, size: number, totalItems: number): PageResponse<T> {
  const totalPages = totalItems ? Math.ceil(totalItems / size) : 0;
  return {
    items,
    page,
    size,
    totalItems,
    totalPages,
    hasNext: page + 1 < totalPages,
    hasPrevious: page > 0,
  };
}

function resolveNotificationType(input: Pick<NotificationDetailResponse, "data" | "eventType" | "priority" | "sourceType">): LmsNotificationType {
  const source = `${input.sourceType ?? ""} ${input.eventType ?? ""} ${Object.values(input.data ?? {}).join(" ")}`.toLowerCase();
  if (source.includes("system") || source.includes("sync") || source.includes("alert") || source.includes("maintenance")) {
    return "system";
  }
  if (
    source.includes("company") ||
    source.includes("announcement") ||
    source.includes("policy") ||
    source.includes("broadcast") ||
    input.priority === "high" ||
    input.priority === "urgent"
  ) {
    return "company";
  }
  return "general";
}

function normalizeStoredNotificationStatus(
  status: NotificationItemResponse["status"] | undefined,
  readAt: string | null | undefined,
): "unread" | "read" {
  if (status === "read" || Boolean(readAt)) {
    return "read";
  }
  return "unread";
}

function normalizeNotificationStatus(value: NotificationStatusFilter | string | undefined): NotificationStatusFilter {
  if (value === "read" || value === "unread") {
    return value;
  }
  return "all";
}

export function normalizePortal(portal: NotificationPortal = "lms") {
  const normalized = String(portal || "lms").trim().toLowerCase();
  return normalized || "lms";
}

type ApiPortal = "admin" | "crm" | "lcms" | "lms" | "elearning";

function toApiPortal(portal: string): ApiPortal {
  if (portal === "admin" || portal === "crm" || portal === "lcms" || portal === "lms" || portal === "elearning") {
    return portal;
  }
  return "lms";
}

function clampPage(page: number) {
  if (!Number.isFinite(page)) return 0;
  return Math.min(10_000, Math.max(0, Math.trunc(page)));
}

function clampSize(size: number) {
  if (!Number.isFinite(size)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(size)));
}

function assertNotificationDeviceIdentity(input: { firebaseInstallationId?: string; registrationToken?: string }) {
  if (!input.firebaseInstallationId && !input.registrationToken) {
    throw new Error("Notification device identity is required.");
  }
}

function assertNotificationHeartbeatIdentity(input: NotificationDeviceHeartbeatInput) {
  if (!input.deviceRegistrationId && !input.firebaseInstallationId && !input.registrationToken) {
    throw new Error("Notification device identity is required.");
  }
}

function getDeviceIdentity(input: {
  firebaseInstallationId?: string;
  portal: NotificationPortal;
  registrationToken?: string;
}) {
  return `${normalizePortal(input.portal)}::${input.firebaseInstallationId ?? input.registrationToken ?? "unknown"}`;
}

function mockNotificationStoreKey(portal: string, notificationId: string) {
  return `${portal}::${notificationId}`;
}

function formatNotificationDateLabels(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      dateLabel: "",
      timeLabel: "",
    };
  }

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return {
    dateLabel: `${day}/${month}/${year}`,
    timeLabel: `${hours}:${minutes} ${day}/${month}/${year}`,
  };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function currentIsoString() {
  return new Date().toISOString();
}
