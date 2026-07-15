import type { FormEvent } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

import { TsForm } from "@/components/ui/tanstack-form";
import { getLmsPortalUrl } from "@/config/portal-urls";
import { roleLabel, providerLabel } from "@/platform/auth/api/auth-storage";
import { CheckIcon } from "@/platform/auth/components/auth-icons";
import {
  Field,
  MetaBadge,
  MetaRow,
} from "@/platform/auth/components/auth-shared";
import { formatDate } from "@/platform/auth/components/auth-shared-styles";
import type {
  AccountTab,
  PasswordFormState,
  ProfileFormState,
  TeacherAccount,
} from "@/platform/auth/types/auth-types";
import { useI18n } from "@/platform/i18n";

export function AccountPanel({
  account,
  accountTab,
  profileForm,
  passwordForm,
  capabilities,
  onAccountTabChange,
  onProfileFormChange,
  onPasswordFormChange,
  onProfileSubmit,
  onPasswordSubmit,
  onLogout,
}: {
  account: TeacherAccount;
  accountTab: AccountTab;
  profileForm: ProfileFormState;
  passwordForm: PasswordFormState;
  capabilities: string[];
  onAccountTabChange: (tab: AccountTab) => void;
  onProfileFormChange: (value: ProfileFormState) => void;
  onPasswordFormChange: (value: PasswordFormState) => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
}) {
  const { t } = useI18n();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Paper elevation={1} sx={{ bgcolor: "primary.main", border: "1px solid #0b5cab", color: "primary.contrastText", px: 3, py: 3 }}>
        <Box sx={{ alignItems: { sm: "flex-start" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2.5, justifyContent: { sm: "space-between" } }}>
          <Box>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 1, color: "rgba(255,255,255,0.75)", display: "inline-flex", fontSize: 12, fontWeight: 700, px: 1.5, py: 0.5 }}>
              {t("auth.accountBadge")}
            </Box>
            <Box component="h2" sx={{ fontSize: 20, fontWeight: 700, m: 0, mt: 1.5 }}>{account.fullName}</Box>
            <Box component="p" sx={{ color: "rgba(255,255,255,0.75)", fontSize: 14, m: 0, mt: 0.75 }}>{account.email}</Box>
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              <MetaBadge>{roleLabel(account.role)}</MetaBadge>
              <MetaBadge>{account.title}</MetaBadge>
              <MetaBadge>{providerLabel(account.provider)}</MetaBadge>
            </Box>
          </Box>

          <Button
            onClick={onLogout}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)", color: "inherit", height: 44, px: 2.5, "&:hover": { bgcolor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" } }}
            variant="outlined"
          >
            {t("common.logout")}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ bgcolor: "#f6f8fb", border: "1px solid #d7e0ec", display: "inline-flex", mt: 3, p: 0.5, width: "fit-content" }}>
        {[
          { id: "profile" as const, label: t("auth.profile") },
          { id: "security" as const, label: t("auth.security") },
          { id: "permissions" as const, label: t("auth.accessRights") },
        ].map((item) => (
          <ButtonBase
            key={item.id}
            type="button"
            onClick={() => onAccountTabChange(item.id)}
            sx={{ border: "1px solid", borderColor: accountTab === item.id ? "#b8d6fa" : "transparent", borderRadius: 1, boxShadow: accountTab === item.id ? 1 : 0, color: accountTab === item.id ? "primary.main" : "text.secondary", fontSize: 14, fontWeight: 700, px: 2, py: 1, position: "relative", ...(accountTab === item.id ? { bgcolor: "background.paper", "&::after": { bgcolor: "primary.main", borderRadius: 999, bottom: 4, content: '\"\"', height: 2, left: 20, position: "absolute", right: 20 } } : { "&:hover": { bgcolor: "background.paper", color: "text.primary" } }) }}
          >
            {item.label}
          </ButtonBase>
        ))}
      </Paper>

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xl: "minmax(0,1fr) 280px" }, mt: 3 }}>
        <Box sx={{ display: "grid", gap: 3 }}>
          {accountTab === "profile" ? (
            <Paper elevation={1} sx={{ border: "1px solid", borderColor: "divider", p: 3 }}>
              <Box><Box component="h3" sx={{ fontSize: 16, fontWeight: 700, m: 0 }}>{t("auth.accountInfo")}</Box><Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.75, m: 0, mt: 1 }}>{t("auth.accountInfoSubtitle")}</Box></Box>

              <Box component={TsForm} sx={{ display: "grid", gap: 2.5, mt: 3 }} onSubmit={onProfileSubmit}>
                <Field label={t("auth.fullName")}>
                  <TextField fullWidth size="small"
                    required
                    value={profileForm.fullName}
                    onChange={(event) => onProfileFormChange({ ...profileForm, fullName: event.target.value })}
                    type="text"
                  />
                </Field>
                <Field label="Số điện thoại">
                  <TextField fullWidth size="small"
                    value={profileForm.phone}
                    onChange={(event) => onProfileFormChange({ ...profileForm, phone: event.target.value })}
                    type="tel"
                  />
                </Field>
                <Field label={t("auth.department")}>
                  <TextField fullWidth size="small"
                    value={profileForm.department}
                    onChange={(event) => onProfileFormChange({ ...profileForm, department: event.target.value })}
                    type="text"
                  />
                </Field>
                <Field label={t("auth.title")}>
                  <TextField fullWidth size="small"
                    value={profileForm.title}
                    onChange={(event) => onProfileFormChange({ ...profileForm, title: event.target.value })}
                    type="text"
                  />
                </Field>
                <Field label={t("auth.accountEmail")}>
                  <TextField fullWidth size="small" defaultValue={account.email} disabled type="email" />
                </Field>

                <Button disabled={!profileForm.fullName.trim()} type="submit" variant="contained">
                  {t("auth.saveInfo")}
                </Button>
              </Box>
            </Paper>
          ) : null}

          {accountTab === "security" ? (
            <Paper elevation={1} sx={{ border: "1px solid", borderColor: "divider", p: 3 }}>
              <Box><Box component="h3" sx={{ fontSize: 16, fontWeight: 700, m: 0 }}>{t("auth.accountSecurity")}</Box><Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.75, m: 0, mt: 1 }}>{t("auth.accountSecuritySubtitle")}</Box></Box>

              <Box component={TsForm} sx={{ display: "grid", gap: 2.5, mt: 3 }} onSubmit={onPasswordSubmit}>
                <Field label={t("auth.currentPassword")}>
                  <TextField fullWidth size="small"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(event) => onPasswordFormChange({ ...passwordForm, currentPassword: event.target.value })}
                    type="password"
                  />
                </Field>
                <Field label={t("auth.newPassword")}>
                  <TextField fullWidth size="small"
                    slotProps={{ htmlInput: { minLength: 6 } }}
                    required
                    value={passwordForm.nextPassword}
                    onChange={(event) => onPasswordFormChange({ ...passwordForm, nextPassword: event.target.value })}
                    type="password"
                  />
                </Field>
                <Field label={t("auth.confirmNewPassword")}>
                  <TextField fullWidth size="small"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(event) => onPasswordFormChange({ ...passwordForm, confirmPassword: event.target.value })}
                    type="password"
                  />
                </Field>

                <Button variant="contained"
                  disabled={
                    !passwordForm.currentPassword.trim() ||
                    passwordForm.nextPassword.length < 6 ||
                    passwordForm.confirmPassword !== passwordForm.nextPassword
                  }
                  type="submit"
                >
                  {t("auth.updatePassword")}
                </Button>
              </Box>
            </Paper>
          ) : null}

          {accountTab === "permissions" ? (
            <Paper elevation={1} sx={{ border: "1px solid", borderColor: "divider", p: 3 }}>
              <Box><Box component="h3" sx={{ fontSize: 16, fontWeight: 700, m: 0 }}>{t("auth.accountPermissions")}</Box><Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.75, m: 0, mt: 1 }}>{t("auth.accountPermissionsSubtitle")}</Box></Box>

              <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
                {capabilities.map((item) => (
                  <Paper key={item} elevation={0} sx={{ alignItems: "flex-start", bgcolor: "background.default", border: "1px solid", borderColor: "divider", display: "flex", gap: 2, px: 2, py: 2 }}>
                    <Box component="span" sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "primary.contrastText", display: "inline-flex", height: 28, justifyContent: "center", mt: 0.5, width: 28 }}>
                      <CheckIcon />
                    </Box>
                    <Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.5, m: 0 }}>{item}</Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          ) : null}
        </Box>

        <Box sx={{ display: "grid", gap: 3 }}>
          <Paper elevation={1} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
            <Box component="h3" sx={{ fontSize: 16, fontWeight: 700, m: 0 }}>{t("auth.quickAccess")}</Box>
            <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
              <ExternalQuickLinkCard href={getLmsPortalUrl()} title={t("auth.goDashboard")} caption={t("auth.goDashboardCaption")} />
              <ExternalQuickLinkCard href={getLmsPortalUrl("/student")} title={t("auth.viewStudentUi")} caption={t("auth.viewStudentUiCaption")} />
            </Box>
          </Paper>

          <Paper elevation={1} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
            <Box component="h3" sx={{ fontSize: 16, fontWeight: 700, m: 0 }}>{t("auth.accountSession")}</Box>
            <Box sx={{ color: "text.secondary", display: "grid", fontSize: 14, gap: 1.5, lineHeight: 1.75, mt: 2 }}>
              <MetaRow label={t("auth.role")} value={roleLabel(account.role)} />
              <MetaRow label={t("auth.loginMethod")} value={providerLabel(account.provider)} />
              <MetaRow label={t("auth.department")} value={account.department} />
              <MetaRow label={t("auth.lastSeen")} value={formatDate(account.lastLoginAt)} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", p: 2.5 }}>
            <Box component="h3" sx={{ fontSize: 16, fontWeight: 700, m: 0 }}>{t("auth.nextDeploymentHint")}</Box>
            <Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.75, m: 0, mt: 1.5 }}>{t("auth.nextDeploymentHintBody")}</Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

function ExternalQuickLinkCard({ href, title, caption }: { href: string; title: string; caption: string }) {
  return (
    <Paper component="a" elevation={0} href={href} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", color: "inherit", display: "block", px: 2, py: 2, textDecoration: "none", transition: "background-color 160ms ease, border-color 160ms ease", "&:hover": { bgcolor: "background.paper", borderColor: "text.disabled" } }}>
      <Box sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Box>
      <Box sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.5, mt: 0.5 }}>{caption}</Box>
    </Paper>
  );
}
