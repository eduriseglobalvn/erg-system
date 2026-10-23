export type PortalNotification = {
  id: string;
  type: "reminder" | "success" | "info" | "warning";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
};

export type PortalNotificationTab = "all" | "unread";

export const PORTAL_NOTIFICATIONS: PortalNotification[] = [
  { id: "1", type: "reminder", title: "Thông báo nhắc nhở", message: "Nhắc nhở lịch học cho các lớp đang theo học. Nhấn để xem chi tiết.", time: "Hôm nay, 10:55", isRead: false },
  { id: "2", type: "success", title: "Thông báo nhắc nhở", message: "Nhắc nhở lịch dạy cho các lớp đang phụ trách. Nhấn để xem chi tiết.", time: "Hôm nay, 10:55", isRead: false },
  { id: "3", type: "info", title: "Thông báo hệ thống", message: "Đã cập nhật phiên bản mới. Một số tính năng mới đã được thêm vào.", time: "Hôm qua, 14:30", isRead: true },
  { id: "4", type: "warning", title: "Cảnh báo", message: "Lớp học sắp hết hạn đăng ký. Vui lòng kiểm tra và gia hạn.", time: "Hôm qua, 09:00", isRead: true },
];
