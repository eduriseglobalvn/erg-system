import { formatDateTimeVi } from "@/lib/format-date";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { appleDesign, AppleStatusBadge } from "@/features/employee-management/components/apple-ui-tokens";
import { useEmployeeSecurityEvents } from "@/features/employee-management/hooks/use-employee-management";

const EVENT_TITLES: Record<string, string> = {
  CREDENTIAL_RESET: "Đặt lại thông tin xác thực",
  LOGIN_FAILED: "Đăng nhập thất bại",
  LOGIN_SUCCESS: "Đăng nhập thành công",
  PASSWORD_CHANGE: "Đổi mật khẩu",
  SESSION_CREATED: "Khởi tạo phiên làm việc",
  SESSION_REVOKED: "Thu hồi phiên làm việc",
  STATUS_CHANGED: "Thay đổi trạng thái tài khoản",
};

export function EmployeeSecurityTimeline({ tenantId, userId }: { tenantId: string; userId: string }) {
  const query = useEmployeeSecurityEvents(tenantId, userId, 1, 20);

  if (query.isPending) return <ErgLoadingSkeleton rows={5} />;
  if (query.isError) {
    return (
      <ErgErrorState
        title="Không tải được security log"
        description="Kiểm tra quyền users.manage và thử lại."
      />
    );
  }

  const events = query.data?.items ?? [];
  if (!events.length) {
    return (
      <ErgEmptyState
        title="Chưa có cảnh báo bảo mật"
        description="Các lần đăng nhập, thay phiên và truy cập bị từ chối sẽ xuất hiện tại đây."
      />
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {events.map((event) => {
        const isMobile = event.platform === "WEB_MOBILE";
        const isWarning =
          event.severity === "HIGH" ||
          event.severity === "CRITICAL" ||
          event.result === "WARNING" ||
          Boolean(event.riskCode);
        const isFailed = event.result === "FAILED";
        const isSuccess = event.result === "SUCCESS";

        let badgeTone: "warning" | "danger" | "success" | "info" = "info";
        if (isFailed) badgeTone = "danger";
        else if (isWarning) badgeTone = "warning";
        else if (isSuccess) badgeTone = "success";

        return (
          <Box
            key={event.id}
            sx={{
              bgcolor: isWarning
                ? "rgba(255, 149, 0, 0.03)"
                : isFailed
                  ? "rgba(255, 59, 48, 0.03)"
                  : "#FFFFFF",
              border: `1px solid ${
                isWarning
                  ? "rgba(255, 149, 0, 0.25)"
                  : isFailed
                    ? "rgba(255, 59, 48, 0.2)"
                    : appleDesign.colors.border
              }`,
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              display: "grid",
              gap: 1,
              p: 2,
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: isWarning
                    ? appleDesign.colors.amberSoft
                    : isFailed
                      ? appleDesign.colors.redSoft
                      : appleDesign.colors.blueSoft,
                  borderRadius: "10px",
                  color: isWarning
                    ? appleDesign.colors.amberText
                    : isFailed
                      ? appleDesign.colors.redText
                      : appleDesign.colors.blue,
                  display: "flex",
                  height: 36,
                  justifyContent: "center",
                  width: 36,
                }}
              >
                {isFailed ? (
                  <ErrorOutlineRoundedIcon fontSize="small" />
                ) : isWarning ? (
                  <WarningAmberRoundedIcon fontSize="small" />
                ) : (
                  <CheckCircleRoundedIcon fontSize="small" />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: appleDesign.colors.textPrimary,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {EVENT_TITLES[event.eventType] || event.riskCode || event.eventType}
                </Typography>
                <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mt: 0.35 }}>
                  <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.4 }}>
                    {isMobile ? (
                      <PhoneIphoneRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 14 }} />
                    ) : (
                      <ComputerRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 14 }} />
                    )}
                    <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary, fontWeight: 550 }}>
                      {event.platform || "UNKNOWN_PLATFORM"}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: appleDesign.colors.textTertiary }}>
                    ·
                  </Typography>
                  <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary }}>
                    {event.portal || "all portal"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: appleDesign.colors.textTertiary }}>
                    ·
                  </Typography>
                  <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.4 }}>
                    <AccessTimeRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 13 }} />
                    <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary }}>
                      {formatDateTimeVi(event.occurredAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <AppleStatusBadge
                label={event.result || event.severity}
                tone={badgeTone}
              />
            </Box>

            {event.reason ? (
              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.03)",
                  borderRadius: "8px",
                  color: appleDesign.colors.textSecondary,
                  fontSize: "0.825rem",
                  lineHeight: 1.45,
                  mt: 0.5,
                  p: 1.25,
                }}
              >
                <Typography variant="body2" sx={{ fontSize: "inherit" }}>
                  {event.reason}
                </Typography>
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
