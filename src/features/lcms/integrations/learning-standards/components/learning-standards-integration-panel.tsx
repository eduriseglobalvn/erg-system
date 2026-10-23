import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  useCreateLtiRegistration,
  useIngestXapiStatement,
  type LearningStandardsScope,
} from "@/features/lcms/integrations/learning-standards/api/learning-standards-query";

export function LearningStandardsIntegrationPanel({ scope, canManage, onComplete }: { scope: LearningStandardsScope; canManage: boolean; onComplete: (message: string) => void }) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Alert severity="info">LTI registration chỉ trả metadata đã được backend lọc; FE không lưu private key, signed token hoặc actor ID vào cache, storage hay URL.</Alert>
      <Stack direction={{ xs: "column", lg: "row" }} sx={{ gap: 2 }}>
        <LtiRegistrationCard canManage={canManage} onComplete={onComplete} scope={scope} />
        <XapiStatementCard canManage={canManage} onComplete={onComplete} scope={scope} />
      </Stack>
    </Stack>
  );
}

function LtiRegistrationCard({ scope, canManage, onComplete }: { scope: LearningStandardsScope; canManage: boolean; onComplete: (message: string) => void }) {
  const mutation = useCreateLtiRegistration(scope);
  const [form, setForm] = useState({ issuer: "", clientId: "", deploymentId: "", publicKeyPem: "", allowedTargetHost: "" });
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!Object.values(form).every((value) => value.trim())) {
      setError("Issuer, client, deployment, public key và target host đều bắt buộc.");
      return;
    }
    setError(null);
    try {
      const value = await mutation.mutateAsync({ input: form, idempotencyKey: createIdempotencyKey("lti-registration:create") });
      setForm({ issuer: "", clientId: "", deploymentId: "", publicKeyPem: "", allowedTargetHost: "" });
      onComplete(`Đã tạo LTI registration ${value.id}. Backend chưa công bố endpoint list registration nên FE chỉ hiển thị kết quả tạo.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo LTI registration.");
    }
  }

  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Stack sx={{ gap: 1.5 }}>
          <BoxTitle title="LTI 1.3 registration" description="Khai báo issuer/client và host đích được allowlist ở backend." />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField disabled={!canManage} label="Issuer" value={form.issuer} onChange={(event) => setForm((current) => ({ ...current, issuer: event.target.value }))} />
          <TextField disabled={!canManage} label="Client ID" value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} />
          <TextField disabled={!canManage} label="Deployment ID" value={form.deploymentId} onChange={(event) => setForm((current) => ({ ...current, deploymentId: event.target.value }))} />
          <TextField disabled={!canManage} label="Allowed target host" helperText="Chỉ nhập hostname, không nhập URL/path." value={form.allowedTargetHost} onChange={(event) => setForm((current) => ({ ...current, allowedTargetHost: event.target.value }))} />
          <TextField disabled={!canManage} label="Public key PEM" multiline minRows={5} value={form.publicKeyPem} onChange={(event) => setForm((current) => ({ ...current, publicKeyPem: event.target.value }))} />
          <Button disabled={!canManage || mutation.isPending} onClick={() => void submit()} variant="contained">{mutation.isPending ? "Đang tạo…" : "Tạo registration"}</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function XapiStatementCard({ scope, canManage, onComplete }: { scope: LearningStandardsScope; canManage: boolean; onComplete: (message: string) => void }) {
  const mutation = useIngestXapiStatement(scope);
  const [form, setForm] = useState({ statementId: "", actorId: "", verb: "completed", objectId: "", payloadSha256: "", occurredAt: "" });
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!form.statementId.trim() || !form.actorId.trim() || !form.verb.trim() || !form.objectId.trim() || !form.payloadSha256.trim()) {
      setError("statementId, actor, verb, object và payload SHA-256 đều bắt buộc.");
      return;
    }
    setError(null);
    try {
      const value = await mutation.mutateAsync({ input: { ...form, occurredAt: form.occurredAt || undefined }, idempotencyKey: createIdempotencyKey("xapi:statement") });
      setForm({ statementId: "", actorId: "", verb: "completed", objectId: "", payloadSha256: "", occurredAt: "" });
      onComplete(`xAPI statement ${value.statementId} đã được backend tiếp nhận (${value.status}).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể ingest xAPI statement.");
    }
  }

  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Stack sx={{ gap: 1.5 }}>
          <BoxTitle title="xAPI statement" description="Chỉ gửi bounded metadata; actor được backend hash trước khi lưu." />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField disabled={!canManage} label="Statement ID" value={form.statementId} onChange={(event) => setForm((current) => ({ ...current, statementId: event.target.value }))} />
          <TextField disabled={!canManage} label="Actor ID" helperText="Chỉ nằm trong state của form và request hiện tại." value={form.actorId} onChange={(event) => setForm((current) => ({ ...current, actorId: event.target.value }))} />
          <TextField disabled={!canManage} label="Verb" value={form.verb} onChange={(event) => setForm((current) => ({ ...current, verb: event.target.value }))} />
          <TextField disabled={!canManage} label="Object ID" value={form.objectId} onChange={(event) => setForm((current) => ({ ...current, objectId: event.target.value }))} />
          <TextField disabled={!canManage} label="Payload SHA-256" value={form.payloadSha256} onChange={(event) => setForm((current) => ({ ...current, payloadSha256: event.target.value }))} />
          <TextField disabled={!canManage} label="Occurred at (ISO, tùy chọn)" value={form.occurredAt} onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))} />
          <Button disabled={!canManage || mutation.isPending} onClick={() => void submit()} variant="outlined">{mutation.isPending ? "Đang gửi…" : "Gửi statement"}</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BoxTitle({ title, description }: { title: string; description: string }) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography sx={{ fontWeight: 850 }} variant="h6">{title}</Typography>
      <Typography color="text.secondary" variant="body2">{description}</Typography>
    </Stack>
  );
}

function createIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}:${crypto.randomUUID()}`;
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}
