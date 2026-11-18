import { expect, test } from "vitest";

import { PUSH_MESSAGE_TYPE, pushToastDuration, readPushMessage } from "./push-floating-model";

const ORIGIN = "https://lms.erg.edu.vn";
const message = (payload: Record<string, unknown>) => ({ type: PUSH_MESSAGE_TYPE, payload });

test("reads a push message with a same-origin link and priority", () => {
  expect(readPushMessage(message({ title: "Bài mới", body: "Toán", priority: "URGENT", url: "/student/assignments/a1", notificationId: "m1" }), ORIGIN)).toEqual({
    body: "Toán",
    href: "/student/assignments/a1",
    id: "m1",
    priority: "URGENT",
    title: "Bài mới",
  });
});

test("cross-origin links fall back to the notification page; HIGH counts as IMPORTANT", () => {
  const read = readPushMessage(message({ title: "T", url: "https://evil.example/x", notificationId: "m 2", priority: "high" }), ORIGIN);
  expect(read?.href).toBe("/notifications/m%202");
  expect(read?.priority).toBe("IMPORTANT");
  expect(readPushMessage(message({ title: "T" }), ORIGIN)?.href).toBe("/notifications");
});

test("ignores other messages and pushes without a title", () => {
  expect(readPushMessage({ type: "other", payload: { title: "T" } }, ORIGIN)).toBeNull();
  expect(readPushMessage(message({ body: "no title" }), ORIGIN)).toBeNull();
  expect(readPushMessage(null, ORIGIN)).toBeNull();
});

test("Khẩn stays until closed, Cần làm 8s, Tin 5s", () => {
  expect(pushToastDuration("URGENT")).toBe(Number.POSITIVE_INFINITY);
  expect(pushToastDuration("IMPORTANT")).toBe(8_000);
  expect(pushToastDuration("INFO")).toBe(5_000);
});
