import { getDefaultTenantId } from "@/lib/graphql-client";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";

import { normalizePortal } from "./notification-mappers";
import type { NotificationPortal, NotificationStatusFilter } from "./notification-types";

export type NotificationQueryScope = {
  accountId?: string | null;
  tenantId?: string | null;
};

const ANONYMOUS_NOTIFICATION_ACCOUNT = "anonymous";

export const notificationQueryKeys = {
  detail: (portal: NotificationPortal, id: string, scope: NotificationQueryScope = resolveNotificationQueryScope(portal)) =>
    [...notificationQueryKeys.root(portal, scope), "detail", id] as const,
  inbox: (
    portal: NotificationPortal,
    status: NotificationStatusFilter,
    page: number,
    size: number,
    scope: NotificationQueryScope = resolveNotificationQueryScope(portal),
  ) => [...notificationQueryKeys.root(portal, scope), "inbox", status, page, size] as const,
  preferences: (portal: NotificationPortal, scope: NotificationQueryScope = resolveNotificationQueryScope(portal)) =>
    [...notificationQueryKeys.root(portal, scope), "preferences"] as const,
  root: (portal: NotificationPortal, scope: NotificationQueryScope = resolveNotificationQueryScope(portal)) =>
    ["notifications", normalizePortal(portal), normalizeNotificationTenant(scope.tenantId), normalizeNotificationAccount(scope.accountId)] as const,
  unreadCount: (portal: NotificationPortal, scope: NotificationQueryScope = resolveNotificationQueryScope(portal)) =>
    [...notificationQueryKeys.root(portal, scope), "unread-count"] as const,
  device: (portal: NotificationPortal, scope: NotificationQueryScope = resolveNotificationQueryScope(portal)) =>
    ["notification-devices", normalizePortal(portal), normalizeNotificationTenant(scope.tenantId), normalizeNotificationAccount(scope.accountId)] as const,
};

export function resolveNotificationQueryScope(portal: NotificationPortal): Required<NotificationQueryScope> {
  const session = readStoredAuthSession(toStoredAuthPortal(portal)) as { accountId?: string } | null;
  return {
    accountId: session?.accountId ?? ANONYMOUS_NOTIFICATION_ACCOUNT,
    tenantId: getDefaultTenantId(),
  };
}

function normalizeNotificationTenant(tenantId: NotificationQueryScope["tenantId"]) {
  return tenantId?.trim() || getDefaultTenantId();
}

function normalizeNotificationAccount(accountId: NotificationQueryScope["accountId"]) {
  return accountId?.trim() || ANONYMOUS_NOTIFICATION_ACCOUNT;
}

function toStoredAuthPortal(portal: NotificationPortal) {
  const normalized = normalizePortal(portal);
  if (normalized === "admin" || normalized === "crm" || normalized === "lcms" || normalized === "lms" || normalized === "elearning") {
    return normalized;
  }
  return "lms";
}
