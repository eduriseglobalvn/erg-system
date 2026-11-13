import type { NotificationFeedItem } from "@/features/notifications/api/notification-types";
import { isSchoolMessage } from "@/features/notifications/components/inbox-filters";

import type { QuestionThreadSummary } from "../api/student-question-thread-api";

export type InboxChip = "ALL" | "THREAD" | "NOTICE" | "RANK";
export const INBOX_CHIPS: ReadonlyArray<{ id: InboxChip; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "THREAD", label: "Hỏi giáo viên" },
  { id: "NOTICE", label: "Thông báo" },
  { id: "RANK", label: "Thi đua" },
];

export type InboxEntryKind = "THREAD" | "CLASS" | "DISCUSSION" | "RANK" | "CENTER" | "SYSTEM";
export type InboxEntry = {
  /** Unique across both sources: `thread:<id>` or `note:<id>`. */
  key: string;
  kind: InboxEntryKind;
  title: string;
  preview: string;
  at: string;
  unread: boolean;
  thread?: QuestionThreadSummary;
  notification?: NotificationFeedItem;
};

const RANK_EVENT = /leaderboard|rank|badge|tier|xp|streak/i;

export function notificationKind(item: NotificationFeedItem): InboxEntryKind {
  if (RANK_EVENT.test(item.eventType)) return "RANK";
  if (/discussion/i.test(item.eventType)) return "DISCUSSION";
  if (isSchoolMessage(item)) return item.campaignId || !item.senderName ? "CENTER" : "CLASS";
  return "SYSTEM";
}

export function threadTitle(thread: QuestionThreadSummary) {
  const teacher = thread.teacherName ? `Cô ${thread.teacherName}` : "Giáo viên";
  return thread.status === "ANSWERED" ? `${teacher} đã trả lời câu ${thread.questionIndex}` : `Bạn hỏi câu ${thread.questionIndex}`;
}

/**
 * One list, newest first. A thread is unread while the server says so; `seenThreads` hides it at once when the student
 * opens it, before the mark-read round trip returns.
 */
export function mergeInboxEntries(threads: ReadonlyArray<QuestionThreadSummary>, notes: ReadonlyArray<NotificationFeedItem>, seenThreads: ReadonlySet<string>): InboxEntry[] {
  const fromThreads: InboxEntry[] = threads.map((thread) => ({
    key: `thread:${thread.id}`,
    kind: "THREAD",
    title: threadTitle(thread),
    preview: thread.lastMessagePreview ?? thread.questionPrompt ?? "",
    at: thread.lastMessageAt ?? "",
    unread: thread.unread && !seenThreads.has(thread.id),
    thread,
  }));
  const fromNotes: InboxEntry[] = notes.map((item) => ({
    key: `note:${item.id}`, kind: notificationKind(item), title: item.title, preview: item.bodyPreview, at: item.createdAt, unread: item.unread, notification: item,
  }));
  return [...fromThreads, ...fromNotes].sort((a, b) => Date.parse(b.at || "0") - Date.parse(a.at || "0"));
}

const CHIP_MATCH: Record<InboxChip, (entry: InboxEntry) => boolean> = {
  ALL: () => true,
  THREAD: (entry) => entry.kind === "THREAD",
  NOTICE: (entry) => entry.kind !== "THREAD" && entry.kind !== "RANK",
  RANK: (entry) => entry.kind === "RANK",
};

export const filterInboxEntries = (entries: ReadonlyArray<InboxEntry>, chip: InboxChip) => entries.filter(CHIP_MATCH[chip]);
