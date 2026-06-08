import { ArrowLeft, Bell, Building2, CalendarClock, Hash, Megaphone, MoreVertical, ServerCog, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lmsNotifications, type LmsNotification } from "@/features/lms/components/lms-notification-center";
import { cn } from "@/lib/utils";

export function LmsNotificationListPage({
  onOpenDetail,
}: {
  onOpenDetail: (notificationId: string) => void;
}) {
  const newNotifications = lmsNotifications.slice(0, 3);
  const previousNotifications = lmsNotifications.slice(3);
  const unreadTotal = lmsNotifications.filter((notification) => notification.unread).length;

  return (
    <section className="mx-auto flex min-h-full max-w-[780px] flex-col px-4 py-6">
      <div className="overflow-hidden rounded-2xl border border-[#d7e2ef] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#eef2f7] px-5 py-5">
          <div>
            <h1 className="text-2xl font-black leading-8 text-slate-950">Thông báo</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{unreadTotal} thông báo chưa đọc</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-[var(--erg-blue-light)] px-4 py-2 text-sm font-black text-[var(--erg-blue)]">Tất cả</span>
              <span className="rounded-full px-4 py-2 text-sm font-black text-slate-700">Chưa đọc</span>
            </div>
          </div>
          <button type="button" className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-[#f3f4f6] hover:text-slate-950">
            <Settings className="size-5" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <NotificationSection title="Mới" notifications={newNotifications} onOpenDetail={onOpenDetail} />
          <NotificationSection title="Trước đó" notifications={previousNotifications} onOpenDetail={onOpenDetail} />
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
  const notification = lmsNotifications.find((item) => item.id === notificationId);

  if (!notification) {
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
                Thông báo này dùng để giáo viên nắm thay đổi mới nhất và mở đúng nghiệp vụ liên quan khi cần kiểm tra lại dữ liệu.
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
  notifications: LmsNotification[];
  onOpenDetail: (notificationId: string) => void;
  title: string;
}) {
  if (!notifications.length) return null;

  return (
    <section className="mt-5 first:mt-0">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        <button type="button" className="text-sm font-semibold text-[var(--erg-blue)]">Xem tất cả</button>
      </div>
      <div className="mt-3 grid gap-3">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => onOpenDetail(notification.id)}
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

function NotificationDetailIcon({ notification }: { notification: LmsNotification }) {
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

function notificationLabel(type: LmsNotification["type"]) {
  if (type === "company") return "Công ty";
  if (type === "system") return "Hệ thống";
  return "Lớp học";
}

function notificationBadgeClass(type: LmsNotification["type"]) {
  if (type === "company") return "bg-slate-100 text-slate-700";
  if (type === "system") return "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]";
  return "bg-amber-50 text-amber-700";
}

function notificationIconClass(type: LmsNotification["type"]) {
  if (type === "company") return "bg-slate-700";
  if (type === "system") return "bg-[var(--erg-blue)]";
  return "bg-amber-500";
}

function notificationThumbnailClass(type: LmsNotification["type"]) {
  if (type === "company") return "bg-[linear-gradient(135deg,#0f172a,#64748b)]";
  if (type === "system") return "bg-[linear-gradient(135deg,#0068d9,#9cc9ff)]";
  return "bg-[linear-gradient(135deg,#f59e0b,#fde68a)]";
}
