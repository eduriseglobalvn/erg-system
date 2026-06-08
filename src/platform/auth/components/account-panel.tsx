import type { FormEvent } from "react";

import { TsForm } from "@/components/ui/tanstack-form";
import { getLmsPortalUrl } from "@/config/portal-urls";
import { roleLabel, providerLabel } from "@/platform/auth/api/auth-storage";
import { CheckIcon } from "@/platform/auth/components/auth-icons";
import {
  Field,
  MetaBadge,
  MetaRow,
} from "@/platform/auth/components/auth-shared";
import { formatDate, inputClassName, submitButtonClassName } from "@/platform/auth/components/auth-shared-styles";
import type {
  AccountTab,
  PasswordFormState,
  ProfileFormState,
  TeacherAccount,
} from "@/platform/auth/types/auth-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/utils/cn";

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
    <div className="flex h-full flex-col">
      <div className="rounded-lg border border-[#0b5cab] bg-[var(--erg-blue)] px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
              {t("auth.accountBadge")}
            </div>
            <h2 className="mt-3 text-xl font-semibold">{account.fullName}</h2>
            <p className="mt-1.5 text-sm text-white/75">{account.email}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <MetaBadge>{roleLabel(account.role)}</MetaBadge>
              <MetaBadge>{account.title}</MetaBadge>
              <MetaBadge>{providerLabel(account.provider)}</MetaBadge>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {t("common.logout")}
          </button>
        </div>
      </div>

      <div className="mt-6 inline-flex w-fit rounded-lg border border-[#d7e0ec] bg-[#f6f8fb] p-1 shadow-sm">
        {[
          { id: "profile" as const, label: t("auth.profile") },
          { id: "security" as const, label: t("auth.security") },
          { id: "permissions" as const, label: t("auth.accessRights") },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAccountTabChange(item.id)}
            className={cn(
              "relative rounded-md border border-transparent px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-slate-950",
              accountTab === item.id ? "border-[#b8d6fa] bg-white text-[var(--erg-blue)] shadow-sm after:absolute after:inset-x-5 after:bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--erg-blue)]" : "text-slate-600",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          {accountTab === "profile" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{t("auth.accountInfo")}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{t("auth.accountInfoSubtitle")}</p>
              </div>

              <TsForm className="mt-6 space-y-5" onSubmit={onProfileSubmit}>
                <Field label={t("auth.fullName")}>
                  <input
                    className={inputClassName}
                    required
                    value={profileForm.fullName}
                    onChange={(event) => onProfileFormChange({ ...profileForm, fullName: event.target.value })}
                    type="text"
                  />
                </Field>
                <Field label="Số điện thoại">
                  <input
                    className={inputClassName}
                    value={profileForm.phone}
                    onChange={(event) => onProfileFormChange({ ...profileForm, phone: event.target.value })}
                    type="tel"
                  />
                </Field>
                <Field label={t("auth.department")}>
                  <input
                    className={inputClassName}
                    value={profileForm.department}
                    onChange={(event) => onProfileFormChange({ ...profileForm, department: event.target.value })}
                    type="text"
                  />
                </Field>
                <Field label={t("auth.title")}>
                  <input
                    className={inputClassName}
                    value={profileForm.title}
                    onChange={(event) => onProfileFormChange({ ...profileForm, title: event.target.value })}
                    type="text"
                  />
                </Field>
                <Field label={t("auth.accountEmail")}>
                  <input className={cn(inputClassName, "bg-slate-50 text-slate-500")} defaultValue={account.email} disabled type="email" />
                </Field>

                <button className={submitButtonClassName} disabled={!profileForm.fullName.trim()} type="submit">
                  {t("auth.saveInfo")}
                </button>
              </TsForm>
            </div>
          ) : null}

          {accountTab === "security" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{t("auth.accountSecurity")}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{t("auth.accountSecuritySubtitle")}</p>
              </div>

              <TsForm className="mt-6 space-y-5" onSubmit={onPasswordSubmit}>
                <Field label={t("auth.currentPassword")}>
                  <input
                    className={inputClassName}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(event) => onPasswordFormChange({ ...passwordForm, currentPassword: event.target.value })}
                    type="password"
                  />
                </Field>
                <Field label={t("auth.newPassword")}>
                  <input
                    className={inputClassName}
                    minLength={6}
                    required
                    value={passwordForm.nextPassword}
                    onChange={(event) => onPasswordFormChange({ ...passwordForm, nextPassword: event.target.value })}
                    type="password"
                  />
                </Field>
                <Field label={t("auth.confirmNewPassword")}>
                  <input
                    className={inputClassName}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(event) => onPasswordFormChange({ ...passwordForm, confirmPassword: event.target.value })}
                    type="password"
                  />
                </Field>

                <button
                  className={submitButtonClassName}
                  disabled={
                    !passwordForm.currentPassword.trim() ||
                    passwordForm.nextPassword.length < 6 ||
                    passwordForm.confirmPassword !== passwordForm.nextPassword
                  }
                  type="submit"
                >
                  {t("auth.updatePassword")}
                </button>
              </TsForm>
            </div>
          ) : null}

          {accountTab === "permissions" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{t("auth.accountPermissions")}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{t("auth.accountPermissionsSubtitle")}</p>
              </div>

              <div className="mt-6 grid gap-4">
                {capabilities.map((item) => (
                  <div key={item} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--erg-blue)] text-white">
                      <CheckIcon />
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-950">{t("auth.quickAccess")}</h3>
            <div className="mt-4 grid gap-3">
              <ExternalQuickLinkCard href={getLmsPortalUrl()} title={t("auth.goDashboard")} caption={t("auth.goDashboardCaption")} />
              <ExternalQuickLinkCard href={getLmsPortalUrl("/student")} title={t("auth.viewStudentUi")} caption={t("auth.viewStudentUiCaption")} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-950">{t("auth.accountSession")}</h3>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <MetaRow label={t("auth.role")} value={roleLabel(account.role)} />
              <MetaRow label={t("auth.loginMethod")} value={providerLabel(account.provider)} />
              <MetaRow label={t("auth.department")} value={account.department} />
              <MetaRow label={t("auth.lastSeen")} value={formatDate(account.lastLoginAt)} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-950">{t("auth.nextDeploymentHint")}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{t("auth.nextDeploymentHintBody")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalQuickLinkCard({ href, title, caption }: { href: string; title: string; caption: string }) {
  return (
    <a
      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
      href={href}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{caption}</div>
    </a>
  );
}
