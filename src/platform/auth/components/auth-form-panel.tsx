import {
  forwardRef,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useForm } from "@tanstack/react-form";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { TsForm } from "@/components/erg-mui/tanstack-form";
import {
  LOGIN_CREDENTIAL_LABEL,
  LOGIN_CREDENTIAL_PLACEHOLDER,
  LOGIN_SUBTITLE,
} from "@/platform/auth/components/portal-login-copy";
import type { LoginFormState } from "@/platform/auth/types/auth-types";
import { useI18n } from "@/platform/i18n";

export function AuthFormPanel({
  rememberMe,
  showPassword,
  loginForm,
  onRememberMeChange,
  onShowPasswordToggle,
  onLoginFormChange,
  onLoginSubmit,
  onForgotPassword,
  loginTitle,
  loginSubtitle = LOGIN_SUBTITLE,
  credentialLabel = LOGIN_CREDENTIAL_LABEL,
  credentialPlaceholder = LOGIN_CREDENTIAL_PLACEHOLDER,
}: {
  rememberMe: boolean;
  showPassword: boolean;
  loginForm: LoginFormState;
  onRememberMeChange: (rememberMe: boolean) => void;
  onShowPasswordToggle: () => void;
  onLoginFormChange: (value: LoginFormState) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  loginTitle?: string;
  loginSubtitle?: string;
  credentialLabel?: string;
  credentialPlaceholder?: string;
}) {
  const { t } = useI18n();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const loginTanstackForm = useForm({
    defaultValues: loginForm,
    onSubmit: () => onLoginSubmit(createHandledSubmitEvent()),
  });

  function focusPasswordFromEmail(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key !== "Tab" || event.shiftKey) && event.key !== "Enter") return;

    event.preventDefault();
    passwordInputRef.current?.focus();
  }

  return (
    <Box component="section" sx={{ width: "100%" }}>
      <Box component="header">
        <Typography component="h1" variant="h1">{loginTitle ?? t("auth.login")}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{loginSubtitle}</Typography>
      </Box>

      <Box component={TsForm}
        sx={{ display: "grid", gap: 2, mt: 3 }}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void loginTanstackForm.handleSubmit();
        }}
      >
        <loginTanstackForm.Field
          name="email"
          validators={{
            onChange: ({ value }) => validateRequired(value, credentialLabel),
          }}
        >
          {(field) => (
            <AuthField
              autoComplete="username"
              error={shownError(field.state.meta, field.form.state.submissionAttempts)}
              icon={<EmailRoundedIcon fontSize="small" />}
              label={credentialLabel}
              onBlur={field.handleBlur}
              onChange={(value) => {
                field.handleChange(value);
                onLoginFormChange({ ...loginForm, email: value });
              }}
              onKeyDown={focusPasswordFromEmail}
              placeholder={credentialPlaceholder}
              value={field.state.value}
            />
          )}
        </loginTanstackForm.Field>

        <loginTanstackForm.Field
          name="password"
          validators={{
            onChange: ({ value }) => validatePassword(value),
          }}
        >
          {(field) => (
            <AuthField
              ref={passwordInputRef}
              autoComplete="current-password"
              error={shownError(field.state.meta, field.form.state.submissionAttempts)}
              icon={<LockRoundedIcon fontSize="small" />}
              label={t("auth.password")}
              onBlur={() => {
                setCapsLockOn(false);
                field.handleBlur();
              }}
              onChange={(value) => {
                field.handleChange(value);
                onLoginFormChange({ ...loginForm, password: value });
              }}
              onKeyUp={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
              placeholder={t("auth.enterPassword")}
              type={showPassword ? "text" : "password"}
              value={field.state.value}
              warning={capsLockOn ? "Caps Lock đang bật." : undefined}
              action={
                <ButtonBase
                  aria-label={t("auth.showHidePassword")}
                  sx={{ borderRadius: 1, color: "text.secondary", display: "grid", flexShrink: 0, height: 44, placeItems: "center", width: 44, "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}
                  onClick={onShowPasswordToggle}
                >
                  {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                </ButtonBase>
              }
            />
          )}
        </loginTanstackForm.Field>

        <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, justifyContent: "space-between" }}>
          <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(event) => onRememberMeChange(event.target.checked)} />} label={t("auth.rememberMe")} slotProps={{ typography: { variant: "caption" } }} sx={{ color: "text.secondary", m: 0, minHeight: 44 }} />
          <ButtonBase
            sx={{ color: "primary.main", minHeight: 44, px: 1, typography: "caption", "&:hover": { color: "primary.dark", textDecoration: "underline" } }}
            onClick={onForgotPassword}
          >
            {t("auth.forgotPassword")}
          </ButtonBase>
        </Box>

        <loginTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              variant="contained"
              fullWidth
              sx={{ minHeight: 44 }}
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Đang đăng nhập..." : t("auth.login")}
            </Button>
          )}
        </loginTanstackForm.Subscribe>
      </Box>
    </Box>
  );
}

const AuthField = forwardRef<HTMLInputElement, {
  action?: ReactNode;
  autoComplete?: string;
  error?: string;
  icon?: ReactNode;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onKeyUp?: KeyboardEventHandler<HTMLInputElement>;
  placeholder: string;
  type?: string;
  value: string;
  warning?: string;
}>(function AuthField({
    action,
    autoComplete,
    error,
    icon,
    label,
    onBlur,
    onChange,
    onKeyDown,
    onKeyUp,
    placeholder,
    type = "text",
    value,
    warning,
  },
  ref,
) {
    return (
      <Box component="label" sx={{ display: "grid", gap: 1 }}>
        <Typography color="text.secondary" component="span" variant="caption">{label}</Typography>
        <Box
          component="span"
          sx={(theme) => ({
            alignItems: "center",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: error ? "error.main" : "divider",
            borderRadius: 1,
            color: "text.secondary",
            display: "flex",
            gap: 1,
            minHeight: 44,
            px: 1.5,
            transition: "border-color 160ms ease, box-shadow 160ms ease",
            "&:focus-within": { borderColor: "primary.main", boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}` },
          })}
        >
          {icon}
          <InputBase
            fullWidth
            error={Boolean(error)}
            autoComplete={autoComplete}
            sx={{ minHeight: 42 }}
            placeholder={placeholder}
            inputRef={ref}
            inputProps={{ "aria-invalid": error ? "true" : undefined }}
            type={type}
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
          {action}
        </Box>
        {warning ? <FormHelperText role="status" sx={{ color: "warning.dark", m: 0 }}>{warning}</FormHelperText> : null}
        <FormHelperText error sx={{ m: 0 }}>{error}</FormHelperText>
      </Box>
    );
});

// Errors wait for blur or submit: iOS fires input events on focus/autofill, which made the
// empty-field error show on first render while the keyboard was still opening.
function shownError(meta: { errors: ReadonlyArray<string | undefined>; isBlurred: boolean }, submissionAttempts: number) {
  return meta.isBlurred || submissionAttempts > 0 ? meta.errors[0] : undefined;
}

function createHandledSubmitEvent() {
  return {
    preventDefault() {},
    stopPropagation() {},
  } as FormEvent<HTMLFormElement>;
}

function validateRequired(value: string, label: string) {
  return value.trim() ? undefined : `${label} là bắt buộc.`;
}

function validatePassword(value: string) {
  if (!value) return "Mật khẩu là bắt buộc.";
  return value.length >= 6 ? undefined : "Mật khẩu tối thiểu 6 ký tự.";
}
