self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const title = payload.title || "ERG LMS";
  const options = {
    badge: payload.badge || "/android-chrome-192x192.png",
    body: payload.body || "Ban co thong bao moi tu LMS.",
    data: {
      url: payload.url || "/notifications?source=push",
    },
    icon: payload.icon || "/android-chrome-192x192.png",
    tag: payload.tag || "erg-lms-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/notifications?source=push", self.location.origin).href;

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
