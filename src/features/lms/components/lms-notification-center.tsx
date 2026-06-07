import { useEffect, useMemo, useState } from "react";
import { Bell, Building2, CheckCheck, Megaphone, ServerCog, Star, X } from "lucide-react";
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

const notificationTypes: Array<{ type: LmsNotificationType; label: string }> = [
  { type: "company", label: "Công ty" },
  { type: "general", label: "Lớp học" },
  { type: "system", label: "Hệ thống" },
];

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
  const [activeType, setActiveType] = useState<LmsNotificationType>("system");
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(lmsNotifications.filter((item) => !item.unread).map((item) => item.id)));
  const unreadCount = lmsNotifications.filter((item) => !readIds.has(item.id)).length;
  const visibleNotifications = useMemo(
    () => lmsNotifications.filter((item) => item.type === activeType),
    [activeType],
  );

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
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#d13438] text-[10px] font-semibold leading-none text-white ring-2 ring-white">
              {unreadCount}
            </span>
          ) : null}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-[min(430px,calc(100vw-24px))] gap-0 overflow-hidden rounded-lg border border-[#e0e4ea] bg-white p-0 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Thông báo</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Cập nhật mới nhất cho giáo viên LMS</p>
          </div>
          <Button variant="ghost" size="sm" className="rounded-md text-[var(--erg-blue)]" onClick={markAllAsRead}>
            <CheckCheck data-icon="inline-start" />
            Đọc tất cả
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3">
          {notificationTypes.map((item) => {
            const count = lmsNotifications.filter((notification) => notification.type === item.type && !readIds.has(notification.id)).length;
            const active = activeType === item.type;

            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setActiveType(item.type)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                  active ? "bg-[var(--erg-blue)] text-white" : "text-slate-500 hover:bg-[#f3f4f6] hover:text-slate-800",
                )}
              >
                {item.label}
                {count ? (
                  <span className={cn("grid size-5 place-items-center rounded-md text-xs", active ? "bg-white text-[var(--erg-blue)]" : "bg-slate-200 text-slate-700")}>
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="max-h-[440px] overflow-y-auto bg-slate-50/70 px-4 py-3">
          {visibleNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              className={cn(
                "mb-3 flex w-full items-start gap-3 rounded-lg border border-transparent bg-white p-4 text-left shadow-sm transition hover:border-[#b8d6fa]",
                !readIds.has(notification.id) && "bg-[#ebf3fc]",
              )}
            >
              <NotificationIcon type={notification.type} />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold leading-5 text-slate-900">{notification.title}</span>
                  <Star className={cn("mt-0.5 size-4 shrink-0", notification.starred ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.description}</span>
                <span className="mt-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400">
                  {notification.timeLabel}
                  {!readIds.has(notification.id) ? <span className="size-2 rounded-full bg-[var(--erg-blue)]" /> : null}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-white px-4 py-3">
          <Button className="w-full rounded-md bg-[var(--erg-blue)] font-semibold hover:bg-[var(--erg-blue-hover)]">Xem tất cả thông báo</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationIcon({ type }: { type: LmsNotificationType }) {
  const Icon = type === "company" ? Building2 : type === "system" ? ServerCog : Megaphone;

  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg text-white", type === "company" ? "bg-[var(--erg-blue)]" : type === "system" ? "bg-[var(--erg-blue)]" : "bg-amber-500")}>
      <Icon className="size-5" />
    </span>
  );
}

function showSystemToast(notification: LmsNotification, onOpenDetail: (notification: LmsNotification) => void) {
  toast.custom(
    (toastId) => (
      <div className="relative flex w-[360px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-lg border border-[#b8d6fa] bg-white p-4 pr-11 text-left shadow-sm transition duration-300 ease-out">
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
              <span className="text-xs font-semibold text-slate-400">{notification.timeLabel}</span>
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
          className="absolute right-3 top-3 grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-[#f3f4f6] hover:text-slate-700"
        >
          <X className="size-4" />
        </button>
      </div>
    ),
    { className: "lms-system-toast", duration: 5200 },
  );
}
