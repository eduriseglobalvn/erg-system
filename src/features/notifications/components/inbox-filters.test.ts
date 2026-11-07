import { describe, expect, test } from "vitest";

import { mapNotificationItem } from "../api/notification-mappers";
import { filterInbox, inboxTabsFor, type InboxItem } from "./inbox-filters";

const item = (id: string, extra: Partial<InboxItem> = {}): InboxItem => ({ ...mapNotificationItem({ id, title: id }), ...extra });

const items: InboxItem[] = [
  item("info-ack", { requireReadAck: true, campaignId: "c1" }),
  item("system", { type: "system" }),
  item("urgent-1", { priorityLevel: "URGENT", campaignId: "c2" }),
  item("acked", { requireReadAck: true, ackedAt: "2026-11-06T08:00:00Z", campaignId: "c3", unread: false }),
  item("urgent-2", { priorityLevel: "URGENT", type: "system", requireReadAck: true }),
  item("company", { type: "company" }),
];

const ids = (list: InboxItem[]) => list.map((entry) => entry.id);

describe("filterInbox", () => {
  test("ACTION keeps only messages that need an ack and are not acked yet", () => {
    expect(ids(filterInbox(items, "ACTION"))).toEqual(["urgent-2", "info-ack"]);
  });

  test("URGENT messages come first in every filter, original order otherwise", () => {
    expect(ids(filterInbox(items, "ALL"))).toEqual(["urgent-1", "urgent-2", "info-ack", "system", "acked", "company"]);
    expect(ids(filterInbox(items, "SCHOOL"))).toEqual(["urgent-1", "info-ack", "acked", "company"]);
    expect(ids(filterInbox(items, "SYSTEM"))).toEqual(["urgent-2", "system"]);
    expect(ids(filterInbox(items, "UNREAD"))).toEqual(["urgent-1", "urgent-2", "info-ack", "system", "company"]);
  });
});

describe("inboxTabsFor", () => {
  const labels = (workspace: Parameters<typeof inboxTabsFor>[0]) => inboxTabsFor(workspace).map((tab) => tab.label);

  test("admin: Nhận, Đã gửi, Lên lịch, Nháp", () => expect(labels("ADMIN")).toEqual(["Nhận", "Đã gửi", "Lên lịch", "Nháp"]));
  test("teacher: Tất cả, Trung tâm, Hệ thống", () => expect(labels("TEACHER")).toEqual(["Tất cả", "Trung tâm", "Hệ thống"]));
  test("student: Tất cả, Chưa đọc", () => expect(labels("STUDENT")).toEqual(["Tất cả", "Chưa đọc"]));
});
