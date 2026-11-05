import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";

import { Navigate, useLocation } from "@tanstack/react-router";
import { ErgButton, ErgTextField } from "@/components/erg-mui";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { displayText, validateLibraryLoginEmail } from "@/features/lms/learning-resources/components/learning-resource-library-utils";

function LibraryAccessGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const auth = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: auth.loginForm,
    onSubmit: () => handleSubmit(),
  });

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      await auth.actions.login();
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "Không thể đăng nhập tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderLogin(provider: "google") {
    setIsSubmitting(true);

    try {
      await auth.actions.loginByProvider(provider);
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "Không thể đăng nhập tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "calc(100vh - 96px)" }}>
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ ...containerSx, alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center", py: 1.5 }}>
          {["Mầm non", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
            <Typography
              key={grade}
              component="span"
              variant="subtitle2"
              sx={
                grade === "7"
                  ? { bgcolor: primaryTint, borderRadius: 0.75, color: "primary.main", px: 1.5, py: 1 }
                  : { borderRadius: 0.75, color: "text.secondary", px: 1.5, py: 1 }
              }
            >
              {grade}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ ...containerSx, display: "grid", gap: 2.5, gridTemplateColumns: { lg: "minmax(0, 1fr) 400px" }, py: 3 }}>
        <Box component="section" sx={{ ...panelSx, overflow: "hidden" }}>
          <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", color: "text.primary", p: 2.5 }}>
            <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
                  Kho học liệu ERG
                </Typography>
                <Typography component="h1" variant="h3" sx={{ lineHeight: 1.25, maxWidth: 768, mt: 1 }}>
                  Đăng nhập để mở kho học liệu.
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, maxWidth: 672, mt: 1 }}>
                  Trang chủ có thể xem công khai. Các tài liệu, bài giảng điện tử, file PDF, video, IC3, MOS và Tin học chỉ mở sau khi xác thực tài khoản giáo viên.
                </Typography>
              </div>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: "background.default",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  color: "primary.main",
                  display: { xs: "none", md: "flex" },
                  flexShrink: 0,
                  height: 40,
                  justifyContent: "center",
                  width: 40,
                }}
              >
                <LockOutlinedIcon fontSize="small" />
              </Box>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { md: "repeat(3, minmax(0, 1fr))" } }}>
            {[
              { label: "Sách và PDF", value: "PDF" },
              { label: "Bài giảng điện tử", value: "PPTX" },
              { label: "IC3 / MOS / Tin học", value: "API thật" },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{ borderColor: "divider", borderRight: { md: 1 }, borderTop: 1, p: 2.5, "&:last-of-type": { borderRight: { md: 0 } } }}
              >
                <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "fontWeightBold" }}>
                  {item.label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box component="section" sx={{ ...panelSx, p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box
              sx={{ alignItems: "center", bgcolor: primaryTint, borderRadius: 1, color: "primary.main", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}
            >
              <LockOutlinedIcon fontSize="small" />
            </Box>
            <div>
              <Typography component="h2" variant="h5">
                Đăng nhập giáo viên
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, mt: 0.5 }}>
                Sử dụng tài khoản được cấp quyền Học liệu hoặc LMS để tiếp tục.
              </Typography>
            </div>
          </Stack>

          {auth.notice ? (
            <Typography
              component="div"
              variant="body2"
              sx={{ bgcolor: "error.light", border: 1, borderColor: (t) => alpha(t.palette.error.main, 0.3), borderRadius: 0.75, color: "error.dark", fontWeight: "fontWeightMedium", mt: 2.5, px: 2, py: 1.5 }}
            >
              {displayText(auth.notice.message)}
            </Typography>
          ) : null}
          <Stack
            component="form"
            spacing={2}
            sx={{ mt: 2.5 }}
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => validateLibraryLoginEmail(value),
              }}
            >
              {(field) => (
                <ErgTextField
                  label="Email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                    auth.setLoginForm({ ...auth.loginForm, email: event.target.value });
                  }}
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors[0]}
                />
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => (value ? undefined : "Password is required."),
              }}
            >
              {(field) => (
                <ErgTextField
                  label="Mat khau"
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                    auth.setLoginForm({ ...auth.loginForm, password: event.target.value });
                  }}
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors[0]}
                />
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, formSubmitting]) => (
                <ErgButton variant="contained" fullWidth disabled={!canSubmit || isSubmitting || formSubmitting} type="submit" sx={{ height: 40 }}>
                  Dang nhap va mo kho hoc lieu
                </ErgButton>
              )}
            </form.Subscribe>
          </Stack>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" }, mt: 2 }}>
            <ErgButton variant="outlined" disabled={isSubmitting} type="button" onClick={() => void handleProviderLogin("google")} sx={{ height: 40 }}>
              Google
            </ErgButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const containerSx = { maxWidth: "86rem", mx: "auto", px: { xs: 2, sm: 3, lg: 4 } } as const;

const panelSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, boxShadow: 1 } as const;

const primaryTint = (t: Theme) => alpha(t.palette.primary.main, 0.08);

export function LearningResourceLoginPage() {
  const location = useLocation();
  const [account, setAccount] = useState(() => getCurrentAccount());
  const redirectPath = new URLSearchParams(location.searchStr).get("redirect") || "/kho-hoc-lieu/1";
  const safeRedirectPath = sanitizeLocalRedirect(redirectPath) ?? "/kho-hoc-lieu/1";

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  if (account) {
    return <Navigate replace to={safeRedirectPath} />;
  }

  return <LibraryAccessGate onAuthenticated={() => setAccount(getCurrentAccount())} />;
}
