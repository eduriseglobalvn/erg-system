import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";

import { ErgContentBand, ErgEmptyState, ErgPageSurface, ErgSectionHeader } from "@/components/erg-mui";
import {
  useDryRunEnterpriseConnector,
  useEnterpriseConnectors,
  useEnterpriseConnectorsScope,
  useRetryEnterpriseConnector,
  useSyncEnterpriseConnector,
} from "@/features/integrations/api/enterprise-connectors-query";
import type { EnterpriseConnector, EnterpriseConnectorSyncPreview, EnterpriseConnectorSyncRun } from "@/features/integrations/api/enterprise-connectors-api";
import { EnterpriseConnectorDeprovisionDialog, EnterpriseConnectorRegisterDialog } from "@/features/integrations/components/enterprise-connector-dialogs";
import { EnterpriseConnectorStatusChip } from "@/features/integrations/components/enterprise-connector-status-chip";
import { EnterpriseConnectorTable } from "@/features/integrations/components/enterprise-connector-table";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

export function EnterpriseConnectorsWorkspace() {
  const scope = useEnterpriseConnectorsScope();
  const { session } = useAuthSession("lcms");
  const grantedPermissions = session?.permissions ?? [];
  const deniedPermissions = session?.deniedPermissions ?? [];
  const canRead = evaluatePermission({ permission: "enterprise.connectors.read", grantedPermissions, deniedPermissions }) || evaluatePermission({ permission: "enterprise.connectors.manage", grantedPermissions, deniedPermissions });
  const canManage = evaluatePermission({ permission: "enterprise.connectors.manage", grantedPermissions, deniedPermissions });
  const canSync = evaluatePermission({ permission: "enterprise.connectors.sync", grantedPermissions, deniedPermissions }) || canManage;
  const connectorsQuery = useEnterpriseConnectors(scope, canRead);
  const dryRunMutation = useDryRunEnterpriseConnector(scope);
  const syncMutation = useSyncEnterpriseConnector(scope);
  const retryMutation = useRetryEnterpriseConnector(scope);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deprovisionConnector, setDeprovisionConnector] = useState<EnterpriseConnector | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastPreview, setLastPreview] = useState<EnterpriseConnectorSyncPreview | null>(null);
  const [lastRun, setLastRun] = useState<EnterpriseConnectorSyncRun | null>(null);

  if (!canRead) {
    return <ErgContentBand><ErgEmptyState icon={<HubRoundedIcon fontSize="large" />} title="Không có quyền Enterprise Connectors" description="Tài khoản cần enterprise.connectors.read hoặc enterprise.connectors.manage." /></ErgContentBand>;
  }

  async function dryRun(connector: EnterpriseConnector) {
    try {
      const result = await dryRunMutation.mutateAsync({ connectorId: connector.id, input: { expectedVersion: connector.recordVersion }, idempotencyKey: createIdempotencyKey("connector:dry-run") });
      setLastPreview(result);
      setNotice("Dry-run đã được backend xác nhận; không có dữ liệu nguồn nào được FE lưu.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Dry-run thất bại.");
    }
  }

  async function sync(connector: EnterpriseConnector) {
    try {
      const result = await syncMutation.mutateAsync({ connectorId: connector.id, input: { expectedVersion: connector.recordVersion }, idempotencyKey: createIdempotencyKey("connector:sync") });
      setLastRun(result);
      setNotice("Sync đã được backend xác nhận; hãy xem run result phía dưới.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Sync thất bại.");
    }
  }

  async function retry() {
    if (!lastRun) return;
    try {
      const result = await retryMutation.mutateAsync({ connectorId: lastRun.connectorId, runId: lastRun.runId, input: { expectedVersion: lastRun.recordVersion }, idempotencyKey: createIdempotencyKey("connector:retry") });
      setLastRun(result);
      setNotice("Retry đã được backend xác nhận.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Retry thất bại.");
    }
  }

  return (
    <ErgContentBand>
      <ErgSectionHeader
        eyebrow="Admin / Enterprise Integration"
        title="Enterprise Connectors"
        description="SIS, HRIS và SCIM theo tenant; secrets chỉ đi qua secret manager reference, không đi qua FE storage."
        action={canManage ? <Button startIcon={<AddRoundedIcon />} onClick={() => setRegisterOpen(true)} variant="contained">Đăng ký connector</Button> : null}
      />
      {notice ? <Alert onClose={() => setNotice(null)} severity="info" sx={{ mb: 2 }}>{notice}</Alert> : null}
      {lastPreview ? <PreviewCard preview={lastPreview} /> : null}
      {lastRun ? <RunCard canSync={canSync} isRetrying={retryMutation.isPending} onRetry={() => void retry()} run={lastRun} /> : null}
      <EnterpriseConnectorTable
        canSync={canSync}
        connectors={connectorsQuery.data ?? []}
        isError={connectorsQuery.isError}
        isLoading={connectorsQuery.isLoading}
        onDeprovision={setDeprovisionConnector}
        onDryRun={(connector) => void dryRun(connector)}
        onRetry={() => void connectorsQuery.refetch()}
        onSync={(connector) => void sync(connector)}
      />
      <EnterpriseConnectorRegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onComplete={setNotice} scope={scope} />
      <EnterpriseConnectorDeprovisionDialog connector={deprovisionConnector} open={Boolean(deprovisionConnector)} onClose={() => setDeprovisionConnector(null)} onComplete={setNotice} scope={scope} />
    </ErgContentBand>
  );
}

function PreviewCard({ preview }: { preview: EnterpriseConnectorSyncPreview }) {
  return <ErgPageSurface sx={{ mb: 2 }}><Typography sx={{ fontWeight: 850 }} variant="subtitle1">Dry-run {preview.runId}</Typography><Typography color="text.secondary" variant="body2">{preview.additions} additions · {preview.updates} updates · {preview.removals} removals · {preview.total} total</Typography></ErgPageSurface>;
}

function RunCard({ canSync, isRetrying, onRetry, run }: { canSync: boolean; isRetrying: boolean; onRetry: () => void; run: EnterpriseConnectorSyncRun }) {
  const retryable = run.status === "FAILED" || run.status === "RETRYABLE_FAILED";
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <BoxCopy run={run} />
          {canSync && retryable ? <Button disabled={isRetrying} onClick={onRetry} startIcon={<ReplayRoundedIcon />} variant="outlined">{isRetrying ? "Đang retry…" : "Retry run"}</Button> : null}
        </Box>
      </CardContent>
    </Card>
  );
}

function BoxCopy({ run }: { run: EnterpriseConnectorSyncRun }) {
  return <Box sx={{ display: "grid", gap: 0.5 }}><Typography sx={{ fontWeight: 800 }} variant="subtitle2">Run {run.runId}</Typography><Box sx={{ alignItems: "center", display: "flex", gap: 1 }}><EnterpriseConnectorStatusChip status={run.status} /><Typography color="text.secondary" variant="body2">{run.processed} processed · {run.failed} failed · retry {run.retryCount}</Typography></Box>{run.errorCode ? <Typography color="error.main" variant="caption">Error: {run.errorCode}</Typography> : null}</Box>;
}

function createIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return prefix + ":" + crypto.randomUUID();
  return prefix + ":" + Date.now().toString(36) + ":" + Math.random().toString(36).slice(2, 10);
}

export default EnterpriseConnectorsWorkspace;
