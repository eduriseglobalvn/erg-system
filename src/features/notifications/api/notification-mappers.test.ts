import { describe, expect, test } from "vitest";

import {
  mapNotificationDetail,
  mapNotificationItem,
  mapNotificationPage,
  normalizePortal,
} from "./notification-mappers";

describe("notification contract mappers", () => {
  test("normalizes unknown status and missing optional fields into a stable feed domain", () => {
    const item = mapNotificationItem({
      createdAt: "invalid-date",
      id: "notification-1",
      status: "FUTURE_STATUS",
      title: "System maintenance",
    });

    expect(item).toMatchObject({
      bodyPreview: "System maintenance",
      channel: "inbox",
      data: {},
      dateLabel: "",
      eventType: "UNKNOWN",
      priority: "normal",
      sourceType: "general",
      status: "unread",
      timeLabel: "",
      type: "general",
      unread: true,
    });
  });

  test("maps read timestamps, high priority, and detail body without leaking DTO shape", () => {
    const detail = mapNotificationDetail({
      body: "Full body",
      createdAt: "2026-07-28T08:30:00+07:00",
      id: "notification-2",
      priority: "high",
      readAt: "2026-07-28T09:00:00+07:00",
      sourceType: "announcement",
      status: "UNKNOWN",
      title: "Company update",
    }, "lms");

    expect(detail).toMatchObject({
      body: "Full body",
      portal: "lms",
      starred: true,
      status: "read",
      type: "company",
      unread: false,
    });
  });

  test("preserves server pagination while mapping items and normalizes portal input", () => {
    const page = mapNotificationPage({
      hasNext: false,
      hasPrevious: true,
      items: [{ id: "notification-3", title: "Assignment" }],
      page: 2,
      size: 20,
      totalItems: 41,
      totalPages: 3,
    });

    expect(page).toMatchObject({ page: 2, size: 20, totalItems: 41, totalPages: 3 });
    expect(page.items[0]).toMatchObject({ id: "notification-3", status: "unread" });
    expect(normalizePortal("  LCMS  ")).toBe("lcms");
  });
});
