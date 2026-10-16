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
