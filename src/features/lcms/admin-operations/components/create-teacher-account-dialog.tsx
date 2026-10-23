import { useEffect, useMemo, useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";

import { ErgSelect, ErgTextField } from "@/components/erg-mui";
import type { AccessManagementOptions } from "@/features/lcms/admin-operations/api/access-management-api";
import {
  createTeacherAccount,
  type CreateTeacherAccountInput,
  type CreateTeacherAccountResponse,
  type TeacherCredentialDelivery,
} from "@/features/lcms/admin-operations/api/teacher-account-api";

const steps = ["Thông tin tài khoản", "Nhóm quyền & phạm vi", "Xác nhận"];

type IdentityDraft = {
  fullName: string;
  primaryEmail: string;
  phone: string;
  recoveryEmail: string;
  credentialDelivery: TeacherCredentialDelivery;
};

type CreateTeacherAccountDialogProps = {
  open: boolean;
  options: AccessManagementOptions;
  onClose: () => void;
  onCreated: (response: CreateTeacherAccountResponse) => void;
  onProvision?: (input: CreateTeacherAccountInput) => Promise<CreateTeacherAccountResponse>;
};

const emptyIdentity: IdentityDraft = {
  fullName: "",
  primaryEmail: "",
  phone: "",
  recoveryEmail: "",
  credentialDelivery: "EMAIL_INVITE",
};

export function CreateTeacherAccountDialog({
  open,
  options,
  onClose,
  onCreated,
  onProvision = createTeacherAccount,
}: CreateTeacherAccountDialogProps) {
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<IdentityDraft>(emptyIdentity);
  const [selectedRoleGroupIds, setSelectedRoleGroupIds] = useState<string[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateTeacherAccountResponse | null>(null);

  useEffect(() => {
    if (open) return;
    setStep(0);
    setIdentity(emptyIdentity);
    setSelectedRoleGroupIds([]);
    setSelectedScopeId("");
    setSelectedModuleIds([]);
    setFieldErrors({});
    setError("");
    setSubmitting(false);
    setResult(null);
  }, [open]);

  const selectedScope = options.scopes.find((scope) => scope.scopeId === selectedScopeId);
  const compatibleRoleGroups = useMemo(
    () => options.roleGroups.filter((roleGroup) => !selectedScope || roleGroup.scopeTypes.includes(selectedScope.scopeType)),
    [options.roleGroups, selectedScope],
  );

  function updateIdentity<Key extends keyof IdentityDraft>(key: Key, value: IdentityDraft[Key]) {
    setIdentity((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
  }

  function continueToNextStep() {
    setError("");
    if (step === 0) {
      const errors = validateIdentity(identity);
      setFieldErrors(errors);
      if (Object.keys(errors).length) return;
    }
    if (step === 1) {
      const errors: Record<string, string> = {};
      if (!selectedRoleGroupIds.length) errors.roleGroupIds = "Chọn ít nhất một nhóm quyền.";
      if (!selectedScope || !selectedModuleIds.length) errors.policies = "Chọn phạm vi và module truy cập.";
      setFieldErrors(errors);
      if (Object.keys(errors).length) return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit() {
    if (!selectedScope) return;
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      const response = await onProvision({
        primaryEmail: identity.primaryEmail.trim().toLowerCase(),
        fullName: identity.fullName.trim(),
        phone: optionalValue(identity.phone),
        recoveryEmail: optionalValue(identity.recoveryEmail)?.toLowerCase(),
        roleGroupIds: selectedRoleGroupIds,
        policies: selectedRoleGroupIds.map((roleGroup) => ({
          scopeType: selectedScope.scopeType,
          scopeId: selectedScope.scopeId,
          scopeName: selectedScope.name,
          roleGroup,
          modules: selectedModuleIds,
        })),
        credentialDelivery: identity.credentialDelivery,
      });
      setResult(response);
      onCreated(response);
    } catch (caught) {
      const provisionError = caught instanceof Error ? caught : new Error("Không thể tạo tài khoản giáo viên.");
      const field = "field" in provisionError && typeof provisionError.field === "string" ? provisionError.field : undefined;
      if (field) setFieldErrors({ [field]: provisionError.message });
      setError(provisionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function closeDialog() {
    onClose();
  }

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={submitting ? undefined : closeDialog}>
      <DialogTitle sx={{ pb: 1 }}>Tạo tài khoản giáo viên</DialogTitle>
      <DialogContent dividers>
        {result ? (
          <SuccessResult result={result} />
        ) : (
          <Stack spacing={3}>
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {step === 0 ? (
              <Stack spacing={2}>
                <ErgTextField
                  autoFocus
                  error={Boolean(fieldErrors.fullName)}
                  helperText={fieldErrors.fullName}
                  label="Họ và tên"
                  value={identity.fullName}
                  onChange={(event) => updateIdentity("fullName", event.target.value)}
                />
                <ErgTextField
                  error={Boolean(fieldErrors.primaryEmail)}
                  helperText={fieldErrors.primaryEmail}
                  label="Email đăng nhập"
                  type="email"
                  value={identity.primaryEmail}
                  onChange={(event) => updateIdentity("primaryEmail", event.target.value)}
                />
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <ErgTextField
                    error={Boolean(fieldErrors.phone)}
                    helperText={fieldErrors.phone || "Có thể bổ sung trong onboarding."}
                    label="Số điện thoại"
                    value={identity.phone}
                    onChange={(event) => updateIdentity("phone", event.target.value)}
                  />
                  <ErgTextField
                    error={Boolean(fieldErrors.recoveryEmail)}
                    helperText={fieldErrors.recoveryEmail || "Phải khác email đăng nhập."}
                    label="Email khôi phục"
                    type="email"
                    value={identity.recoveryEmail}
                    onChange={(event) => updateIdentity("recoveryEmail", event.target.value)}
                  />
                </Box>
                <ErgSelect
                  label="Cách gửi thông tin đăng nhập"
                  options={[
                    { label: "Gửi email mời", value: "EMAIL_INVITE" },
                    { label: "Tạo mật khẩu dùng một lần", value: "ONE_TIME_PASSWORD" },
                  ]}
                  value={identity.credentialDelivery}
                  onChange={(event) => updateIdentity("credentialDelivery", event.target.value as TeacherCredentialDelivery)}
                />
              </Stack>
            ) : null}
            {step === 1 ? (
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                <OptionPanel title="Nhóm quyền giáo viên" error={fieldErrors.roleGroupIds}>
                  {compatibleRoleGroups.map((roleGroup) => (
                    <FormControlLabel
                      key={roleGroup.id}
                      control={
                        <Checkbox
                          checked={selectedRoleGroupIds.includes(roleGroup.id)}
                          onChange={(_, checked) =>
                            setSelectedRoleGroupIds((current) =>
                              checked ? [...current, roleGroup.id] : current.filter((id) => id !== roleGroup.id),
                            )
                          }
                        />
                      }
                      label={roleGroup.name}
                    />
                  ))}
                </OptionPanel>
                <Stack spacing={2}>
                  <OptionPanel title="Phạm vi truy cập" error={fieldErrors.policies}>
                    {options.scopes.map((scope) => (
                      <FormControlLabel
                        key={`${scope.scopeType}:${scope.scopeId}`}
                        control={
                          <Radio
                            checked={selectedScopeId === scope.scopeId}
                            name="teacher-access-scope"
                            onChange={() => setSelectedScopeId(scope.scopeId)}
                          />
                        }
                        label={`${scope.name} · ${scope.badge}`}
                      />
                    ))}
                  </OptionPanel>
                  <OptionPanel title="Module">
                    {options.modules.map((module) => (
                      <FormControlLabel
                        key={module.id}
                        control={
                          <Checkbox
                            checked={selectedModuleIds.includes(module.id)}
                            onChange={(_, checked) =>
                              setSelectedModuleIds((current) =>
                                checked ? [...current, module.id] : current.filter((id) => id !== module.id),
                              )
                            }
                          />
                        }
                        label={module.name}
                      />
                    ))}
                  </OptionPanel>
                </Stack>
              </Box>
            ) : null}
            {step === 2 ? (
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Stack divider={<Divider flexItem />} spacing={1.5}>
                  <ReviewRow label="Giáo viên" value={`${identity.fullName.trim()} · ${identity.primaryEmail.trim().toLowerCase()}`} />
                  <ReviewRow label="Nhóm quyền" value={selectedRoleGroupIds.join(", ")} />
                  <ReviewRow label="Phạm vi" value={selectedScope?.name ?? "—"} />
                  <ReviewRow label="Module" value={selectedModuleIds.join(", ")} />
                  <ReviewRow
                    label="Cấp thông tin đăng nhập"
                    value={identity.credentialDelivery === "EMAIL_INVITE" ? "Email mời" : "Mật khẩu dùng một lần"}
                  />
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {result ? (
          <Button variant="contained" onClick={closeDialog}>Đóng</Button>
        ) : (
          <>
            <Button disabled={submitting} onClick={step === 0 ? closeDialog : () => setStep((current) => current - 1)}>
              {step === 0 ? "Hủy" : "Quay lại"}
            </Button>
            {step < steps.length - 1 ? (
              <Button variant="contained" onClick={continueToNextStep}>Tiếp tục</Button>
            ) : (
              <Button disabled={submitting} variant="contained" onClick={() => void submit()}>
                {submitting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                Tạo tài khoản
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function OptionPanel({ children, error, title }: { children: React.ReactNode; error?: string; title: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography sx={{ fontWeight: 700 }} variant="subtitle2">{title}</Typography>
      <Stack sx={{ mt: 1 }}>{children}</Stack>
      {error ? <FormHelperText error>{error}</FormHelperText> : null}
    </Paper>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "180px minmax(0, 1fr)" }}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography sx={{ fontWeight: 600 }} variant="body2">{value}</Typography>
    </Box>
  );
}

function SuccessResult({ result }: { result: CreateTeacherAccountResponse }) {
  return (
    <Stack spacing={2} aria-live="polite">
      <Alert severity={result.deliveryStatus === "FAILED" ? "warning" : "success"}>
        <Typography sx={{ fontWeight: 700 }}>Đã tạo tài khoản giáo viên</Typography>
        <Typography variant="body2">{result.user.fullName} · {result.user.primaryEmail}</Typography>
      </Alert>
      {result.oneTimePassword ? (
        <Paper variant="outlined" sx={{ alignItems: "center", display: "flex", gap: 1.5, p: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="caption">Mật khẩu dùng một lần — chỉ hiển thị trong lần này</Typography>
            <Typography sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{result.oneTimePassword}</Typography>
          </Box>
          <IconButton
            aria-label="Sao chép mật khẩu dùng một lần"
            onClick={() => void navigator.clipboard?.writeText(result.oneTimePassword ?? "")}
          >
            <ContentCopyIcon />
          </IconButton>
        </Paper>
      ) : null}
    </Stack>
  );
}

function validateIdentity(identity: IdentityDraft) {
  const errors: Record<string, string> = {};
  const primaryEmail = identity.primaryEmail.trim().toLowerCase();
  const recoveryEmail = identity.recoveryEmail.trim().toLowerCase();
  if (!identity.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
  if (!isEmail(primaryEmail)) errors.primaryEmail = "Email đăng nhập không hợp lệ.";
  if (identity.phone.trim() && !/^\+?[0-9][0-9 .-]{7,14}$/.test(identity.phone.trim())) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }
  if (recoveryEmail && !isEmail(recoveryEmail)) errors.recoveryEmail = "Email khôi phục không hợp lệ.";
  if (recoveryEmail && recoveryEmail === primaryEmail) errors.recoveryEmail = "Email khôi phục phải khác email đăng nhập.";
  return errors;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function optionalValue(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}
