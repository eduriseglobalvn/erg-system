import { afterEach, expect, test, vi } from "vitest";

import { broadcastAdminNotification, fetchAdminNotificationStats } from "@/features/notifications/api/admin-notification-api";
import {
  fetchNotificationFeed,
  notificationQueryKeys,
  resolveNotificationQueryScope,
  registerNotificationDevice,
} from "@/features/notifications/api/notification-api";
import { TEACHER_LOCAL_SESSION_KEY, portalSessionKey } from "@/platform/auth/api/auth-token-storage";

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function storePortalSession(portal: "admin" | "lms", token = `${portal}-token`) {
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, portal),
    JSON.stringify({
      accountId: `${portal}-user`,
      accessToken: token,
      loggedInAt: new Date().toISOString(),
      portal,
      portals: [portal],
      rememberMe: true,
    }),
  );
}

test("fetches the LMS notification inbox from the v1 self API", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  storePortalSession("lms");
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          items: [
            {
              id: "notification-1",
              title: "New assignment",
              bodyPreview: "Review the new assignment.",
              status: "unread",
              createdAt: "2026-06-10T09:00:00+07:00",
            },
          ],
          page: 0,
          size: 20,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const feed = await fetchNotificationFeed({ portal: "lms", status: "unread", page: 0, size: 20 });

  expect(feed.items[0]).toMatchObject({ id: "notification-1", unread: true });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(String(url)).toContain("/api/v1/notifications?");
  expect(String(url)).toContain("portal=lms");
  expect(String(url)).toContain("status=unread");
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lms-token");
  expect(headers.has("X-Portal")).toBe(false);
});

test("scopes notification query keys by portal tenant and account", () => {
  const scope = { tenantId: "tenant-a", accountId: "account-a" };

  expect(notificationQueryKeys.root("lms", scope)).toEqual(["notifications", "lms", "tenant-a", "account-a"]);
  expect(notificationQueryKeys.inbox("lms", "unread", 0, 20, scope)).toEqual([
    "notifications",
    "lms",
    "tenant-a",
    "account-a",
    "inbox",
    "unread",
    0,
    20,
  ]);
  expect(notificationQueryKeys.detail("lms", "notification-1", scope)).toEqual([
    "notifications",
    "lms",
    "tenant-a",
    "account-a",
    "detail",
    "notification-1",
  ]);
  expect(notificationQueryKeys.preferences("lms", scope)).toEqual([
    "notifications",
    "lms",
    "tenant-a",
    "account-a",
    "preferences",
  ]);
  expect(notificationQueryKeys.device("lms", scope)).toEqual(["notification-devices", "lms", "tenant-a", "account-a"]);
});

test("resolves notification query scope from the active portal session", () => {
  vi.stubEnv("VITE_TENANT_ID", "tenant-from-env");
  storePortalSession("lms", "lms-token");

  expect(resolveNotificationQueryScope("lms")).toEqual({
    accountId: "lms-user",
    tenantId: "tenant-from-env",
  });
});

test("registers PWA devices against the notification device registry", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  storePortalSession("lms");
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          enabled: true,
          id: "device-1",
          lastSeenAt: "2026-06-10T09:10:00+07:00",
          permissionState: "granted",
          platform: "web_pwa",
          portal: "lms",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await registerNotificationDevice({
    permissionState: "granted",
    platform: "web_pwa",
    portal: "lms",
    registrationToken: "push-token",
    serviceWorkerScope: "/",
  });

  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(String(url)).toBe("https://api.erg.test/api/v1/notification-devices");
  expect((init as RequestInit).method).toBe("POST");
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    permissionState: "granted",
    platform: "web_pwa",
    portal: "lms",
    registrationToken: "push-token",
  });
});

test("uses the admin portal for admin notification endpoints", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  storePortalSession("admin");
  const fetchMock = vi.fn(async (url: string | URL | Request) => {
    if (String(url).endsWith("/api/v1/admin/notifications/stats")) {
      return new Response(JSON.stringify({ data: { dead: 0, pending: 0, retry: 0, sent: 1 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: { notificationId: "notification-1", outboxCount: 1, recipientCount: 1 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  await fetchAdminNotificationStats();
  await broadcastAdminNotification({
    bodyPreview: "Schedule updated.",
    eventType: "SCHEDULE_PUBLISHED",
    portal: "lms",
    title: "Schedule",
    topicName: "t_erg_portal_lms",
  });

  const [, statsInit] = fetchMock.mock.calls[0] ?? [];
  const [, commandInit] = fetchMock.mock.calls[1] ?? [];
  expect(((statsInit as RequestInit).headers as Headers).has("X-Portal")).toBe(false);
  expect(((commandInit as RequestInit).headers as Headers).has("X-Portal")).toBe(false);
  expect(JSON.parse(String((commandInit as RequestInit).body))).toMatchObject({
    portal: "lms",
    priority: "normal",
    topicName: "t_erg_portal_lms",
  });
});
