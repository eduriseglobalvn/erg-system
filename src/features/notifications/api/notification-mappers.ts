import type {
  LmsNotificationType,
  NotificationDetailItem,
  NotificationDetailResponse,
  NotificationDeviceHeartbeatInput,
  NotificationFeedItem,
  NotificationItemResponse,
  NotificationPortal,
  NotificationStatusFilter,
  PageResponse,
} from "./notification-types";

export function mapNotificationPage(response: PageResponse<NotificationItemResponse>): PageResponse<NotificationFeedItem> {
  return {
    ...response,
    items: response.items.map((item) => mapNotificationItem(item)),
  };
}

export function mapNotificationItem(item: NotificationItemResponse): NotificationFeedItem {
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

export function mapNotificationDetail(item: NotificationDetailResponse, portal: string): NotificationDetailItem {
  const feedItem = mapNotificationItem(item);
  return {
    ...feedItem,
    body: item.body ?? item.bodyPreview ?? feedItem.description,
    portal,
  };
}


export function toPageResponse<T>(items: T[], page: number, size: number, totalItems: number): PageResponse<T> {
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

export function resolveNotificationType(input: Pick<NotificationDetailResponse, "data" | "eventType" | "priority" | "sourceType">): LmsNotificationType {
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

export function normalizeStoredNotificationStatus(
  status: NotificationItemResponse["status"] | undefined,
  readAt: string | null | undefined,
): "unread" | "read" {
  if (status === "read" || Boolean(readAt)) {
    return "read";
  }
  return "unread";
}

export function normalizeNotificationStatus(value: NotificationStatusFilter | string | undefined): NotificationStatusFilter {
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

export function toApiPortal(portal: string): ApiPortal {
  if (portal === "admin" || portal === "crm" || portal === "lcms" || portal === "lms" || portal === "elearning") {
    return portal;
  }
  return "lms";
}

export function clampPage(page: number) {
  if (!Number.isFinite(page)) return 0;
  return Math.min(10_000, Math.max(0, Math.trunc(page)));
}

export function clampSize(size: number) {
  if (!Number.isFinite(size)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(size)));
}

export function assertNotificationDeviceIdentity(input: { firebaseInstallationId?: string; registrationToken?: string }) {
  if (!input.firebaseInstallationId && !input.registrationToken) {
    throw new Error("Notification device identity is required.");
  }
}

export function assertNotificationHeartbeatIdentity(input: NotificationDeviceHeartbeatInput) {
  if (!input.deviceRegistrationId && !input.firebaseInstallationId && !input.registrationToken) {
    throw new Error("Notification device identity is required.");
  }
}

export function getDeviceIdentity(input: {
  firebaseInstallationId?: string;
  portal: NotificationPortal;
  registrationToken?: string;
}) {
  return `${normalizePortal(input.portal)}::${input.firebaseInstallationId ?? input.registrationToken ?? "unknown"}`;
}

export function mockNotificationStoreKey(portal: string, notificationId: string) {
  return `${portal}::${notificationId}`;
}

export function formatNotificationDateLabels(value: string) {
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

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function currentIsoString() {
  return new Date().toISOString();
}
