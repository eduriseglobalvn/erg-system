import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LogOut, MapPin, MonitorSmartphone, Search } from "lucide-react";

import { Button, Input } from "@/components/ui/dashboard-kit";
import { queryKeys } from "@/lib/query-keys";
import { listMyLoginSessions, type LoginSessionLog } from "@/platform/auth/api/account-api";
import { cn } from "@/lib/utils";

type LoginSessionRow = LoginSessionLog & {
  authMethod?: string;
  location?: string;
  riskLabel?: string;
};

const mockLoginSessions: LoginSessionRow[] = [
  {
    sessionId: "mock-current-chrome-hcm",
    portal: "lms",
    ipAddress: "113.161.84.21",
    deviceName: "Windows 11 - Chrome 125",
    deviceType: "Desktop",
    userAgent: "Chrome 125.0 / Windows 11 / Desktop",
    current: true,
    revoked: false,
    createdAt: "2026-06-05T07:02:00.000Z",
    lastSeenAt: "2026-06-05T07:30:00.000Z",
    expiresAt: "2026-06-12T07:02:00.000Z",
    location: "Ho Chi Minh City, VN",
    authMethod: "Mật khẩu + phiên LMS",
    riskLabel: "Tin cậy",
  },
  {
    sessionId: "mock-edge-school",
    portal: "lms",
    ipAddress: "14.241.33.90",
    deviceName: "Microsoft Edge - Phòng giáo viên",
    deviceType: "Desktop",
    userAgent: "Edge 125.0 / Windows 10 / Desktop",
    current: false,
    revoked: false,
    createdAt: "2026-06-04T02:15:00.000Z",
    lastSeenAt: "2026-06-04T09:48:00.000Z",
    expiresAt: "2026-06-11T02:15:00.000Z",
    location: "ERG Alpha Campus",
    authMethod: "SSO nội bộ",
    riskLabel: "Tin cậy",
  },
  {
    sessionId: "mock-mobile-safari",
    portal: "lms",
    ipAddress: "27.67.118.44",
    deviceName: "iPhone 15 - Safari",
    deviceType: "Mobile",
    userAgent: "Mobile Safari 18.1 / iOS",
    current: false,
    revoked: false,
    createdAt: "2026-06-03T23:40:00.000Z",
    lastSeenAt: "2026-06-04T00:05:00.000Z",
    expiresAt: "2026-06-10T23:40:00.000Z",
    location: "Thu Duc, VN",
    authMethod: "Mã OTP",
    riskLabel: "Bình thường",
  },
  {
    sessionId: "mock-revoked-firefox",
    portal: "lms",
    ipAddress: "171.244.12.8",
    deviceName: "Firefox - Máy cá nhân",
    deviceType: "Desktop",
    userAgent: "Firefox 126.0 / Windows 11",
    current: false,
    revoked: true,
    revokedReason: "Đăng xuất thủ công",
    createdAt: "2026-06-02T13:20:00.000Z",
    lastSeenAt: "2026-06-02T14:01:00.000Z",
    expiresAt: "2026-06-09T13:20:00.000Z",
    location: "Bien Hoa, VN",
    authMethod: "Mật khẩu",
    riskLabel: "Đã đóng",
  },
  {
    sessionId: "mock-lcms-switch",
    portal: "lcms",
    ipAddress: "103.90.226.15",
    deviceName: "Chrome - LCMS tab",
    deviceType: "Desktop",
    userAgent: "Chrome 124.0 / Windows 11",
    current: false,
    revoked: true,
    revokedReason: "Phiên được thay thế",
    createdAt: "2026-05-31T03:08:00.000Z",
    lastSeenAt: "2026-05-31T04:42:00.000Z",
    expiresAt: "2026-06-07T03:08:00.000Z",
    location: "Ho Chi Minh City, VN",
    authMethod: "SSO liên cổng",
    riskLabel: "Đã đóng",
  },
];

