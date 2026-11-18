/** Message the service worker (public/pwa-push.js) posts to open tabs for every push it receives. */
export const PUSH_MESSAGE_TYPE = "erg:notification-push";
/** Set on <html> while a learner is inside a quiz; floating cards wait until it is removed. */
export const QUIZ_ACTIVE_ATTRIBUTE = "data-erg-quiz-active";

export type PushToastMessage = {
  body?: string;
  href: string;
  id?: string;
  priority: "URGENT" | "IMPORTANT" | "INFO";
  title: string;
};

/** Plan §10: Khẩn stays until closed, Cần làm 8s, Tin 5s (Xong = sonner's 4s default). */
export function pushToastDuration(priority: PushToastMessage["priority"]) {
  if (priority === "URGENT") return Number.POSITIVE_INFINITY;
  return priority === "IMPORTANT" ? 8_000 : 5_000;
}

/** Reads a service-worker message; anything that is not a well-formed push message is ignored. */
export function readPushMessage(data: unknown, origin: string): PushToastMessage | null {
  if (!isRecord(data) || data.type !== PUSH_MESSAGE_TYPE || !isRecord(data.payload)) return null;
  const payload = data.payload;
  const title = text(payload.title);
  if (!title) return null;
  const id = text(payload.notificationId) ?? text(payload.recipientId);
  return {
    body: text(payload.body),
    href: sameOriginPath(text(payload.url), origin) ?? (id ? `/notifications/${encodeURIComponent(id)}` : "/notifications"),
    id,
    priority: readPriority(text(payload.priority)),
    title,
  };
}

function readPriority(value: string | undefined): PushToastMessage["priority"] {
  const normalized = value?.toUpperCase();
  if (normalized === "URGENT") return "URGENT";
  return normalized === "IMPORTANT" || normalized === "HIGH" ? "IMPORTANT" : "INFO";
}

function sameOriginPath(value: string | undefined, origin: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : undefined;
  } catch {
    return undefined;
  }
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}
