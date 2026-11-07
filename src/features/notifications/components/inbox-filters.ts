import type { NotificationFeedItem } from "../api/notification-types";

export type InboxItem = NotificationFeedItem;
export type InboxFilter = "ALL" | "ACTION" | "SCHOOL" | "SYSTEM" | "UNREAD";
export type InboxWorkspace = "ADMIN" | "TEACHER" | "STUDENT";
export type InboxTab = { id: string; label: string };

/** Needs the recipient to press "Đã nắm thông tin". */
export const needsAck = (item: InboxItem) => item.requireReadAck && !item.ackedAt;

/**
 * SCHOOL ("Trung tâm" / "Từ trường") = messages people sent: campaigns (campaignId set) and announcement-like
 * events (type "company": announcement/broadcast/policy). SYSTEM = everything else, i.e. automated events
 * (system alerts, homework results, leave requests…), as on the canvas N12/N15.
 */
export const isSchoolMessage = (item: InboxItem) => Boolean(item.campaignId) || item.type === "company";

const MATCHES: Record<InboxFilter, (item: InboxItem) => boolean> = {
  ALL: () => true,
  ACTION: needsAck,
  SCHOOL: isSchoolMessage,
  SYSTEM: (item) => !isSchoolMessage(item),
  UNREAD: (item) => item.unread,
};

/** Items of the filter, URGENT first ("Khẩn" is pinned to the top); order is kept within each group. */
export function filterInbox(items: InboxItem[], f: InboxFilter): InboxItem[] {
  const kept = items.filter(MATCHES[f]);
  return [...kept.filter((item) => item.priorityLevel === "URGENT"), ...kept.filter((item) => item.priorityLevel !== "URGENT")];
}

const TABS: Record<InboxWorkspace, InboxTab[]> = {
  // Admin boxes: received inbox, campaigns sent, drafts.
  ADMIN: [
    { id: "INBOX", label: "Nhận" },
    { id: "SENT", label: "Đã gửi" },
    { id: "DRAFT", label: "Nháp" },
  ],
  TEACHER: [
    { id: "ALL", label: "Tất cả" },
    { id: "SCHOOL", label: "Trung tâm" },
    { id: "SYSTEM", label: "Hệ thống" },
  ],
  STUDENT: [
    { id: "ALL", label: "Tất cả" },
    { id: "UNREAD", label: "Chưa đọc" },
  ],
};

export function inboxTabsFor(workspace: InboxWorkspace): Array<{ id: string; label: string }> {
  return TABS[workspace];
}

/** Filters shown inside a workspace's received inbox (the admin's "Nhận" box has its own set). */
export function inboxFiltersFor(workspace: InboxWorkspace): Array<{ id: InboxFilter; label: string }> {
  if (workspace === "ADMIN") {
    return [
      { id: "ALL", label: "Tất cả" },
      { id: "ACTION", label: "Cần xử lý" },
      { id: "SCHOOL", label: "Từ trường" },
      { id: "SYSTEM", label: "Hệ thống" },
    ];
  }
  return TABS[workspace] as Array<{ id: InboxFilter; label: string }>;
}

export function inboxSourceLabel(item: InboxItem) {
  return item.senderName ?? (isSchoolMessage(item) ? "Trung tâm" : "Hệ thống");
}

export function priorityLabel(item: Pick<InboxItem, "priorityLevel">) {
  if (item.priorityLevel === "URGENT") return "Khẩn";
  if (item.priorityLevel === "IMPORTANT") return "Quan trọng";
  return null;
}
