import Box from "@mui/material/Box";
import type { EnterpriseConnectorStatus, EnterpriseConnectorRunStatus } from "@/features/integrations/api/enterprise-connectors-api";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EnterpriseConnectorStatusChip({
  status,
}: {
  status: EnterpriseConnectorStatus | EnterpriseConnectorRunStatus;
}) {
  const normalized = status.toUpperCase();

  const isSuccess =
    normalized === "ACTIVE" || normalized === "SUCCEEDED" || normalized === "DEPROVISIONED";
  const isError = normalized === "FAILED";
  const isWarning = normalized === "RETRYABLE_FAILED";

  const config = isSuccess
    ? {
        bg: alpha(ergEnterpriseTokens.color.success, 0.12),
        border: alpha(ergEnterpriseTokens.color.success, 0.22),
        color: "#15803D",
        dot: ergEnterpriseTokens.color.success,
      }
    : isError
      ? {
          bg: alpha(ergEnterpriseTokens.color.danger, 0.1),
          border: alpha(ergEnterpriseTokens.color.danger, 0.22),
          color: "#DC2626",
          dot: ergEnterpriseTokens.color.danger,
        }
      : isWarning
        ? {
            bg: alpha(ergEnterpriseTokens.color.warning, 0.12),
            border: alpha(ergEnterpriseTokens.color.warning, 0.22),
            color: "#B45309",
            dot: ergEnterpriseTokens.color.warning,
          }
        : {
            bg: alpha(ergEnterpriseTokens.color.primary, 0.08),
            border: alpha(ergEnterpriseTokens.color.primary, 0.18),
            color: "primary.main",
            dot: ergEnterpriseTokens.color.primary,
          };

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "9999px",
        color: config.color,
        display: "inline-flex",
        fontSize: "0.72rem",
        fontWeight: 600,
        gap: 0.6,
        lineHeight: 1,
        px: 1,
        py: 0.4,
      }}
    >
      <Box sx={{ bgcolor: config.dot, borderRadius: "50%", height: 6, width: 6 }} />
      {normalized}
    </Box>
  );
}
