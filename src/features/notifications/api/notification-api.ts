// Stable public facade. Cohesive transport, mapping, mock, and type owners live
// beside this file so existing feature imports remain backward compatible.
export * from "./notification-types";
export {
  archiveNotification,
  fetchNotificationDetail,
  fetchNotificationFeed,
  fetchNotificationPreferences,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "./notification-feed-api";
export {
  heartbeatNotificationDevice,
  registerNotificationDevice,
  revokeNotificationDevice,
  unregisterNotificationDevice,
} from "./notification-device-api";
export {
  getMockNotificationFeed,
  getMockUnreadCount,
} from "./notification-mock-store";
export { normalizePortal } from "./notification-mappers";
export {
  notificationQueryKeys,
  resolveNotificationQueryScope,
  type NotificationQueryScope,
} from "./notification-query";
