import { useEffect, useMemo, useState } from "react";
import { Bell, Building2, CheckCheck, Megaphone, MoreVertical, ServerCog, Settings, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "@/routes/router-compat";
import { cn } from "@/lib/utils";

type LmsNotificationType = "company" | "general" | "system";

export type LmsNotification = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  dateLabel: string;
  type: LmsNotificationType;
  unread: boolean;
  starred?: boolean;
};

export const lmsNotifications: LmsNotification[] = [
  {
    id: "system-schedule-updated",
    title: "Lớp học vừa được cập nhật thời khóa biểu",
    description: "Vào lúc 09:02 19/05/2026, thời khóa biểu đã được cập nhật",
    timeLabel: "09:02 19/05/2026",
    dateLabel: "19/05/2026",
    type: "system",
    unread: true,
  },
  {
    id: "company-training",
    title: "Công ty mở lịch tập huấn LMS tháng 6",
    description: "Giáo viên đăng ký ca phù hợp để cập nhật quy trình giao bài và báo cáo.",
    timeLabel: "08:30 19/05/2026",
    dateLabel: "19/05/2026",
    type: "company",
    unread: true,
    starred: true,
  },
  {
    id: "general-homework",
    title: "Bài tập mới cần rà soát trước khi gửi",
    description: "Kho bài tập có 4 câu hỏi mới được đồng bộ cho lớp đang chọn.",
    timeLabel: "16:45 18/05/2026",
    dateLabel: "18/05/2026",
    type: "general",
    unread: false,
  },
  {
    id: "system-sync",
    title: "Đồng bộ dữ liệu học sinh hoàn tất",
    description: "Hệ thống đã cập nhật danh sách học sinh và trạng thái tài khoản.",
    timeLabel: "14:20 18/05/2026",
    dateLabel: "18/05/2026",
    type: "system",
    unread: true,
  },
  {
    id: "company-policy",
    title: "Nhắc lịch hoàn tất báo cáo tuần",
    description: "Báo cáo lớp cần được gửi trước 17:00 thứ Sáu tuần này.",
    timeLabel: "10:10 17/05/2026",
    dateLabel: "17/05/2026",
    type: "company",
    unread: false,
  },
];

