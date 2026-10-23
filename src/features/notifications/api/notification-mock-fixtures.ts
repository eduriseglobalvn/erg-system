import type {
  NotificationChannel,
  NotificationPreferenceResponse,
  NotificationPriority,
} from "./notification-types";

export type MockNotificationRecord = {
  actionUrl?: string;
  archivedAt: string | null;
  body: string;
  bodyPreview: string;
  channel: NotificationChannel;
  createdAt: string;
  data: Record<string, unknown>;
  eventType: string;
  id: string;
  priority: NotificationPriority;
  readAt: string | null;
  recipientId?: string;
  portal: string;
  sourceId?: string;
  sourceType: string;
  starred?: boolean;
  status: "unread" | "read";
  title: string;
};


export const MOCK_NOTIFICATION_FIXTURES: Array<Omit<MockNotificationRecord, "archivedAt" | "portal">> = [
  {
    id: "system-schedule-updated",
    recipientId: "recipient-system-schedule-updated",
    eventType: "SCHEDULE_PUBLISHED",
    sourceType: "schedule",
    sourceId: "sch-1",
    title: "Lớp học vừa được cập nhật thời khóa biểu",
    bodyPreview: "Vào lúc 09:02 19/05/2026, thời khóa biểu đã được cập nhật.",
    body: "Giáo viên cần kiểm tra lại lịch dạy trước khi vào lớp để tránh xung đột tiết học.",
    actionUrl: "/notifications/system-schedule-updated",
    priority: "normal",
    channel: "push",
    status: "unread",
    readAt: null,
    createdAt: "2026-05-19T09:02:00+07:00",
    data: { kind: "schedule" },
  },
  {
    id: "company-training",
    recipientId: "recipient-company-training",
    eventType: "ANNOUNCEMENT_PUBLISHED",
    sourceType: "company",
    sourceId: "announce-6-2026",
    title: "Công ty mở lịch tập huấn LMS tháng 6",
    bodyPreview: "Giáo viên đăng ký ca phù hợp để cập nhật quy trình giao bài và báo cáo.",
    body: "Chương trình tập huấn tập trung vào giao bài, phản hồi học sinh và báo cáo theo tuần.",
    actionUrl: "/notifications/company-training",
    priority: "high",
    channel: "push",
    status: "unread",
    readAt: null,
    createdAt: "2026-05-19T08:30:00+07:00",
    data: { kind: "company-training" },
    starred: true,
  },
  {
    id: "general-homework",
    recipientId: "recipient-general-homework",
    eventType: "ASSIGNMENT_CREATED",
    sourceType: "assignment",
    sourceId: "asg-1",
    title: "Bài tập mới cần rà soát trước khi gửi",
    bodyPreview: "Kho bài tập có 4 câu hỏi mới được đồng bộ cho lớp đang chọn.",
    body: "Bạn có thể mở chi tiết để kiểm tra đề, mức độ khó và thời hạn nộp trước khi phát hành.",
    actionUrl: "/notifications/general-homework",
    priority: "normal",
    channel: "inbox",
    status: "read",
    readAt: "2026-05-18T17:05:00+07:00",
    createdAt: "2026-05-18T16:45:00+07:00",
    data: { kind: "assignment" },
  },
  {
    id: "system-sync",
    recipientId: "recipient-system-sync",
    eventType: "SYNC_COMPLETED",
    sourceType: "system",
    sourceId: "sync-2026-05-18",
    title: "Đồng bộ dữ liệu học sinh hoàn tất",
    bodyPreview: "Hệ thống đã cập nhật danh sách học sinh và trạng thái tài khoản.",
    body: "Bản đồng bộ vừa hoàn tất, dữ liệu lớp học đang phản ánh trạng thái mới nhất từ máy chủ.",
    actionUrl: "/notifications/system-sync",
    priority: "normal",
    channel: "push",
    status: "unread",
    readAt: null,
    createdAt: "2026-05-18T14:20:00+07:00",
    data: { kind: "sync" },
  },
  {
    id: "company-policy",
    recipientId: "recipient-company-policy",
    eventType: "POLICY_REMINDER",
    sourceType: "company",
    sourceId: "policy-2026-weekly",
    title: "Nhắc lịch hoàn tất báo cáo tuần",
    bodyPreview: "Báo cáo lớp cần được gửi trước 17:00 thứ Sáu tuần này.",
    body: "Thông báo này giúp giáo viên nắm hạn chót báo cáo và mở đúng nghiệp vụ cần theo dõi.",
    actionUrl: "/notifications/company-policy",
    priority: "normal",
    channel: "inbox",
    status: "read",
    readAt: "2026-05-17T10:30:00+07:00",
    createdAt: "2026-05-17T10:10:00+07:00",
    data: { kind: "policy" },
  },
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceResponse[] = [
  {
    emailEnabled: false,
    eventType: "ASSIGNMENT_CREATED",
    inboxEnabled: true,
    pushEnabled: true,
    quietHours: { start: "22:00", end: "06:00" },
  },
  {
    emailEnabled: false,
    eventType: "SCHEDULE_PUBLISHED",
    inboxEnabled: true,
    pushEnabled: true,
  },
  {
    emailEnabled: false,
    eventType: "POLICY_REMINDER",
    inboxEnabled: true,
    pushEnabled: true,
  },
];

