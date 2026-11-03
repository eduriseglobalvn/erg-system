import Box from "@mui/material/Box";
import type { EnterpriseConnectorStatus, EnterpriseConnectorRunStatus } from "@/features/integrations/api/enterprise-connectors-api";

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
        bg: "rgba(52, 199, 89, 0.12)",
        border: "rgba(52, 199, 89, 0.22)",
        color: "#15803D",
        dot: "#34C759",
      }
    : isError
      ? {
          bg: "rgba(255, 59, 48, 0.1)",
          border: "rgba(255, 59, 48, 0.22)",
          color: "#DC2626",
          dot: "#FF3B30",
        }
      : isWarning
        ? {
            bg: "rgba(255, 149, 0, 0.12)",
            border: "rgba(255, 149, 0, 0.22)",
            color: "#B45309",
            dot: "#FF9500",
          }
        : {
            bg: "rgba(0, 113, 227, 0.08)",
            border: "rgba(0, 113, 227, 0.18)",
            color: "#0071E3",
            dot: "#0071E3",
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
        fontWeight: 700,
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
