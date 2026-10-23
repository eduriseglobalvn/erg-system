import Button from "@mui/material/Button";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";

import { ErgDataTableShell, ErgEmptyState, ErgLoadingSkeleton, ErgTable, ErgTableToolbar } from "@/components/erg-mui";
import type { EnterpriseConnector } from "@/features/integrations/api/enterprise-connectors-api";
import { EnterpriseConnectorStatusChip } from "@/features/integrations/components/enterprise-connector-status-chip";

type ConnectorTableProps = {
  connectors: EnterpriseConnector[];
  isLoading: boolean;
  isError: boolean;
  canSync: boolean;
  onDryRun: (connector: EnterpriseConnector) => void;
  onSync: (connector: EnterpriseConnector) => void;
  onDeprovision: (connector: EnterpriseConnector) => void;
  onRetry: () => void;
};

export function EnterpriseConnectorTable({ connectors, isLoading, isError, canSync, onDryRun, onSync, onDeprovision, onRetry }: ConnectorTableProps) {
  return (
    <ErgDataTableShell toolbar={<ErgTableToolbar title="Enterprise connectors" meta={`${connectors.length} connector trong tenant hiện tại`} />}>
      {isLoading ? <ErgLoadingSkeleton rows={5} /> : isError ? (
        <ErgEmptyState title="Không tải được connectors" description="Kiểm tra enterprise.connectors.read hoặc thử lại." action={<Button onClick={onRetry}>Thử lại</Button>} />
      ) : connectors.length === 0 ? (
        <ErgEmptyState title="Chưa có connector" description="Đăng ký SIS, HRIS hoặc SCIM bằng secret reference do secret manager cấp." />
      ) : (
        <ErgTable aria-label="Enterprise connectors">
          <TableHead>
            <TableRow>
              <TableCell>Connector</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Mapping</TableCell>
              <TableCell>Bí mật</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {connectors.map((connector) => (
              <TableRow hover key={connector.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 800 }} variant="body2">{connector.displayName}</Typography>
                  <Typography color="text.secondary" variant="caption">{connector.providerKey} · v{connector.recordVersion}</Typography>
                  {connector.endpoint ? <Typography color="text.secondary" variant="caption">{connector.endpoint}</Typography> : null}
                </TableCell>
                <TableCell>{connector.providerKind}<br /><Typography color="text.secondary" variant="caption">{connector.adapterKey}</Typography></TableCell>
                <TableCell><Typography variant="body2">{connector.mappingVersion}</Typography><Typography color="text.secondary" variant="caption">{connector.mappingHash.slice(0, 12)}…</Typography></TableCell>
                <TableCell>{connector.secretConfigured ? "Đã cấu hình" : "Thiếu"}</TableCell>
                <TableCell><EnterpriseConnectorStatusChip status={connector.status} /></TableCell>
                <TableCell align="right">
                  {canSync && connector.status === "ACTIVE" ? <Button size="small" startIcon={<PlayCircleOutlineRoundedIcon />} onClick={() => onDryRun(connector)}>Dry-run</Button> : null}
                  {canSync && connector.status === "ACTIVE" ? <Button size="small" startIcon={<SyncRoundedIcon />} onClick={() => onSync(connector)}>Sync</Button> : null}
                  {canSync && connector.status === "ACTIVE" ? <Button color="warning" size="small" startIcon={<PersonOffRoundedIcon />} onClick={() => onDeprovision(connector)}>Deprovision</Button> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ErgTable>
      )}
    </ErgDataTableShell>
  );
}
