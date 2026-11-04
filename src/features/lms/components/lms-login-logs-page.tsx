import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { describeIpAddress, describeUserAgent } from "@/features/lms/components/lms-user-agent";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTimeVi } from "@/lib/format-date";
import { listMyLoginSessions, type LoginSessionLog } from "@/platform/auth/api/account-api";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";

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
    deviceName: "Chrome - Admin LMS tab",
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

export function resolveLoginSessionRows(data: LoginSessionLog[] | undefined, apiBacked = hasApiBase()): LoginSessionRow[] {
  if (apiBacked) return data ?? [];
  return data?.length ? data : mockLoginSessions;
}

export function LmsLoginLogsPage({ onManageAccount }: { onManageAccount: () => void }) {
  const { account } = useAuthSession("lms");
  const tenantId = getDefaultTenantId();
  const [searchQuery, setSearchQuery] = useState("");
  const [revokedSessionIds, setRevokedSessionIds] = useState<Set<string>>(() => new Set());
  const logsQuery = useQuery({
    queryKey: queryKeys.account.loginSessions(tenantId, account?.id),
    queryFn: ({ signal }) => listMyLoginSessions(signal),
  });
  const logs: LoginSessionRow[] = resolveLoginSessionRows(logsQuery.data).map((log) =>
    revokedSessionIds.has(log.sessionId)
      ? { ...log, current: false, revoked: true, revokedReason: log.current ? "Đã đăng xuất phiên hiện tại" : "Đăng xuất từ xa" }
      : log,
  );
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [describeUserAgent(log.userAgent), describeIpAddress(log.ipAddress), log.deviceName, log.deviceType, log.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [logs, searchQuery]);
  const revoke = (sessionId: string) => setRevokedSessionIds((current) => new Set(current).add(sessionId));

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3 } }}>
      <ErgPageHeader
        description="Các lần đăng nhập gần đây vào tài khoản của bạn."
        primaryAction={
          <ErgButton leadingIcon={<ArrowBackIcon />} onClick={onManageAccount} variant="contained">
            Quản lý tài khoản
          </ErgButton>
        }
        title="Lịch sử đăng nhập"
      />
      <Box sx={{ maxWidth: 460, mb: 2 }}>
        <ErgSearchField
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Tìm theo thiết bị hoặc địa chỉ IP"
          slotProps={{ htmlInput: { "aria-label": "Tìm phiên đăng nhập" } }}
          value={searchQuery}
        />
      </Box>
      {logsQuery.isLoading ? (
        <Typography color="text.secondary" variant="body2">Đang tải...</Typography>
      ) : filteredLogs.length === 0 ? (
        <ErgEmptyState title="Không có phiên đăng nhập phù hợp" />
      ) : (
        <>
          <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1.5 }}>
            {filteredLogs.map((log, index) => (
              <Box component="article" key={log.sessionId || index} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
                  <Typography variant="subtitle2">{describeUserAgent(log.userAgent)}</Typography>
                  <SessionChip log={log} />
                </Box>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                  {describeIpAddress(log.ipAddress)} · {formatDateTimeVi(log.createdAt) || "—"}
                </Typography>
                {log.revoked ? null : (
                  <ErgButton color="error" fullWidth onClick={() => revoke(log.sessionId)} sx={{ minHeight: 44, mt: 1.5 }} variant="outlined">
                    Đăng xuất thiết bị
                  </ErgButton>
                )}
              </Box>
            ))}
          </Box>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, display: { xs: "none", md: "block" }, overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Thiết bị</TableCell>
                  <TableCell>Địa chỉ IP</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Hoạt động cuối</TableCell>
                  <TableCell>Hết hạn</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow key={log.sessionId || index}>
                    <TableCell>{formatDateTimeVi(log.createdAt) || "—"}</TableCell>
                    <TableCell title={log.userAgent}>{describeUserAgent(log.userAgent)}</TableCell>
                    <TableCell>{describeIpAddress(log.ipAddress)}</TableCell>
                    <TableCell><SessionChip log={log} /></TableCell>
                    <TableCell>{formatDateTimeVi(log.lastSeenAt) || "—"}</TableCell>
                    <TableCell>{formatDateTimeVi(log.expiresAt) || "—"}</TableCell>
                    <TableCell align="right">
                      {log.revoked ? null : (
                        <ErgButton color="error" onClick={() => revoke(log.sessionId)} size="small" variant="outlined">
                          Đăng xuất
                        </ErgButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
}

function SessionChip({ log }: { log: LoginSessionLog }) {
  if (log.revoked) return <ErgStatusChip label="Đã đăng xuất" tone="neutral" />;
  if (log.current) return <ErgStatusChip label="Thiết bị này" tone="info" />;
  return <ErgStatusChip label="Đang hoạt động" tone="success" />;
}
