import { ArrowLeft, Building2, Megaphone, ServerCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lmsNotifications, type LmsNotification } from "@/features/lms/components/lms-notification-center";
import { cn } from "@/lib/utils";

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
          <h1 className="mt-4 text-xl font-semibold text-[#242424]">Thông báo không tồn tại</h1>
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
    <section className="mx-auto flex min-h-full max-w-4xl flex-col gap-5 px-6 py-8 xl:px-8">
      <Button variant="ghost" className="w-fit rounded-full text-slate-600" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" />
        Quay lại
      </Button>

      <article className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <div className="flex flex-wrap items-start gap-4 border-b border-[#edf1f5] bg-[#f6f8fb] px-5 py-5">
          <NotificationDetailIcon notification={notification} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-md bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
                {notificationLabel(notification.type)}
              </Badge>
              <span className="text-xs font-semibold text-slate-400">{notification.timeLabel}</span>
            </div>
            <h1 className="mt-3 text-xl font-semibold leading-tight text-[#242424]">{notification.title}</h1>
          </div>
        </div>

        <div className="px-5 py-6">
          <p className="max-w-3xl text-sm leading-6 text-[#424242]">{notification.description}</p>
          <div className="mt-8 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-4 py-3 text-sm font-semibold text-slate-600">
            Mã thông báo: <span className="font-semibold text-slate-900">{notification.id}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

function NotificationDetailIcon({ notification }: { notification: LmsNotification }) {
  const Icon = notification.type === "company" ? Building2 : notification.type === "system" ? ServerCog : Megaphone;

  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-lg text-white",
        notification.type === "company" ? "bg-[var(--erg-blue)]" : notification.type === "system" ? "bg-[var(--erg-blue)]" : "bg-amber-500",
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
