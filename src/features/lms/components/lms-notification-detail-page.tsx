import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Building2, CalendarClock, Hash, Megaphone, MoreVertical, ServerCog, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchNotificationDetail,
  fetchNotificationFeed,
  fetchUnreadNotificationCount,
  markNotificationRead,
  notificationQueryKeys,
  type LmsNotificationType,
  type NotificationDetailItem,
  type NotificationFeedItem,
} from "@/features/notifications/api/notification-api";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { cn } from "@/lib/utils";

const LMS_NOTIFICATION_PORTAL = "lms";

export function LmsNotificationListPage({
  onOpenDetail,
}: {
  onOpenDetail: (notificationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const [tab, setTab] = useState<"all" | "unread">("all");
  const notificationsQuery = useQuery({
    queryKey: notificationQueryKeys.inbox(LMS_NOTIFICATION_PORTAL, tab, 0, 30),
    queryFn: () => fetchNotificationFeed({ portal: LMS_NOTIFICATION_PORTAL, status: tab, page: 0, size: 30 }),
    staleTime: 30_000,
  });
  const unreadCountQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(LMS_NOTIFICATION_PORTAL),
    queryFn: () => fetchUnreadNotificationCount(LMS_NOTIFICATION_PORTAL),
    staleTime: 30_000,
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId, LMS_NOTIFICATION_PORTAL),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(LMS_NOTIFICATION_PORTAL) });
    },
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const newNotifications = notifications.slice(0, 3);
  const previousNotifications = notifications.slice(3);
  const unreadTotal = unreadCountQuery.data?.unread ?? notifications.filter((notification) => notification.unread).length;

  function openNotification(notification: NotificationFeedItem) {
    if (notification.unread) {
      markReadMutation.mutate(notification.id);
    }
    onOpenDetail(notification.id);
  }

  if (isMobile) {
    return (
      <section className="min-h-full bg-[#f3f6fb] px-3 pb-4 pt-3 text-slate-950">
        <div className="rounded-[24px] border border-[#d9e2ef] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-extrabold text-[var(--erg-blue)]">Thông báo</div>
              <h1 className="mt-1 text-xl font-extrabold">Hộp thư LMS</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{unreadTotal} thông báo chưa đọc</p>
            </div>
            <button type="button" aria-label="Cài đặt thông báo" className="grid h-11 w-11 place-items-center rounded-full bg-[#f8fbff] text-slate-600">
              <Settings className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 rounded-[16px] bg-[#eef3f8] p-1">
            <NotificationListTab active={tab === "all"} label="Tất cả" onClick={() => setTab("all")} />
            <NotificationListTab active={tab === "unread"} label="Chưa đọc" onClick={() => setTab("unread")} />
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          {notificationsQuery.isLoading ? (
            <NotificationListState label="Đang tải thông báo..." />
          ) : notificationsQuery.isError ? (
            <NotificationListState label="Không tải được thông báo." />
          ) : notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className="flex min-h-[92px] w-full items-start gap-3 rounded-[22px] border border-white bg-white p-4 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              >
                <NotificationDetailIcon notification={notification} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] font-extrabold leading-6 text-slate-950">{notification.title}</span>
                  <span className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-500">{notification.description}</span>
                  <span className="mt-2 block text-xs font-extrabold text-slate-400">{notification.timeLabel}</span>
                </span>
                {notification.unread ? <span className="mt-2 h-3 w-3 rounded-full bg-[var(--erg-blue)]" /> : null}
              </button>
            ))
          ) : (
            <NotificationListState label={tab === "unread" ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."} />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-full max-w-[780px] flex-col px-4 py-6">
      <div className="overflow-hidden rounded-2xl border border-[#d7e2ef] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#eef2f7] px-5 py-5">
          <div>
            <h1 className="text-2xl font-black leading-8 text-slate-950">Thông báo</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{unreadTotal} thông báo chưa đọc</p>
            <div className="mt-3 flex items-center gap-2">
              <NotificationPill active={tab === "all"} label="Tất cả" onClick={() => setTab("all")} />
              <NotificationPill active={tab === "unread"} label="Chưa đọc" onClick={() => setTab("unread")} />
            </div>
          </div>
          <button type="button" aria-label="Cài đặt thông báo" className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-[#f3f4f6] hover:text-slate-950">
            <Settings className="size-5" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          {notificationsQuery.isLoading ? (
            <NotificationListState label="Đang tải thông báo..." />
          ) : notificationsQuery.isError ? (
            <NotificationListState label="Không tải được thông báo." />
          ) : notifications.length ? (
            <>
              <NotificationSection title="Mới" notifications={newNotifications} onOpenDetail={openNotification} />
              <NotificationSection title="Trước đó" notifications={previousNotifications} onOpenDetail={openNotification} />
            </>
          ) : (
            <NotificationListState label={tab === "unread" ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."} />
          )}
        </div>
      </div>
    </section>
  );
}

export function LmsNotificationDetailPage({
  notificationId,
  onBack,
}: {
  notificationId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const autoMarkedRef = useRef<string | null>(null);
  const notificationQuery = useQuery({
    queryKey: notificationQueryKeys.detail(LMS_NOTIFICATION_PORTAL, notificationId),
    queryFn: () => fetchNotificationDetail(notificationId, LMS_NOTIFICATION_PORTAL),
    enabled: Boolean(notificationId),
    staleTime: 30_000,
  });
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, LMS_NOTIFICATION_PORTAL),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(LMS_NOTIFICATION_PORTAL) });
    },
  });
  const notification = notificationQuery.data;

  useEffect(() => {
    if (!notification?.unread || autoMarkedRef.current === notification.id) return;
    autoMarkedRef.current = notification.id;
    markReadMutation.mutate(notification.id);
  }, [notification?.id, notification?.unread]);

  if (notificationQuery.isLoading) {
    return (
      <section className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
          Đang tải thông báo...
        </div>
      </section>
    );
  }

  if (!notification || notificationQuery.isError) {
    return <NotificationNotFound onBack={onBack} />;
  }

  if (isMobile) {
    return (
      <section className="min-h-full bg-[#f3f6fb] px-3 pb-4 pt-3 text-slate-950">
        <button type="button" className="mb-3 flex h-11 items-center gap-2 rounded-[16px] bg-white px-3 text-sm font-extrabold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <article className="rounded-[24px] border border-[#d9e2ef] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2">
            <NotificationDetailIcon notification={notification} />
            <Badge variant="secondary" className={cn("rounded-full px-3 py-1 text-xs font-black", notificationBadgeClass(notification.type))}>
              {notificationLabel(notification.type)}
            </Badge>
            {notification.unread ? <span className="rounded-full bg-[var(--erg-blue-light)] px-3 py-1 text-xs font-black text-[var(--erg-blue)]">Chưa đọc</span> : null}
          </div>
          <h1 className="mt-5 text-2xl font-black leading-tight text-slate-950">{notification.title}</h1>
          <p className="mt-4 text-[15px] font-semibold leading-7 text-slate-700">{notification.body || notification.description}</p>
          <div className="mt-5 grid gap-3">
            <MetaItem icon={CalendarClock} label="Thời gian" value={notification.timeLabel} />
            <MetaItem icon={ServerCog} label="Loại thông báo" value={notificationLabel(notification.type)} />
            <MetaItem icon={Hash} label="Mã thông báo" value={notification.id} />
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 px-5 py-5 xl:px-8">
      <Button variant="ghost" className="w-fit rounded-md px-2 text-slate-600" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" />
        Danh sách thông báo
      </Button>

      <article className="overflow-hidden rounded-xl border border-[#cbd7e6] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-wrap items-center gap-2">
              <NotificationDetailIcon notification={notification} />
              <Badge variant="secondary" className={cn("rounded-md px-2.5 py-1 text-xs font-black", notificationBadgeClass(notification.type))}>
                {notificationLabel(notification.type)}
              </Badge>
              {notification.unread ? <Badge variant="secondary" className="rounded-md bg-[#eef7f0] text-emerald-700">Chưa đọc</Badge> : null}
            </div>

            <h1 className="mt-5 max-w-3xl text-2xl font-black leading-tight tracking-normal text-slate-950">{notification.title}</h1>
            <p className="mt-4 max-w-3xl text-[15px] font-semibold leading-7 text-slate-700">{notification.description}</p>

            <div className="mt-6 rounded-xl border border-[#d7e2ef] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                <Bell data-icon="inline-start" />
                Nội dung xử lý
              </div>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                {notification.body || "Thông báo này dùng để giáo viên nắm thay đổi mới nhất và mở đúng nghiệp vụ liên quan khi cần kiểm tra lại dữ liệu."}
              </p>
            </div>
          </div>

          <div className="border-t border-[#d7e2ef] bg-[#f8fbff] p-5 lg:border-l lg:border-t-0">
            <h2 className="text-sm font-black uppercase text-slate-400">Thông tin</h2>
            <dl className="mt-4 grid gap-3">
              <MetaItem icon={CalendarClock} label="Thời gian" value={notification.timeLabel} />
              <MetaItem icon={ServerCog} label="Loại thông báo" value={notificationLabel(notification.type)} />
              <MetaItem icon={Hash} label="Mã thông báo" value={notification.id} />
            </dl>
          </div>
        </div>
      </article>
    </section>
  );
}

function NotificationNotFound({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-12">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Badge variant="secondary" className="rounded-full bg-rose-50 text-rose-700">
          Không tìm thấy
        </Badge>
        <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">Thông báo không tồn tại</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Thông báo này có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.</p>
        <Button className="mt-6" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Quay lại danh sách
        </Button>
      </div>
    </section>
  );
}

function NotificationListTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "h-10 rounded-[13px] text-sm font-extrabold transition",
        active ? "bg-white text-[var(--erg-blue)] shadow-[0_4px_12px_rgba(15,23,42,0.08)]" : "text-slate-600",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NotificationPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
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

function NotificationListState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-[#e5ebf3] bg-white px-4 py-8 text-center text-sm font-semibold leading-6 text-slate-500">
      {label}
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: typeof CalendarClock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#d7e2ef] bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
        <Icon data-icon="inline-start" />
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

function NotificationSection({
  notifications,
  onOpenDetail,
  title,
}: {
  notifications: NotificationFeedItem[];
  onOpenDetail: (notification: NotificationFeedItem) => void;
  title: string;
}) {
  if (!notifications.length) return null;

  return (
    <section className="mt-5 first:mt-0">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
      </div>
      <div className="mt-3 grid gap-3">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => onOpenDetail(notification)}
            className="group grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-[#e5ebf3] bg-white px-3 py-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition hover:border-[#b8d6fa] hover:bg-[#f8fbff] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
          >
            <NotificationDetailIcon notification={notification} />
            <span className="min-w-0">
              <span className="block text-[15px] font-medium leading-6 text-slate-900">
                <span className="font-bold">{notificationLabel(notification.type)}</span> · {notification.title}
              </span>
              <span className="mt-1 block max-w-[470px] text-sm leading-6 text-slate-600">{notification.description}</span>
              <span className="mt-1 block text-xs font-bold text-slate-500">{notification.timeLabel}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className={cn("hidden h-14 w-24 rounded-lg md:block", notificationThumbnailClass(notification.type))} />
              {notification.unread ? <span className="size-3 rounded-full bg-[var(--erg-blue)]" /> : null}
              <MoreVertical className="size-4 text-slate-500 opacity-0 transition group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function NotificationDetailIcon({ notification }: { notification: NotificationFeedItem | NotificationDetailItem }) {
  const Icon = notification.type === "company" ? Building2 : notification.type === "system" ? ServerCog : Megaphone;

  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full text-white",
        notificationIconClass(notification.type),
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

function notificationLabel(type: LmsNotificationType) {
  if (type === "company") return "Công ty";
  if (type === "system") return "Hệ thống";
  return "Lớp học";
}

function notificationBadgeClass(type: LmsNotificationType) {
  if (type === "company") return "bg-slate-100 text-slate-700";
  if (type === "system") return "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]";
  return "bg-amber-50 text-amber-700";
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
