import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { useEmployeeSecurityEvents } from "@/features/employee-management/hooks/use-employee-management";

export function EmployeeSecurityTimeline({ tenantId, userId }: { tenantId: string; userId: string }) {
  const query = useEmployeeSecurityEvents(tenantId, userId, 1, 20);
  if (query.isPending) return <ErgLoadingSkeleton rows={5} />;
  if (query.isError) return <ErgErrorState title="Không tải được security log" description="Kiểm tra quyền users.manage và thử lại." />;
  const events = query.data?.items ?? [];
  if (!events.length) return <ErgEmptyState title="Chưa có cảnh báo bảo mật" description="Các lần đăng nhập, thay phiên và truy cập bị từ chối sẽ xuất hiện tại đây." />;
  return <Box sx={{ display: "grid", gap: 1.25 }}>{events.map((event) => {
    const mobile = event.platform === "WEB_MOBILE";
    return <Box key={event.id} sx={{ border: "1px solid", borderColor: event.severity === "HIGH" ? "warning.main" : "divider", borderRadius: 2, display: "grid", gap: 0.75, p: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        {mobile ? <PhoneIphoneRoundedIcon color="action" fontSize="small" /> : <ComputerRoundedIcon color="action" fontSize="small" />}
        <Typography sx={{ flex: 1, fontWeight: 800 }} variant="body2">{event.riskCode || event.eventType}</Typography>
        <ErgStatusChip label={event.result || event.severity} tone={event.severity === "HIGH" ? "warning" : "info"} />
      </Box>
      <Typography color="text.secondary" variant="caption">{event.platform || "UNKNOWN_PLATFORM"} · {event.portal || "all portal"} · {new Date(event.occurredAt).toLocaleString("vi-VN")}</Typography>
      {event.reason ? <Typography variant="body2">{event.reason}</Typography> : null}
    </Box>;
  })}</Box>;
}