export function LmsLoginLogsPage({ onManageAccount }: { onManageAccount: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [revokedSessionIds, setRevokedSessionIds] = useState<Set<string>>(() => new Set());
  const logsQuery = useQuery({
    queryKey: queryKeys.account.loginSessions(),
    queryFn: listMyLoginSessions,
  });
  const logs: LoginSessionRow[] = (logsQuery.data?.length ? logsQuery.data : mockLoginSessions).map((log) =>
    revokedSessionIds.has(log.sessionId)
      ? {
          ...log,
          current: false,
          revoked: true,
          revokedReason: log.current ? "Đã đăng xuất phiên hiện tại" : "Đăng xuất từ xa",
        }
      : log,
  );
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) =>
      [log.portal, log.ipAddress, log.deviceName, log.userAgent, log.deviceType, log.revokedReason, log.location, log.authMethod, log.riskLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [logs, searchQuery]);

  return (
    <section className="flex min-h-full flex-col gap-2 bg-[#f8fbff] px-2 py-2 text-slate-950 xl:px-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#cbd7e6] bg-white px-2.5 py-2 shadow-sm">
        <div className="mr-auto min-w-[260px]">
          <h1 className="text-base font-semibold leading-5 text-slate-950">Lịch sử đăng nhập</h1>
          <p className="mt-1 text-[13px] font-semibold text-slate-600">
            Theo dõi phiên đăng nhập LMS, thiết bị, vị trí và mức độ tin cậy.
          </p>
        </div>
        <div className="relative min-w-[260px] flex-1 xl:max-w-[460px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--erg-blue)]" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo IP, thiết bị, vị trí, phương thức"
            className="h-10 rounded-lg border-[#d7e0ec] bg-white pl-9 text-[14px] font-semibold shadow-none focus:bg-white"
          />
        </div>
        <Button variant="outline" className="h-10 rounded-lg px-3 text-[14px]" onClick={onManageAccount}>
          <ArrowLeft data-icon="inline-start" />
          Quản lý tài khoản
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#cbd7e6] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd7e6] px-2.5 py-1.5">
          <h2 className="text-sm font-semibold text-slate-950">Bảng log đăng nhập</h2>
          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Đang hoạt động</span>
            <span className="rounded bg-[var(--erg-blue-light)] px-1.5 py-0.5 text-[var(--erg-blue)]">Phiên hiện tại</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Đã đăng xuất</span>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="erg-data-table min-w-[1650px] border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="bg-[#eef4fb] text-[13px] font-bold text-slate-700">
                <LoginLogHeaderCell className="sticky left-0 top-0 z-40 w-[54px]">STT</LoginLogHeaderCell>
                <LoginLogHeaderCell className="sticky left-[54px] top-0 z-40 w-[170px] text-left">Thời gian</LoginLogHeaderCell>
                <LoginLogHeaderCell className="sticky left-[224px] top-0 z-40 w-[92px]">Portal</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[150px]">IP public</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[300px] text-left">Thiết bị / trình duyệt</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[190px] text-left">Vị trí</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[160px]">Phương thức</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[140px]">Trạng thái</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[120px]">Rủi ro</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[170px]">Lần cuối</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[170px]">Hết hạn</LoginLogHeaderCell>
                <LoginLogHeaderCell className="top-0 w-[140px]">Thao tác</LoginLogHeaderCell>
              </tr>
            </thead>
            <tbody>
              {logsQuery.isLoading ? (
                <LoginLogEmptyRow label="Đang tải log đăng nhập..." />
              ) : filteredLogs.length ? (
                filteredLogs.map((log, index) => (
                  <LoginLogRow
                    key={log.sessionId || `${log.createdAt}-${index}`}
                    index={index}
                    log={log}
                    onRevoke={() => setRevokedSessionIds((current) => new Set(current).add(log.sessionId))}
                  />
                ))
              ) : (
                <LoginLogEmptyRow label="Không tìm thấy log phù hợp." />
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function LoginLogRow({ index, log, onRevoke }: { index: number; log: LoginSessionRow; onRevoke: () => void }) {
  const status = getSessionStatus(log);

  return (
    <tr className="group">
      <LoginLogStickyCell className="left-0 z-20 w-[54px] text-center text-slate-500">{index + 1}</LoginLogStickyCell>
      <LoginLogStickyCell className="left-[54px] z-20 w-[170px] font-semibold text-slate-700">
        {formatDate(log.createdAt)}
      </LoginLogStickyCell>
      <LoginLogStickyCell className="left-[224px] z-20 w-[92px] text-center">
        <span className="rounded-lg border border-[#b8d6fa] bg-[#ebf3fc] px-2.5 py-1 text-[13px] font-bold text-[#0f5ea8]">{log.portal ?? "lms"}</span>
      </LoginLogStickyCell>
      <LoginLogCell className="w-[150px] text-center font-semibold text-slate-700">{log.ipAddress || "-"}</LoginLogCell>
      <LoginLogCell className="w-[300px]">
        <div className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded bg-slate-100 text-slate-500">
            <MonitorSmartphone className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[var(--erg-blue)]" title={log.userAgent}>
              {log.deviceName || log.deviceType || "Thiết bị không xác định"}
            </span>
            <span className="mt-1 block truncate text-[13px] font-semibold text-slate-600" title={log.userAgent}>
              {log.userAgent || "-"}
            </span>
          </span>
        </div>
      </LoginLogCell>
      <LoginLogCell className="w-[190px]">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
          <MapPin className="size-4 text-slate-500" />
          {log.location || "Không xác định"}
        </span>
      </LoginLogCell>
      <LoginLogCell className="w-[160px] text-center font-semibold text-slate-600">{log.authMethod || "Mật khẩu"}</LoginLogCell>
      <LoginLogCell className="w-[140px] text-center">
        <SessionStatusPill status={status} />
      </LoginLogCell>
      <LoginLogCell className="w-[120px] text-center">
        <span className={cn("rounded-lg border px-2.5 py-1 text-[13px] font-bold", log.revoked ? "border-slate-200 bg-slate-100 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
          {log.riskLabel || "Bình thường"}
        </span>
      </LoginLogCell>
      <LoginLogCell className="w-[170px] text-center font-semibold text-slate-600">{formatDate(log.lastSeenAt)}</LoginLogCell>
      <LoginLogCell className="w-[170px] text-center font-semibold text-slate-600">{formatDate(log.expiresAt)}</LoginLogCell>
      <LoginLogCell className="w-[140px] text-center">
        {log.revoked ? (
          <span className="text-[13px] font-bold text-slate-600">Đã đóng</span>
        ) : (
          <button
            type="button"
            onClick={onRevoke}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[13px] font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="size-3" />
            Đăng xuất
          </button>
        )}
      </LoginLogCell>
    </tr>
  );
}

function LoginLogHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("sticky h-10 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-2 text-center align-middle", className)}>
      {children}
    </th>
  );
}

function LoginLogCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("h-11 border-b border-r border-[#dbe4f0] bg-white px-2 align-middle group-hover:bg-[#f8fbff]", className)}>
      {children}
    </td>
  );
}

function LoginLogStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("sticky h-11 border-b border-r border-[#dbe4f0] bg-white px-2 align-middle group-hover:bg-[#f8fbff]", className)}>
      {children}
    </td>
  );
}

function LoginLogEmptyRow({ label }: { label: string }) {
  return (
    <tr>
      <td className="h-28 border-b border-[#eef0f4] bg-white px-4 text-center text-sm font-semibold text-slate-500" colSpan={12}>
        {label}
      </td>
    </tr>
  );
}

function SessionStatusPill({ status }: { status: { label: string; tone: "success" | "secondary" | "outline" } }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-bold leading-none",
        status.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status.tone === "secondary" && "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
        status.tone === "outline" && "border-slate-200 bg-white text-slate-500",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status.tone === "success" && "bg-emerald-500",
          status.tone === "secondary" && "bg-[var(--erg-blue)]",
          status.tone === "outline" && "bg-slate-400",
        )}
      />
      {status.label}
    </span>
  );
}

function getSessionStatus(log: LoginSessionLog): { label: string; tone: "success" | "secondary" | "outline" } {
  if (log.revoked) return { label: "Đã đăng xuất", tone: "outline" };
  if (log.current) return { label: "Hiện tại", tone: "secondary" };
  return { label: "Hoạt động", tone: "success" };
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
