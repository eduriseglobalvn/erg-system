import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import {
  useDeprovisionEnterpriseConnector,
  useRegisterEnterpriseConnector,
  type EnterpriseConnectorsScope,
} from "@/features/integrations/api/enterprise-connectors-query";
import type { EnterpriseConnector, RegisterEnterpriseConnectorInput } from "@/features/integrations/api/enterprise-connectors-api";

type DialogBaseProps = {
  scope: EnterpriseConnectorsScope;
  open: boolean;
  onClose: () => void;
  onComplete: (message: string) => void;
};

export function EnterpriseConnectorRegisterDialog({ scope, open, onClose, onComplete }: DialogBaseProps) {
  const mutation = useRegisterEnterpriseConnector(scope);
  const [form, setForm] = useState<RegisterEnterpriseConnectorInput>(emptyRegisterForm());
  const [mappingText, setMappingText] = useState("externalId=externalId\nemail=email");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const fieldMapping = parseMapping(mappingText);
    if (!form.displayName?.trim() || !form.adapterKey?.trim() || !form.providerKey?.trim() || !form.secretRef?.trim() || !form.mappingVersion?.trim() || Object.keys(fieldMapping).length === 0) {
      setError("Cần điền display name, adapter/provider key, secret:// reference, mapping version và ít nhất một mapping.");
      return;
    }
    setError(null);
    try {
      const value = await mutation.mutateAsync({ input: { ...form, fieldMapping }, idempotencyKey: createIdempotencyKey("connector:register") });
      setForm(emptyRegisterForm());
      setMappingText("externalId=externalId\nemail=email");
      onComplete("Đã đăng ký connector " + value.displayName + "; server xác nhận secret reference, FE không giữ secret.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng ký connector.");
    }
  }

  function update<K extends keyof RegisterEnterpriseConnectorInput>(key: K, value: RegisterEnterpriseConnectorInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Đăng ký enterprise connector</DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ gap: 2, pt: 0.5 }}>
          <Alert severity="info">secretRef phải là tham chiếu server-side dạng secret://...; không dán credential thật vào trình duyệt.</Alert>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Tên hiển thị" value={form.displayName ?? ""} onChange={(event) => update("displayName", event.target.value)} required />
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
            <TextField fullWidth label="Provider kind" select value={form.providerKind ?? "SIS"} onChange={(event) => update("providerKind", event.target.value as RegisterEnterpriseConnectorInput["providerKind"])}>
              <MenuItem value="SIS">SIS</MenuItem>
              <MenuItem value="HRIS">HRIS</MenuItem>
              <MenuItem value="SCIM">SCIM</MenuItem>
            </TextField>
            <TextField fullWidth label="Adapter key" value={form.adapterKey ?? ""} onChange={(event) => update("adapterKey", event.target.value)} required />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
            <TextField fullWidth label="Provider key" value={form.providerKey ?? ""} onChange={(event) => update("providerKey", event.target.value)} required />
            <TextField fullWidth label="Mapping version" value={form.mappingVersion ?? ""} onChange={(event) => update("mappingVersion", event.target.value)} required />
          </Stack>
          <TextField label="Secret reference" placeholder="secret://vault/erg-sis" value={form.secretRef ?? ""} onChange={(event) => update("secretRef", event.target.value)} required />
          <TextField label="Endpoint (optional)" helperText="Không đặt credential/query token trong URL." value={form.endpoint ?? ""} onChange={(event) => update("endpoint", event.target.value)} />
          <TextField label="Field mapping" helperText="Mỗi dòng source=target; tối đa 32 dòng." multiline minRows={5} value={mappingText} onChange={(event) => setMappingText(event.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button disabled={mutation.isPending} onClick={() => void submit()} variant="contained">{mutation.isPending ? "Đang đăng ký…" : "Đăng ký"}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function EnterpriseConnectorDeprovisionDialog({ scope, open, connector, onClose, onComplete }: DialogBaseProps & { connector: EnterpriseConnector | null }) {
  const mutation = useDeprovisionEnterpriseConnector(scope);
  const [externalIds, setExternalIds] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!connector) return;
    const ids = externalIds.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
    if (!ids.length || !reason.trim()) {
      setError("Cần ít nhất một external ID và lý do deprovision.");
      return;
    }
    setError(null);
    try {
      const value = await mutation.mutateAsync({ connectorId: connector.id, input: { expectedVersion: connector.recordVersion, externalIds: ids, reason }, idempotencyKey: createIdempotencyKey("connector:deprovision") });
      setExternalIds("");
      setReason("");
      onComplete("Đã deprovision " + value.deprovisioned + "/" + value.requested + " đối tượng; trạng thái " + value.status + ".");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể deprovision.");
    }
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Deprovision — {connector?.displayName ?? ""}</DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ gap: 2, pt: 0.5 }}>
          <Alert severity="warning">Thao tác này gửi danh sách external IDs lên provider theo connector hiện tại và yêu cầu expectedVersion {connector?.recordVersion ?? 0}.</Alert>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="External IDs" helperText="Mỗi dòng hoặc dấu phẩy một ID; backend giới hạn 100." multiline minRows={5} value={externalIds} onChange={(event) => setExternalIds(event.target.value)} />
          <TextField label="Lý do" value={reason} onChange={(event) => setReason(event.target.value)} required />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button color="warning" disabled={!connector || mutation.isPending} onClick={() => void submit()} variant="contained">{mutation.isPending ? "Đang xử lý…" : "Deprovision"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function parseMapping(value: string) {
  const mapping: Record<string, string> = {};
  for (const line of value.split("\n")) {
    const [key, ...rest] = line.split("=");
    const source = key?.trim();
    const target = rest.join("=").trim();
    if (source && target) mapping[source] = target;
  }
  return mapping;
}

function emptyRegisterForm(): RegisterEnterpriseConnectorInput {
  return {
    providerKind: "SIS",
    adapterKey: "",
    providerKey: "",
    displayName: "",
    secretRef: "",
    endpoint: "",
    mappingVersion: "1",
    fieldMapping: {},
  };
}

function createIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return prefix + ":" + crypto.randomUUID();
  return prefix + ":" + Date.now().toString(36) + ":" + Math.random().toString(36).slice(2, 10);
}
