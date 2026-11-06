import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  appleDesign,
  AppleStatusBadge,
  DeviceIcon,
  parseDeviceString,
} from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeSessions } from "@/features/employee-management/components/employee-detail/types";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeSessionsTab({
  onRevoke,
  sessions,
}: {
  onRevoke: (sessionId: string) => void;
  sessions: EmployeeSessions;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {sessions.length ? (
        sessions.map((session) => {
          const parsed = parseDeviceString(
            session.deviceName || session.deviceId,
            session.deviceType
          );
          const isRevoked = Boolean(session.revoked);

          return (
            <Box
              key={session.sessionId}
              sx={{
                bgcolor: isRevoked ? "rgba(0, 0, 0, 0.02)" : "#FFFFFF",
                border: `1px solid ${
                  isRevoked ? "rgba(0, 0, 0, 0.04)" : appleDesign.colors.border
                }`,
                borderRadius: "14px",
                boxShadow: isRevoked ? "none" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                opacity: isRevoked ? 0.6 : 1,
                p: 2,
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: isRevoked ? "inherit" : appleDesign.colors.borderMedium,
                  boxShadow: isRevoked ? "none" : "0 4px 14px rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderRadius: `${ergEnterpriseTokens.radius.md}px`,
                    display: "flex",
                    height: 38,
                    justifyContent: "center",
                    width: 38,
                  }}
                >
                  <DeviceIcon size="small" type={parsed.icon} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: appleDesign.colors.textPrimary,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {parsed.title || "Thiết bị không xác định"}
                  </Typography>
                  <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.35 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: "rgba(0, 0, 0, 0.04)",
                        borderRadius: "4px",
                        color: appleDesign.colors.textSecondary,
                        fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        px: 0.65,
                        py: 0.15,
                      }}
                    >
                      {session.ipAddress}
                    </Typography>
                    <Typography variant="caption" sx={{ color: appleDesign.colors.textTertiary }}>
                      ·
                    </Typography>
                    <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary, fontWeight: 550 }}>
                      {session.portal}
                    </Typography>
                  </Box>
                </Box>

                {!isRevoked ? (
                  <Button variant="contained"
                    size="small"
                    onClick={() => onRevoke(session.sessionId)}
                    sx={{
                      bgcolor: alpha(ergEnterpriseTokens.color.danger, 0.08),
                      border: `1px solid ${alpha(ergEnterpriseTokens.color.danger, 0.16)}`,
                      borderRadius: "9999px",
                      color: appleDesign.colors.redText,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      px: 1.5,
                      py: 0.45,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: alpha(ergEnterpriseTokens.color.danger, 0.16),
                        borderColor: alpha(ergEnterpriseTokens.color.danger, 0.3),
                      },
                    }}
                  >
                    Thu hồi phiên
                  </Button>
                ) : (
                  <AppleStatusBadge label="Đã thu hồi" tone="neutral" />
                )}
              </Box>
            </Box>
          );
        })
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
          Không có session.
        </Typography>
      )}
    </Box>
  );
}
