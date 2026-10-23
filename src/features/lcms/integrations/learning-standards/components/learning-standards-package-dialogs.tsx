import { useMemo, useState } from "react";
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
  useCreateLearningStandardPackage,
  useValidateLearningStandardPackage,
  type LearningStandardsScope,
} from "@/features/lcms/integrations/learning-standards/api/learning-standards-query";
import type {
  CreateLearningStandardPackageInput,
  LearningStandardPackage,
} from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";

type PackageDialogProps = {
  open: boolean;
  scope: LearningStandardsScope;
  onClose: () => void;
  onComplete: (message: string) => void;
};

export function LearningStandardsPackageCreateDialog({ open, scope, onClose, onComplete }: PackageDialogProps) {
  const mutation = useCreateLearningStandardPackage(scope);
  const [form, setForm] = useState<CreateLearningStandardPackageInput>(emptyPackageForm());
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(form.title?.trim() && form.artifactKey?.trim() && form.artifactSha256?.trim() && form.manifestSha256?.trim() && form.launchPath?.trim()),
    [form],
  );

  function update<K extends keyof CreateLearningStandardPackageInput>(key: K, value: CreateLearningStandardPackageInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!canSubmit) {
      setError("Vui lòng điền đủ metadata và digest của gói.");
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({ input: form, idempotencyKey: createIdempotencyKey("learning-package:create") });
      setForm(emptyPackageForm());
      onComplete("Đã đăng ký gói learning standard. Hãy upload artifact rồi chạy kiểm tra.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng ký gói learning standard.");
    }
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Đăng ký gói SCORM</DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ gap: 2, pt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Tên gói" value={form.title ?? ""} onChange={(event) => update("title", event.target.value)} required />
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
            <TextField fullWidth label="Chuẩn" select value={form.standard ?? "SCORM_12"} onChange={(event) => update("standard", event.target.value as CreateLearningStandardPackageInput["standard"])}>
              <MenuItem value="SCORM_12">SCORM 1.2</MenuItem>
              <MenuItem value="SCORM_2004">SCORM 2004</MenuItem>
            </TextField>
            <TextField fullWidth label="Phiên bản" value={form.packageVersion ?? ""} onChange={(event) => update("packageVersion", event.target.value)} required />
          </Stack>
          <TextField label="Artifact key" helperText="Khóa object storage do backend cấp/cho phép; không nhập URL tùy ý." value={form.artifactKey ?? ""} onChange={(event) => update("artifactKey", event.target.value)} required />
          <TextField label="Launch path" helperText="Đường dẫn tương đối trong artifact, ví dụ index.html." value={form.launchPath ?? ""} onChange={(event) => update("launchPath", event.target.value)} required />
          <TextField label="Kích thước (bytes)" type="number" value={form.byteSize ?? ""} onChange={(event) => update("byteSize", Number(event.target.value))} required />
          <TextField label="Artifact SHA-256" value={form.artifactSha256 ?? ""} onChange={(event) => update("artifactSha256", event.target.value)} required />
          <TextField label="Manifest SHA-256" value={form.manifestSha256 ?? ""} onChange={(event) => update("manifestSha256", event.target.value)} required />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button disabled={!canSubmit || mutation.isPending} onClick={() => void submit()} variant="contained">{mutation.isPending ? "Đang đăng ký…" : "Đăng ký gói"}</Button>
      </DialogActions>
    </Dialog>
  );
}

type PackageValidationDialogProps = PackageDialogProps & { packageValue: LearningStandardPackage | null };

export function LearningStandardsPackageValidationDialog({ open, scope, packageValue, onClose, onComplete }: PackageValidationDialogProps) {
  const mutation = useValidateLearningStandardPackage(scope);
  const [manifestXml, setManifestXml] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!packageValue) return;
    if (!manifestXml.trim()) {
      setError("Manifest XML là bắt buộc để backend kiểm tra.");
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({
        packageId: packageValue.id,
        input: { expectedVersion: packageValue.recordVersion, manifestXml },
        idempotencyKey: createIdempotencyKey("learning-package:validate"),
      });
      setManifestXml("");
      onComplete("Backend đã nhận yêu cầu kiểm tra package; trạng thái mới đã được đồng bộ.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể kiểm tra package.");
    }
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Kiểm tra manifest — {packageValue?.title ?? ""}</DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ gap: 2, pt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="info">FE gửi expectedVersion {packageValue?.recordVersion ?? 0}; nếu package đã đổi, backend sẽ trả conflict để buộc tải lại.</Alert>
          <TextField fullWidth label="manifest.xml" multiline minRows={12} value={manifestXml} onChange={(event) => setManifestXml(event.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button disabled={!packageValue || !manifestXml.trim() || mutation.isPending} onClick={() => void submit()} variant="contained">{mutation.isPending ? "Đang kiểm tra…" : "Gửi kiểm tra"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function emptyPackageForm(): CreateLearningStandardPackageInput {
  return {
    title: "",
    standard: "SCORM_12",
    packageVersion: "1.0",
    artifactKey: "",
    artifactSha256: "",
    byteSize: 0,
    manifestSha256: "",
    launchPath: "index.html",
  };
}

function createIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}:${crypto.randomUUID()}`;
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}
