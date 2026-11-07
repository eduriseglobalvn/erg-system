import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, vi } from "vitest";

// Runs public/pwa-push.js (imported into the PWA service worker) against a fake `self`.
const source = readFileSync(resolve(process.cwd(), "public/pwa-push.js"), "utf8");
const ORIGIN = "https://lms.erg.edu.vn";

function loadWorker() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const client = { url: `${ORIGIN}/teacher`, focus: vi.fn(async () => undefined), navigate: vi.fn(async (_url: string) => undefined), postMessage: vi.fn() };
  const self = {
    location: new URL(ORIGIN),
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      listeners[type] = listener;
    },
    registration: { showNotification: vi.fn(async () => undefined) },
    clients: { matchAll: vi.fn(async () => [client]), openWindow: vi.fn(async () => undefined) },
  };
  new Function("self", source)(self);

  async function push(payload: unknown) {
    let done: Promise<unknown> = Promise.resolve();
    listeners.push({ data: { json: () => payload, text: () => "" }, waitUntil: (promise: Promise<unknown>) => (done = promise) });
    await done;
    return self.registration.showNotification.mock.calls.at(-1) as unknown as [string, { requireInteraction?: boolean; data: unknown }];
  }

  async function click(data: unknown) {
    let done: Promise<unknown> = Promise.resolve();
    listeners.notificationclick({ notification: { data, close: vi.fn() }, waitUntil: (promise: Promise<unknown>) => (done = promise) });
    await done;
    return client.navigate.mock.calls.at(-1)?.[0];
  }

  return { push, click, client };
}

const webPush = (extra: Record<string, unknown> = {}) => ({ notificationId: "m1", title: "Khẩn", body: "Nội dung", priority: "URGENT", url: "/notifications/m1", tag: "m1", requireInteraction: true, ...extra });

test("an URGENT Web Push stays on screen (requireInteraction) and opens the payload url", async () => {
  const worker = loadWorker();
  const [title, options] = await worker.push(webPush());
  expect(title).toBe("Khẩn");
  expect(options.requireInteraction).toBe(true);

  expect(await worker.click(options.data)).toBe(`${ORIGIN}/notifications/m1`);
  expect(worker.client.focus).toHaveBeenCalled();
});

test("a normal push does not require interaction", async () => {
  const [, options] = await loadWorker().push(webPush({ priority: "INFO", requireInteraction: false }));
  expect(options.requireInteraction).toBe(false);
});

test("a cross-origin url is ignored; the id link with source=push is the fallback", async () => {
  const worker = loadWorker();
  const [, options] = await worker.push(webPush({ url: "https://evil.example/notifications/m1" }));
  expect(await worker.click(options.data)).toBe(`${ORIGIN}/notifications/m1?source=push`);
});

test("without a url the click keeps the /notifications/{id}?source=push behaviour", async () => {
  const worker = loadWorker();
  const [, options] = await worker.push({ data: { notificationId: "m 2", title: "FCM" } });
  expect(await worker.click(options.data)).toBe(`${ORIGIN}/notifications/m%202?source=push`);
});
