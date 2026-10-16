import Chip from "@mui/material/Chip";

import type { EnterpriseConnectorStatus, EnterpriseConnectorRunStatus } from "@/features/integrations/api/enterprise-connectors-api";

export function EnterpriseConnectorStatusChip({ status }: { status: EnterpriseConnectorStatus | EnterpriseConnectorRunStatus }) {
  const normalized = status.toUpperCase();
  const color = normalized === "ACTIVE" || normalized === "SUCCEEDED" || normalized === "DEPROVISIONED"
    ? "success"
    : normalized === "FAILED" ? "error" : normalized === "RETRYABLE_FAILED" ? "warning" : "info";
  return <Chip color={color} label={normalized} size="small" />;
}