export function LmsNotificationCenter() {
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(lmsNotifications.filter((item) => !item.unread).map((item) => item.id)));
  const unreadCount = lmsNotifications.filter((item) => !readIds.has(item.id)).length;
  const latestNotifications = useMemo(() => lmsNotifications.slice(0, 3), []);

  useEffect(() => {
    const newestSystemNotification = lmsNotifications.find((item) => item.type === "system" && item.unread);
    if (!newestSystemNotification) return;

    const timeoutId = window.setTimeout(() => {
      showSystemToast(newestSystemNotification, openNotificationDetail);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function markAllAsRead() {
    setReadIds(new Set(lmsNotifications.map((item) => item.id)));
  }

  function openNotification(notification: LmsNotification) {
    setReadIds((current) => new Set(current).add(notification.id));
    openNotificationDetail(notification);
  }

  function openNotificationDetail(notification: LmsNotification) {
    setReadIds((current) => new Set(current).add(notification.id));
    navigate(`/notifications/${notification.id}`);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label="Thông báo"
          className="relative grid size-9 place-items-center rounded-md text-slate-500 transition hover:bg-[#f3f4f6] hover:text-[var(--erg-blue)]"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
        >
          <Bell className="size-5" />
          {unreadCount ? (
            <span className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-[#d13438] text-[11px] font-bold leading-none text-white ring-2 ring-white">
              {unreadCount}
            </span>
          ) : null}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        collisionPadding={12}
        className="w-[min(470px,calc(100vw-20px))] gap-0 overflow-hidden rounded-xl border border-[#d7e2ef] bg-white p-0 shadow-[0_18px_44px_rgba(15,23,42,0.14)]"
      >
        <div className="border-b border-[#eef2f7] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold leading-6 text-slate-950">Thông báo</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 shrink-0 rounded-md px-2 text-xs font-bold text-[var(--erg-blue)]" onClick={markAllAsRead}>
                <CheckCheck data-icon="inline-start" />
                Đọc tất cả
              </Button>
              <button type="button" aria-label="Cài đặt thông báo" className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-[#f3f4f6] hover:text-slate-900">
                <Settings className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-[var(--erg-blue-light)] px-4 py-2 text-sm font-black text-[var(--erg-blue)]">Tất cả</span>
            <span className="rounded-full px-4 py-2 text-sm font-black text-slate-700">Chưa đọc</span>
          </div>
        </div>

        <div className="max-h-[min(470px,calc(100vh-210px))] overflow-y-auto bg-white">
          <div className="px-4 pb-2 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950">Quan trọng</h3>
              <button type="button" onClick={() => navigate("/notifications")} className="text-sm font-semibold text-[var(--erg-blue)]">
                Xem tất cả
              </button>
            </div>
            <div className="grid gap-2">
              {latestNotifications.slice(0, 1).map((notification) => (
                <NotificationFeedItem
                  key={notification.id}
                  notification={notification}
                  unread={!readIds.has(notification.id)}
                  onOpen={() => openNotification(notification)}
                  thumbnail
                />
              ))}
            </div>
          </div>
          <div className="border-t border-[#eef2f7] px-4 pb-3 pt-4">
            <h3 className="mb-2 text-sm font-bold text-slate-950">Các thông báo khác</h3>
            <div className="grid gap-2">
              {latestNotifications.slice(1).map((notification) => (
                <NotificationFeedItem
                  key={notification.id}
                  notification={notification}
                  unread={!readIds.has(notification.id)}
                  onOpen={() => openNotification(notification)}
                  thumbnail={notification.type === "general"}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#eef2f7] bg-white px-5 py-3">
          <Button variant="ghost" size="sm" className="h-9 w-full rounded-lg text-sm font-black text-[var(--erg-blue)]" onClick={() => navigate("/notifications")}>
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationFeedItem({
  notification,
  onOpen,
  thumbnail,
  unread,
}: {
  notification: LmsNotification;
  onOpen: () => void;
  thumbnail?: boolean;
  unread: boolean;
}) {
  return (
    <button type="button" onClick={onOpen} className="group grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-[#e5ebf3] bg-white px-3 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition hover:border-[#b8d6fa] hover:bg-[#f8fbff]">
      <NotificationIcon type={notification.type} />
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-6 text-slate-900">
          <span className="font-bold">{notificationLabel(notification.type)}</span> · {notification.title}
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-slate-600">{notification.description}</span>
        <span className="mt-1 block text-xs font-bold text-slate-500">{notification.timeLabel}</span>
      </span>
      <span className="flex min-w-0 items-center gap-3">
        {thumbnail ? <span className={cn("hidden h-12 w-20 rounded-md md:block", notificationThumbnailClass(notification.type))} /> : null}
        {unread ? <span className="size-3 rounded-full bg-[var(--erg-blue)]" /> : null}
        <MoreVertical className="size-4 text-slate-500 opacity-0 transition group-hover:opacity-100" />
      </span>
    </button>
  );
}

function NotificationIcon({ type }: { type: LmsNotificationType }) {
  const Icon = type === "company" ? Building2 : type === "system" ? ServerCog : Megaphone;

  return (
    <span className={cn("grid size-12 shrink-0 place-items-center rounded-full text-white", notificationIconClass(type))}>
      <Icon className="size-5" />
    </span>
  );
}

function notificationIconClass(type: LmsNotificationType) {
  if (type === "company") return "bg-slate-700";
  if (type === "system") return "bg-[var(--erg-blue)]";
  return "bg-amber-500";
}

function notificationThumbnailClass(type: LmsNotificationType) {
  if (type === "company") return "bg-[linear-gradient(135deg,#0f172a,#64748b)]";
  if (type === "system") return "bg-[linear-gradient(135deg,#0068d9,#9cc9ff)]";
  return "bg-[linear-gradient(135deg,#f59e0b,#fde68a)]";
}

function notificationLabel(type: LmsNotificationType) {
  if (type === "company") return "Công ty";
  if (type === "system") return "Hệ thống";
  return "Lớp học";
}

function showSystemToast(notification: LmsNotification, onOpenDetail: (notification: LmsNotification) => void) {
  toast.custom(
    (toastId) => (
      <div className="relative flex w-[380px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-xl border border-[#b8d6fa] bg-white p-4 pr-11 text-left shadow-[0_16px_42px_rgba(15,23,42,0.16)] transition duration-300 ease-out">
        <button
          type="button"
          onClick={() => {
            toast.dismiss(toastId);
            onOpenDetail(notification);
          }}
          className="flex min-w-0 flex-1 items-start gap-3 text-left outline-none"
        >
          <NotificationIcon type="system" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-md bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
                Hệ thống
              </Badge>
              <span className="text-[13px] font-semibold text-slate-600">{notification.timeLabel}</span>
            </span>
            <span className="mt-2 block text-sm font-semibold leading-5 text-slate-950">{notification.title}</span>
            <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.description}</span>
          </span>
        </button>
        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={(event) => {
            event.stopPropagation();
            toast.dismiss(toastId);
          }}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-[#f3f4f6] hover:text-slate-800"
        >
          <X className="size-4" />
        </button>
      </div>
    ),
    { className: "lms-system-toast", duration: 5200 },
  );
}
