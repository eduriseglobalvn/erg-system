import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Badge, Button } from "@/components/ui/dashboard-kit";
import { listMyLoginSessions } from "@/platform/auth/api/account-api";

export function LoginLogsPage() {
  const navigate = useNavigate();
  const logsQuery = useQuery({
    queryKey: ["account", "login-sessions"],
    queryFn: listMyLoginSessions,
  });

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black">Lịch sử đăng nhập</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Chỉ xem, không thể xóa hoặc chỉnh sửa.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/account")}>Quản lý tài khoản</Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[160px_150px_160px_minmax(260px,1fr)_150px] bg-[#50a8e8] px-4 py-3 text-sm font-black text-white">
            <span>Thời gian</span>
            <span>Portal</span>
            <span>IP public</span>
            <span>Thiết bị / trình duyệt</span>
            <span>Trạng thái</span>
          </div>
          {logsQuery.data?.map((log) => (
            <article key={log.sessionId} className="grid grid-cols-[160px_150px_160px_minmax(260px,1fr)_150px] border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-600">{formatDate(log.createdAt)}</span>
              <span className="font-bold uppercase text-slate-700">{log.portal ?? "lms"}</span>
              <span>{log.ipAddress ?? "-"}</span>
              <span className="truncate" title={log.userAgent}>{log.deviceName || log.userAgent || "-"}</span>
              <Badge tone={log.revoked ? "secondary" : "success"}>{log.revoked ? "Đã đăng xuất" : log.current ? "Hiện tại" : "Đang hoạt động"}</Badge>
            </article>
          ))}
          {!logsQuery.data?.length ? (
            <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
              {logsQuery.isLoading ? "Đang tải lịch sử đăng nhập..." : "Chưa có log đăng nhập."}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
