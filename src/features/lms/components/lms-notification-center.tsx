import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, CheckCheck, Megaphone, MoreVertical, ServerCog, Settings, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fetchNotificationFeed,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationQueryKeys,
  type LmsNotificationType,
  type NotificationFeedItem,
} from "@/features/notifications/api/notification-api";
import { cn } from "@/lib/utils";
import { useNavigate } from "@/routes/router-compat";

const LMS_NOTIFICATION_PORTAL = "lms";

export function LmsNotificationCenter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shownToastRef = useRef<string | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const notificationsQuery = useQuery({
    queryKey: notificationQueryKeys.inbox(LMS_NOTIFICATION_PORTAL, tab, 0, 5),
    queryFn: () => fetchNotificationFeed({ portal: LMS_NOTIFICATION_PORTAL, status: tab, page: 0, size: 5 }),
    staleTime: 30_000,
  });
  const unreadCountQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(LMS_NOTIFICATION_PORTAL),
    queryFn: () => fetchUnreadNotificationCount(LMS_NOTIFICATION_PORTAL),
    staleTime: 30_000,
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId, LMS_NOTIFICATION_PORTAL),
    onSuccess: invalidateNotificationQueries,
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(LMS_NOTIFICATION_PORTAL),
    onSuccess: invalidateNotificationQueries,
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const latestNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);
  const unreadCount = unreadCountQuery.data?.unread ?? notifications.filter((item) => item.unread).length;
  const newestSystemNotification = useMemo(
    () => notifications.find((item) => item.type === "system" && item.unread),
    [notifications],
  );

  useEffect(() => {
    if (!newestSystemNotification || shownToastRef.current === newestSystemNotification.id) return;

    shownToastRef.current = newestSystemNotification.id;
    const timeoutId = window.setTimeout(() => {
      showSystemToast(newestSystemNotification, openNotificationDetail);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [newestSystemNotification?.id]);

  function invalidateNotificationQueries() {
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(LMS_NOTIFICATION_PORTAL) });
  }

  function markAllAsRead() {
    void markAllReadMutation.mutateAsync();
  }

  function openNotification(notification: NotificationFeedItem) {
    if (notification.unread) {
      markReadMutation.mutate(notification.id);
    }
    openNotificationDetail(notification);
  }

  function openNotificationDetail(notification: NotificationFeedItem) {
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
              {unreadCount > 99 ? "99+" : unreadCount}
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 rounded-md px-2 text-xs font-bold text-[var(--erg-blue)]"
                disabled={!unreadCount || markAllReadMutation.isPending}
                onClick={markAllAsRead}
              >
                <CheckCheck data-icon="inline-start" />
                Đọc tất cả
              </Button>
              <button
                type="button"
                aria-label="Cài đặt thông báo"
                className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-[#f3f4f6] hover:text-slate-900"
              >
                <Settings className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <NotificationTab active={tab === "all"} label="Tất cả" onClick={() => setTab("all")} />
            <NotificationTab active={tab === "unread"} label="Chưa đọc" onClick={() => setTab("unread")} />
          </div>
        </div>

        <div className="max-h-[min(470px,calc(100vh-210px))] overflow-y-auto bg-white">
          {notificationsQuery.isLoading ? (
            <NotificationPopoverState label="Đang tải thông báo..." />
          ) : notificationsQuery.isError ? (
            <NotificationPopoverState label="Không tải được thông báo." />
          ) : latestNotifications.length ? (
            <>
              <div className="px-4 pb-2 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-950">Quan trọng</h3>
                  <button type="button" onClick={() => navigate("/notifications")} className="text-sm font-semibold text-[var(--erg-blue)]">
                    Xem tất cả
                  </button>
                </div>
                <div className="grid gap-2">
                  {latestNotifications.slice(0, 1).map((notification) => (
                    <NotificationFeedCard
                      key={notification.id}
                      notification={notification}
                      unread={notification.unread}
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
                    <NotificationFeedCard
                      key={notification.id}
                      notification={notification}
                      unread={notification.unread}
                      onOpen={() => openNotification(notification)}
                      thumbnail={notification.type === "general"}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <NotificationPopoverState label={tab === "unread" ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."} />
          )}
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

function NotificationTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-4 py-2 text-sm font-black transition",
        active ? "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "text-slate-700 hover:bg-[#f3f4f6]",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NotificationPopoverState({ label }: { label: string }) {
  return (
    <div className="px-5 py-8 text-center text-sm font-semibold leading-6 text-slate-500">
      {label}
    </div>
  );
}

function NotificationFeedCard({
  notification,
  onOpen,
  thumbnail,
  unread,
}: {
  notification: NotificationFeedItem;
  onOpen: () => void;
  thumbnail?: boolean;
  unread: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-[#e5ebf3] bg-white px-3 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition hover:border-[#b8d6fa] hover:bg-[#f8fbff]"
    >
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

function showSystemToast(notification: NotificationFeedItem, onOpenDetail: (notification: NotificationFeedItem) => void) {
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
