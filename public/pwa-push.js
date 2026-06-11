const DEFAULT_NOTIFICATION_ICON = "/android-chrome-192x192.png";
const PUSH_MESSAGE_TYPE = "erg:notification-push";

self.addEventListener("push", (event) => {
  const payload = normalizePushPayload(readPushPayload(event));
  const title = payload.title || "ERG LMS";
  const options = {
    badge: payload.badge || DEFAULT_NOTIFICATION_ICON,
    body: payload.body || "Ban co thong bao moi tu LMS.",
    data: toClickData(payload),
    icon: payload.icon || DEFAULT_NOTIFICATION_ICON,
    tag: payload.tag || payload.notificationId || payload.recipientId || payload.sourceId || "erg-lms-notification",
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      broadcastPush(payload),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = resolveTargetUrl(event.notification.data || {});

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin) && "focus" in client);

      if (existingClient) {
        existingClient.navigate(targetUrl);
        return existingClient.focus();
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});

function readPushPayload(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return {
      body: event.data.text(),
    };
  }
}

function normalizePushPayload(rawPayload) {
  if (!isRecord(rawPayload)) {
    return {};
  }

  const notification = isRecord(rawPayload.notification) ? rawPayload.notification : {};
  const data = isRecord(rawPayload.data) ? rawPayload.data : rawPayload;
  const fcmOptions = readFcmOptions(rawPayload);
  const notificationId =
    readString(data.notificationId) ||
    readString(data.recipientId) ||
    readString(rawPayload.notificationId) ||
    readString(rawPayload.id);
  const recipientId = readString(data.recipientId) || readString(rawPayload.recipientId);
  const sourceId = readString(data.sourceId) || readString(rawPayload.sourceId) || notificationId || recipientId;

  return {
    badge: readString(notification.badge) || readString(data.badge),
    body: readString(notification.body) || readString(data.body) || readString(data.bodyPreview),
    deeplink: readString(data.deeplink) || readString(fcmOptions.link),
    icon: readString(notification.icon) || readString(data.icon),
    notificationId,
    portal: readString(data.portal) || "lms",
    recipientId,
    sourceId,
    tag: readString(data.tag),
    title: readString(notification.title) || readString(data.title),
  };
}

function toClickData(payload) {
  return {
    deeplink: payload.deeplink,
    notificationId: payload.notificationId,
    portal: payload.portal || "lms",
    recipientId: payload.recipientId,
    sourceId: payload.sourceId,
  };
}

function resolveTargetUrl(data) {
  if (data.deeplink) {
    const deeplink = toSameOriginUrl(data.deeplink);
    if (deeplink) return deeplink;
  }

  const detailId = data.notificationId || data.recipientId || data.sourceId;
  if (detailId) {
    return toSameOriginUrl(`/notifications/${encodeURIComponent(detailId)}?source=push`);
  }

  return toSameOriginUrl("/notifications?source=push");
}

function broadcastPush(payload) {
  const message = {
    type: PUSH_MESSAGE_TYPE,
    payload: toClickData(payload),
  };

  return self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
    for (const client of clients) {
      client.postMessage(message);
    }
  });
}

function readFcmOptions(rawPayload) {
  const webpush = isRecord(rawPayload.webpush) ? rawPayload.webpush : {};
  const webpushOptions = isRecord(webpush.fcm_options) ? webpush.fcm_options : {};
  if (isRecord(rawPayload.fcm_options)) return rawPayload.fcm_options;
  if (isRecord(rawPayload.fcmOptions)) return rawPayload.fcmOptions;
  return webpushOptions;
}

function toSameOriginUrl(value) {
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin) {
      return new URL("/notifications?source=push", self.location.origin).href;
    }
    return url.href;
  } catch {
    return new URL("/notifications?source=push", self.location.origin).href;
  }
}

function readString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object");
}
